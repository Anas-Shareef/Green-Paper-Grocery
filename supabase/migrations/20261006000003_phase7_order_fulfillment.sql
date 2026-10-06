-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 7: Order Management, Fulfillment & Delivery Operations
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. EXTEND order_status ENUM WITH 'failed_delivery' IF NOT PRESENT
DO $$ BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'failed_delivery';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. OPERATIONAL FIELDS ON orders TABLE
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT,
    ADD COLUMN IF NOT EXISTS recipient_name TEXT,
    ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

-- Indexes for efficient admin queue filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);

-- 3. ITEM-LEVEL FULFILLMENT FIELDS ON order_items
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (fulfillment_status IN ('pending', 'picked', 'packed', 'unavailable')),
    ADD COLUMN IF NOT EXISTS prepared_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000
        CHECK (prepared_quantity >= 0);

-- 4. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id, created_at ASC);

-- Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_status_history_staff_select" ON public.order_status_history;
CREATE POLICY "order_status_history_staff_select" ON public.order_status_history
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "order_status_history_customer_select" ON public.order_status_history;
CREATE POLICY "order_status_history_customer_select" ON public.order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.customers c ON c.id = o.customer_id
            WHERE o.id = order_status_history.order_id
            AND c.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "order_status_history_insert" ON public.order_status_history;
CREATE POLICY "order_status_history_insert" ON public.order_status_history
    FOR INSERT WITH CHECK (public.is_staff());

-- 5. ORDER NOTES TABLE (Internal and customer visible notes)
CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_notes_order ON public.order_notes(order_id, created_at DESC);

