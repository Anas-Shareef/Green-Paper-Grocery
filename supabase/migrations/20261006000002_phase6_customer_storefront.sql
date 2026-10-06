-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 6: Customer Storefront, Catalog, Cart, Checkout & Orders
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. ADD 'customer' ROLE TO user_role ENUM IF NOT PRESENT
DO $$ BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'customer';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.1 SECURE NEW USER TRIGGER: DEFAULT TO 'customer' ROLE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.user_role := 'customer';
    user_full_name TEXT;
    user_phone TEXT;
BEGIN
    IF NEW.raw_user_meta_data->>'role' IN ('owner', 'admin', 'staff', 'customer') THEN
        assigned_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    END IF;

    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    user_phone := NEW.raw_user_meta_data->>'phone';

    INSERT INTO public.profiles (id, full_name, phone, avatar_url, role, is_active)
    VALUES (
        NEW.id,
        user_full_name,
        user_phone,
        NEW.raw_user_meta_data->>'avatar_url',
        assigned_role,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = now();

    -- Also auto-provision customer record for customer signups
    IF assigned_role = 'customer' THEN
        INSERT INTO public.customers (
            auth_user_id,
            name,
            email,
            mobile,
            address,
            zone,
            customer_segment,
            is_active
        )
        VALUES (
            NEW.id,
            user_full_name,
            NEW.email,
            COALESCE(user_phone, '0500000000'),
            'Zone 19, Abu Dhabi',
            'Zone 19',
            'new',
            true
        )
        ON CONFLICT (auth_user_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENHANCE CUSTOMERS TABLE WITH AUTH LINKING
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_auth_user ON public.customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- 3. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    building_or_villa TEXT NOT NULL,
    street TEXT NOT NULL,
    area TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Abu Dhabi',
    emirate TEXT NOT NULL DEFAULT 'Abu Dhabi',
    zone TEXT NOT NULL DEFAULT 'Zone 19',
    delivery_instructions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON public.customer_addresses(customer_id, is_default);

DROP TRIGGER IF EXISTS trigger_set_updated_at_customer_addresses ON public.customer_addresses;
CREATE TRIGGER trigger_set_updated_at_customer_addresses
    BEFORE UPDATE ON public.customer_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ENHANCE ORDERS TABLE WITH TAX & DELIVERY CHARGE COLUMNS
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0);

-- 5. ORDER DOCUMENT SEQUENCE
CREATE SEQUENCE IF NOT EXISTS public.seq_order_number START 1;

-- 6. ATOMIC ORDER CREATION RPC
-- Concurrency-safe, server-authoritative pricing and inventory deduction
CREATE OR REPLACE FUNCTION public.create_customer_order_atomic(
    p_customer_id UUID,
    p_items JSONB,
    p_delivery_address TEXT,
    p_delivery_notes TEXT DEFAULT NULL,
    p_payment_method payment_method DEFAULT 'cash',
    p_order_source order_source DEFAULT 'website',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item RECORD;
    v_prod RECORD;
    v_item_json JSONB;
    v_product_id UUID;
    v_quantity NUMERIC(12, 3);
    v_unit_price NUMERIC(12, 2);
    v_line_total NUMERIC(12, 2);
    v_subtotal NUMERIC(12, 2) := 0.00;
    v_tax_rate NUMERIC(5, 4) := 0.0500; -- 5% UAE standard VAT
    v_tax_amount NUMERIC(12, 2) := 0.00;
    v_delivery_fee NUMERIC(12, 2) := 0.00;
    v_grand_total NUMERIC(12, 2) := 0.00;
    v_current_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
    v_items_count INTEGER := 0;
    v_now TIMESTAMPTZ := now();
    v_year TEXT := to_char(CURRENT_DATE, 'YYYY');
    v_seq_val BIGINT;
    v_customer RECORD;
BEGIN
    -- 1. Validate customer
    IF p_customer_id IS NOT NULL THEN
        SELECT id, name, mobile, total_orders, total_spend
        INTO v_customer
        FROM public.customers
        WHERE id = p_customer_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Customer ID % not found', p_customer_id;
        END IF;
    END IF;

    -- 2. Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order items array cannot be empty';
    END IF;

    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) = 0 THEN
        RAISE EXCEPTION 'Delivery address is required';
    END IF;

    -- 3. Generate sequential order number (ORD-YYYY-NNNNN)
    SELECT nextval('public.seq_order_number') INTO v_seq_val;
    v_order_number := 'ORD-' || v_year || '-' || lpad(v_seq_val::text, 5, '0');

    -- Generate Order UUID
    v_order_id := gen_random_uuid();

    -- 4. Process each item: Row-lock product, validate stock, compute authoritative price
    FOR v_item_json IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item_json->>'product_id')::UUID;
        v_quantity := (v_item_json->>'quantity')::NUMERIC(12, 3);

        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'Product ID cannot be null in order line';
        END IF;

        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be greater than zero';
        END IF;

        -- Lock product row FOR UPDATE to prevent race conditions
        SELECT id, name, selling_price, promo_price, purchase_cost, stock_quantity, is_active, archived_at
        INTO v_prod
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % does not exist', v_product_id;
        END IF;

        IF NOT v_prod.is_active OR v_prod.archived_at IS NOT NULL THEN
            RAISE EXCEPTION 'Product "%" is no longer available for purchase', v_prod.name;
        END IF;

        -- Check stock availability
        IF v_prod.stock_quantity < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested: %, Available: %',
                v_prod.name, v_quantity, v_prod.stock_quantity;
        END IF;

        -- Authoritative price resolution: promo_price if valid, else selling_price
        IF v_prod.promo_price IS NOT NULL AND v_prod.promo_price > 0 AND v_prod.promo_price < v_prod.selling_price THEN
            v_unit_price := v_prod.promo_price;
        ELSE
            v_unit_price := v_prod.selling_price;
        END IF;

        v_line_total := round(v_unit_price * v_quantity, 2);
        v_subtotal := v_subtotal + v_line_total;

        -- Calculate stock changes
        v_current_stock := v_prod.stock_quantity;
        v_new_stock := v_current_stock - v_quantity;

        -- Deduct stock
        UPDATE public.products
        SET stock_quantity = v_new_stock,
            updated_at = v_now
        WHERE id = v_product_id;

        -- Append to immutable inventory movement ledger
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
            v_product_id,
            'sale',
            -v_quantity,
            v_current_stock,
            v_new_stock,
            'order',
            v_order_id,
            v_prod.purchase_cost,
            'Customer Order ' || v_order_number,
            p_user_id
        );

        -- Insert order item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            selling_price,
            purchase_cost_at_sale,
            discount_amount,
            total_amount
        )
        VALUES (
            v_order_id,
            v_product_id,
            v_prod.name,
            v_quantity,
            v_unit_price,
            v_prod.purchase_cost,
            CASE
                WHEN v_prod.promo_price IS NOT NULL AND v_prod.promo_price < v_prod.selling_price
                THEN round((v_prod.selling_price - v_prod.promo_price) * v_quantity, 2)
                ELSE 0.00
            END,
            v_line_total
        );

        v_items_count := v_items_count + 1;
    END LOOP;

    -- 5. Calculate tax & delivery fee
    -- UAE VAT 5%
    v_tax_amount := round(v_subtotal * v_tax_rate, 2);

    -- Standard delivery rules: free if subtotal >= 100 AED, else 10 AED
    IF v_subtotal >= 100.00 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 10.00;
    END IF;

    v_grand_total := v_subtotal + v_tax_amount + v_delivery_fee;

    -- 6. Insert Order Header
    INSERT INTO public.orders (
        id,
        order_number,
        customer_id,
        order_source,
        status,
        payment_method,
        payment_status,
        subtotal,
        discount_amount,
        tax_amount,
        delivery_fee,
        total_amount,
        delivery_address,
        delivery_notes,
        order_date,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        v_order_id,
        v_order_number,
        p_customer_id,
        p_order_source,
        'pending',
        p_payment_method,
        'pending',
        v_subtotal,
        0.00,
        v_tax_amount,
        v_delivery_fee,
        v_grand_total,
        p_delivery_address,
        p_delivery_notes,
        v_now,
        p_user_id,
        v_now,
        v_now
    );

    -- 7. Update Customer Statistics if linked to customer
    IF p_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET total_orders = total_orders + 1,
            total_spend = total_spend + v_grand_total,
            last_order_at = v_now,
            first_order_at = COALESCE(first_order_at, v_now),
            customer_segment = CASE
                WHEN (total_orders + 1) >= 10 OR (total_spend + v_grand_total) >= 1000 THEN 'vip'::customer_segment
                WHEN (total_orders + 1) >= 3 THEN 'regular'::customer_segment
                ELSE 'new'::customer_segment
            END,
            updated_at = v_now
        WHERE id = p_customer_id;
    END IF;

    -- Return Order Receipt
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'items_count', v_items_count,
        'subtotal', v_subtotal,
        'tax_amount', v_tax_amount,
        'delivery_fee', v_delivery_fee,
        'total_amount', v_grand_total
    );