-- Enable RLS on order_notes
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_notes_staff_all" ON public.order_notes;
CREATE POLICY "order_notes_staff_all" ON public.order_notes
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "order_notes_customer_select" ON public.order_notes;
CREATE POLICY "order_notes_customer_select" ON public.order_notes
    FOR SELECT USING (
        visibility = 'customer' AND
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.customers c ON c.id = o.customer_id
            WHERE o.id = order_notes.order_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- 6. DELIVERIES TABLE (Dedicated delivery tracking)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'unassigned'
        CHECK (status IN ('unassigned', 'assigned', 'out_for_delivery', 'delivered', 'failed')),
    delivery_address TEXT NOT NULL,
    recipient_name TEXT,
    recipient_phone TEXT,
    delivery_notes TEXT,
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_to ON public.deliveries(assigned_to);

-- Enable RLS on deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliveries_staff_all" ON public.deliveries;
CREATE POLICY "deliveries_staff_all" ON public.deliveries
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "deliveries_customer_select" ON public.deliveries;
CREATE POLICY "deliveries_customer_select" ON public.deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.customers c ON c.id = o.customer_id
            WHERE o.id = deliveries.order_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- 7. ATOMIC STATE TRANSITION RPC
-- Concurrency safe with row-level locks, transition validation, status history, and notifications.
-- CRITICAL RULE: Stock is NOT mutated during normal delivery progression because stock was already reserved/deducted at checkout!
CREATE OR REPLACE FUNCTION public.transition_order_status_atomic(
    p_order_id UUID,
    p_next_status public.order_status,
    p_reason TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_driver_id UUID DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_actor_id UUID;
    v_now TIMESTAMPTZ := now();
    v_delivery_status TEXT;
    v_notif_title TEXT;
    v_notif_msg TEXT;
    v_customer_user_id UUID;
BEGIN
    -- 1. Identify actor (must be staff)
    v_actor_id := auth.uid();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can transition order status';
    END IF;

    -- 2. Lock target order row FOR UPDATE
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    -- 3. Idempotency check: if order is already in the requested status, return early
    IF v_order.status = p_next_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order already in target status',
            'order_id', p_order_id,
            'status', p_next_status
        );
    END IF;

    -- 4. State Machine Validation
    -- Allowed transitions:
    -- pending -> confirmed | cancelled
    -- confirmed -> preparing | cancelled
    -- preparing -> ready | cancelled
    -- ready -> out_for_delivery | cancelled
    -- out_for_delivery -> delivered | failed_delivery
    -- failed_delivery -> out_for_delivery | cancelled
    -- Terminal states: delivered, cancelled (cannot transition out)
    IF v_order.status = 'delivered' THEN
        RAISE EXCEPTION 'Order % has already been delivered and cannot be modified', v_order.order_number;
    END IF;

    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Order % is cancelled and cannot be transitioned', v_order.order_number;
    END IF;

    -- Validate specific progression
    IF p_next_status = 'confirmed' AND v_order.status != 'pending' THEN
        RAISE EXCEPTION 'Cannot confirm order from status %', v_order.status;
    ELSIF p_next_status = 'preparing' AND v_order.status != 'confirmed' THEN
        RAISE EXCEPTION 'Cannot start preparation from status %. Must be confirmed first.', v_order.status;
    ELSIF p_next_status = 'ready' AND v_order.status != 'preparing' THEN
        RAISE EXCEPTION 'Cannot mark order ready from status %. Must be preparing first.', v_order.status;
    ELSIF p_next_status = 'out_for_delivery' AND v_order.status NOT IN ('ready', 'failed_delivery') THEN
        RAISE EXCEPTION 'Cannot dispatch order from status %. Must be ready first.', v_order.status;
    ELSIF p_next_status = 'delivered' AND v_order.status != 'out_for_delivery' THEN
        RAISE EXCEPTION 'Cannot mark delivered from status %. Must be out for delivery.', v_order.status;
    ELSIF p_next_status = 'failed_delivery' AND v_order.status != 'out_for_delivery' THEN
        RAISE EXCEPTION 'Cannot mark delivery failed from status %. Must be out for delivery.', v_order.status;
    END IF;

    -- 5. Prepare timestamp and operational field updates
    IF p_next_status = 'confirmed' THEN
        UPDATE public.orders
        SET status = p_next_status,
            confirmed_at = COALESCE(confirmed_at, v_now),
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Order Confirmed';
        v_notif_msg := 'Order ' || v_order.order_number || ' has been confirmed by Baqqala staff.';

    ELSIF p_next_status = 'preparing' THEN
        UPDATE public.orders
        SET status = p_next_status,
            preparing_at = COALESCE(preparing_at, v_now),
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Order Being Prepared';
        v_notif_msg := 'We are packing the items for order ' || v_order.order_number || '.';

    ELSIF p_next_status = 'ready' THEN
        UPDATE public.orders
        SET status = p_next_status,
            ready_at = COALESCE(ready_at, v_now),
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Order Ready for Delivery';
        v_notif_msg := 'Order ' || v_order.order_number || ' is packed and awaiting dispatch.';

    ELSIF p_next_status = 'out_for_delivery' THEN
        IF p_driver_id IS NOT NULL THEN
            UPDATE public.orders
            SET assigned_driver_id = p_driver_id
            WHERE id = p_order_id;
        END IF;

        UPDATE public.orders
        SET status = p_next_status,
            out_for_delivery_at = COALESCE(out_for_delivery_at, v_now),
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Order Out for Delivery';
        v_notif_msg := 'Your grocery order ' || v_order.order_number || ' is on its way to your Zone 19 address.';

    ELSIF p_next_status = 'delivered' THEN
        UPDATE public.orders
        SET status = p_next_status,
            delivered_at = COALESCE(delivered_at, v_now),
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Order Delivered';
        v_notif_msg := 'Order ' || v_order.order_number || ' has been successfully delivered. Thank you!';

    ELSIF p_next_status = 'failed_delivery' THEN
        UPDATE public.orders
        SET status = p_next_status,
            failed_at = v_now,
            failure_reason = COALESCE(p_failure_reason, 'Delivery attempt unsuccessful'),
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Delivery Exception';
        v_notif_msg := 'Delivery could not be completed for order ' || v_order.order_number || '. Staff will contact you.';

    ELSIF p_next_status = 'cancelled' THEN
        RAISE EXCEPTION 'Please use cancel_order_staff_atomic for cancellation to handle stock restoration';
    END IF;

    -- 6. Synchronize deliveries record
    IF p_next_status = 'out_for_delivery' THEN
        v_delivery_status := 'out_for_delivery';
    ELSIF p_next_status = 'delivered' THEN
        v_delivery_status := 'delivered';
    ELSIF p_next_status = 'failed_delivery' THEN
        v_delivery_status := 'failed';
    ELSIF p_driver_id IS NOT NULL OR v_order.assigned_driver_id IS NOT NULL THEN
        v_delivery_status := 'assigned';
    ELSE
        v_delivery_status := 'unassigned';
    END IF;

    INSERT INTO public.deliveries (
        order_id,
        assigned_to,
        status,
        delivery_address,
        recipient_name,
        recipient_phone,
        delivery_notes,
        assigned_at,
        picked_up_at,
        delivered_at,
        failed_at,
        failure_reason,
        updated_at
    )
    VALUES (
        p_order_id,
        COALESCE(p_driver_id, v_order.assigned_driver_id),
        v_delivery_status,
        v_order.delivery_address,
        v_order.recipient_name,
        v_order.recipient_phone,
        v_order.delivery_notes,
        CASE WHEN (p_driver_id IS NOT NULL OR v_order.assigned_driver_id IS NOT NULL) THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'out_for_delivery' THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'delivered' THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'failed_delivery' THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'failed_delivery' THEN p_failure_reason ELSE NULL END,
        v_now
    )
    ON CONFLICT (order_id) DO UPDATE
    SET assigned_to = COALESCE(p_driver_id, deliveries.assigned_to),
        status = v_delivery_status,
        assigned_at = CASE WHEN (p_driver_id IS NOT NULL AND deliveries.assigned_at IS NULL) THEN v_now ELSE deliveries.assigned_at END,
        picked_up_at = CASE WHEN p_next_status = 'out_for_delivery' THEN v_now ELSE deliveries.picked_up_at END,
        delivered_at = CASE WHEN p_next_status = 'delivered' THEN v_now ELSE deliveries.delivered_at END,
        failed_at = CASE WHEN p_next_status = 'failed_delivery' THEN v_now ELSE deliveries.failed_at END,
        failure_reason = CASE WHEN p_next_status = 'failed_delivery' THEN p_failure_reason ELSE deliveries.failure_reason END,
        updated_at = v_now;

    -- 7. Record Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        reason,
        notes
    )
    VALUES (
        p_order_id,
        v_order.status,
        p_next_status,
        v_actor_id,
        p_reason,
        p_notes
    );

    -- 8. Customer Notification
    SELECT auth_user_id INTO v_customer_user_id
    FROM public.customers
    WHERE id = v_order.customer_id;

    IF v_customer_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            link,
            entity_type,
            entity_id
        )
        VALUES (
            v_customer_user_id,
            v_notif_title,
            v_notif_msg,
            CASE WHEN p_next_status = 'failed_delivery' THEN 'warning' ELSE 'info' END,
            '/account/orders/' || p_order_id,
            'orders',
            p_order_id
        );
    END IF;

    -- 9. Audit Logging
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_actor_id,
        'order_status_transition',
        'orders',
        p_order_id,
        jsonb_build_object('status', v_order.status),
        jsonb_build_object('status', p_next_status, 'driver_id', p_driver_id, 'reason', p_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'from_status', v_order.status,
        'to_status', p_next_status,
        'timestamp', v_now
    );
END;
$$;

-- 8. ASSIGN DELIVERY DRIVER RPC
CREATE OR REPLACE FUNCTION public.assign_order_delivery_atomic(
    p_order_id UUID,
    p_driver_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_driver RECORD;
    v_actor_id UUID;
    v_now TIMESTAMPTZ := now();
BEGIN
    v_actor_id := auth.uid();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can assign delivery personnel';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF v_order.status IN ('delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Cannot assign driver to order in status %', v_order.status;
    END IF;

    SELECT * INTO v_driver
    FROM public.profiles
    WHERE id = p_driver_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active driver profile % not found', p_driver_id;
    END IF;

    -- Update order assigned driver
    UPDATE public.orders
    SET assigned_driver_id = p_driver_id,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Update or create delivery record
    INSERT INTO public.deliveries (
        order_id,
        assigned_to,
        status,
        delivery_address,
        recipient_name,
        recipient_phone,
        delivery_notes,
        assigned_at,
        updated_at
    )
    VALUES (
        p_order_id,
        p_driver_id,
        'assigned',
        v_order.delivery_address,
        v_order.recipient_name,
        v_order.recipient_phone,
        COALESCE(p_notes, v_order.delivery_notes),
        v_now,
        v_now
    )
    ON CONFLICT (order_id) DO UPDATE
    SET assigned_to = p_driver_id,
        status = CASE WHEN deliveries.status = 'unassigned' THEN 'assigned' ELSE deliveries.status END,
        assigned_at = v_now,
        delivery_notes = COALESCE(p_notes, deliveries.delivery_notes),
        updated_at = v_now;

    -- Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_actor_id,
        'order_assign_driver',
        'orders',
        p_order_id,
        jsonb_build_object('assigned_driver_id', v_order.assigned_driver_id),
        jsonb_build_object('assigned_driver_id', p_driver_id, 'driver_name', v_driver.full_name)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'assigned_driver_id', p_driver_id,
        'driver_name', v_driver.full_name
    );