END;
$$;

-- 7. ATOMIC ORDER CANCELLATION RPC (Restores inventory safely)
CREATE OR REPLACE FUNCTION public.cancel_customer_order_atomic(
    p_order_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
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
    v_items_restored INTEGER := 0;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF v_order.status IN ('cancelled', 'delivered', 'returned') THEN
        RAISE EXCEPTION 'Order cannot be cancelled in status %', v_order.status;
    END IF;

    -- Only allow customer cancellation if status is 'pending' or 'confirmed'
    -- (Staff can cancel other in-progress statuses)
    IF NOT public.is_staff() AND v_order.status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Order is already being prepared or dispatched and cannot be cancelled online';
    END IF;

    -- Restore stock for each item in the order
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
                    'Order Cancellation: ' || COALESCE(p_reason, 'Customer cancelled'),
                    p_user_id
                );

                v_items_restored := v_items_restored + 1;
            END IF;
        END IF;
    END LOOP;

    -- Update order status
    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = v_now
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'items_restored', v_items_restored
    );
END;
$$;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES FOR STOREFRONT

-- Enable RLS on customer_addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- 8.1 CUSTOMER ADDRESSES POLICIES
DROP POLICY IF EXISTS "customer_addresses_select" ON public.customer_addresses;
CREATE POLICY "customer_addresses_select" ON public.customer_addresses
    FOR SELECT USING (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "customer_addresses_insert" ON public.customer_addresses;
CREATE POLICY "customer_addresses_insert" ON public.customer_addresses
    FOR INSERT WITH CHECK (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "customer_addresses_update" ON public.customer_addresses;
CREATE POLICY "customer_addresses_update" ON public.customer_addresses
    FOR UPDATE USING (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    ) WITH CHECK (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "customer_addresses_delete" ON public.customer_addresses;
CREATE POLICY "customer_addresses_delete" ON public.customer_addresses
    FOR DELETE USING (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- 8.2 CUSTOMERS TABLE POLICIES (Allow customer to access their own customer record)
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT USING (
        public.is_staff()
        OR (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "customers_customer_update" ON public.customers;
CREATE POLICY "customers_customer_update" ON public.customers
    FOR UPDATE USING (
        public.is_staff()
        OR (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
    ) WITH CHECK (
        public.is_staff()
        OR (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "customers_customer_insert" ON public.customers;
CREATE POLICY "customers_customer_insert" ON public.customers
    FOR INSERT WITH CHECK (
        public.is_staff()
        OR (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
    );

-- 8.3 ORDERS POLICIES (Allow customers to read their own orders)
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- 8.4 ORDER ITEMS POLICIES (Allow customers to read items of their own orders)
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
CREATE POLICY "order_items_select_policy" ON public.order_items
    FOR SELECT USING (
        public.is_staff()
        OR order_id IN (
            SELECT id FROM public.orders WHERE customer_id IN (
                SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
            )
        )
    );