END;
$$;

-- 9. ITEM FULFILLMENT CHECKLIST RPC
CREATE OR REPLACE FUNCTION public.update_item_fulfillment_atomic(
    p_order_id UUID,
    p_item_id UUID,
    p_status TEXT,
    p_prepared_qty NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can update item fulfillment status';
    END IF;

    IF p_status NOT IN ('pending', 'picked', 'packed', 'unavailable') THEN
        RAISE EXCEPTION 'Invalid fulfillment status: %', p_status;
    END IF;

    SELECT * INTO v_item
    FROM public.order_items
    WHERE id = p_item_id AND order_id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item % not found in order %', p_item_id, p_order_id;
    END IF;

    UPDATE public.order_items
    SET fulfillment_status = p_status,
        prepared_quantity = COALESCE(p_prepared_qty, v_item.quantity)
    WHERE id = p_item_id;

    RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'status', p_status,
        'prepared_quantity', COALESCE(p_prepared_qty, v_item.quantity)
    );
END;
$$;

-- 10. PAYMENT COLLECTION RPC (For Cash/Card on Delivery upon arrival)
CREATE OR REPLACE FUNCTION public.collect_order_payment_atomic(
    p_order_id UUID,
    p_amount NUMERIC,
    p_payment_method public.payment_method,
    p_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_actor_id UUID;
    v_now TIMESTAMPTZ := now();
BEGIN
    v_actor_id := auth.uid();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can record payment collection';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF v_order.payment_status = 'paid' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order already paid',
            'order_id', p_order_id
        );
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;

    IF p_amount > v_order.total_amount THEN
        RAISE EXCEPTION 'Collected amount (AED %) exceeds total order amount (AED %)', p_amount, v_order.total_amount;
    END IF;

    UPDATE public.orders
    SET payment_status = 'paid',
        payment_method = p_payment_method,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_actor_id,
        'order_payment_collected',
        'orders',
        p_order_id,
        jsonb_build_object('payment_status', v_order.payment_status),
        jsonb_build_object(
            'payment_status', 'paid',
            'amount', p_amount,
            'method', p_payment_method,
            'reference', p_reference
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_status', 'paid',
        'amount', p_amount
    );
END;
$$;

-- 11. STAFF CANCELLATION RPC (With atomic stock restoration and movement ledger)
CREATE OR REPLACE FUNCTION public.cancel_order_staff_atomic(
    p_order_id UUID,
    p_reason TEXT,
    p_restock BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_current_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
    v_now TIMESTAMPTZ := now();
    v_actor_id UUID;
    v_items_restored INTEGER := 0;
    v_customer_user_id UUID;
BEGIN
    v_actor_id := auth.uid();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can perform administrative cancellation';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF v_order.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order is already cancelled',
            'order_id', p_order_id
        );
    END IF;

    IF v_order.status = 'delivered' THEN
        RAISE EXCEPTION 'Cannot cancel order % because it has already been delivered', v_order.order_number;
    END IF;

    -- If restock is requested, atomically restore inventory and append immutable ledger rows
    IF p_restock THEN
        FOR v_item IN
            SELECT * FROM public.order_items WHERE order_id = p_order_id
        LOOP
            IF v_item.product_id IS NOT NULL THEN
                SELECT stock_quantity, purchase_cost INTO v_prod
                FROM public.products
                WHERE id = v_item.product_id
                FOR UPDATE;

                IF FOUND THEN
                    v_current_stock := v_prod.stock_quantity;
                    v_new_stock := v_current_stock + v_item.quantity;

                    UPDATE public.products
                    SET stock_quantity = v_new_stock,
                        updated_at = v_now
                    WHERE id = v_item.product_id;

                    INSERT INTO public.inventory_movements (
                        product_id,
                        movement_type,
                        quantity,
                        previous_stock,
                        resulting_stock,
                        reference_type,
                        reference_id,
                        unit_cost,
                        notes,
                        created_by
                    )
                    VALUES (
                        v_item.product_id,
                        'customer_return',
                        v_item.quantity,
                        v_current_stock,
                        v_new_stock,
                        'order_cancellation',
                        p_order_id,
                        v_prod.purchase_cost,
                        'Staff cancellation of ' || v_order.order_number || ': ' || COALESCE(p_reason, 'Admin cancelled'),
                        v_actor_id
                    );

                    v_items_restored := v_items_restored + 1;
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = 'cancelled',
        cancelled_at = v_now,
        cancellation_reason = p_reason,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Update deliveries status if exists
    UPDATE public.deliveries
    SET status = 'failed',
        failure_reason = 'Order cancelled by store: ' || COALESCE(p_reason, ''),
        failed_at = v_now,
        updated_at = v_now
    WHERE order_id = p_order_id;

    -- Record Status History
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        reason,
        notes
    )
    VALUES (
        p_order_id,
        v_order.status,
        'cancelled',
        v_actor_id,
        p_reason,
        'Admin cancellation. Stock restored: ' || CASE WHEN p_restock THEN 'yes' ELSE 'no' END
    );

    -- Customer Notification
    SELECT auth_user_id INTO v_customer_user_id
    FROM public.customers
    WHERE id = v_order.customer_id;

    IF v_customer_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            link,
            entity_type,
            entity_id
        )
        VALUES (
            v_customer_user_id,
            'Order Cancelled',
            'Order ' || v_order.order_number || ' has been cancelled. Reason: ' || COALESCE(p_reason, 'Store cancelled'),
            'warning',
            '/account/orders/' || p_order_id,
            'orders',
            p_order_id
        );
    END IF;

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_actor_id,
        'order_cancelled_staff',
        'orders',
        p_order_id,
        jsonb_build_object('status', v_order.status),
        jsonb_build_object(
            'status', 'cancelled',
            'reason', p_reason,
            'restocked_items', v_items_restored
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'items_restored', v_items_restored,
        'status', 'cancelled'
    );
END;
$$;

-- 12. INTERNAL ORDER NOTES RPC
CREATE OR REPLACE FUNCTION public.add_order_note_atomic(
    p_order_id UUID,
    p_note TEXT,
    p_visibility TEXT DEFAULT 'internal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_note_id UUID;
BEGIN
    v_actor_id := auth.uid();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can add order notes';
    END IF;

    IF p_visibility NOT IN ('internal', 'customer') THEN
        RAISE EXCEPTION 'Invalid note visibility: %', p_visibility;
    END IF;

    INSERT INTO public.order_notes (
        order_id,
        author_id,
        note,
        visibility
    )
    VALUES (
        p_order_id,
        v_actor_id,
        p_note,
        p_visibility
    )
    RETURNING id INTO v_note_id;

    RETURN jsonb_build_object(
        'success', true,
        'note_id', v_note_id,
        'order_id', p_order_id
    );
END;
$$;
