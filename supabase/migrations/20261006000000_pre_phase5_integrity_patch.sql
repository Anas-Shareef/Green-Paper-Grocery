-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Pre-Phase-5 Data Integrity & Concurrency Hardening Patch
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. HARDEN INVENTORY MOVEMENTS LEDGER
-- Add previous_stock and resulting_stock columns to record immutable balance snapshots
ALTER TABLE public.inventory_movements
    ADD COLUMN IF NOT EXISTS previous_stock NUMERIC(12, 3),
    ADD COLUMN IF NOT EXISTS resulting_stock NUMERIC(12, 3);

-- Restrict RLS on inventory_movements:
-- Direct INSERT, UPDATE, and DELETE by clients are DENIED.
-- Only trusted database functions (mutate_stock_atomic) running as SECURITY DEFINER
-- or service_role can create ledger records.
DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_update" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_delete" ON public.inventory_movements;

DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
CREATE POLICY "inventory_movements_select" ON public.inventory_movements
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "inventory_movements_insert_service_only" ON public.inventory_movements;
CREATE POLICY "inventory_movements_insert_service_only" ON public.inventory_movements
    FOR INSERT TO service_role WITH CHECK (true);


-- 2. HARDEN AUDIT LOGS
-- Immutable append-only log: direct client INSERT, UPDATE, and DELETE are strictly DENIED.
-- Inserting into audit_logs can only happen via trusted SECURITY DEFINER functions
-- (like log_audit_event_atomic, mutate_stock_atomic, etc.) or service_role.
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (public.has_permission('audit.view'));

DROP POLICY IF EXISTS "audit_logs_insert_service_only" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_service_only" ON public.audit_logs
    FOR INSERT TO service_role WITH CHECK (true);


-- 3. HARDEN PRODUCT PRICE HISTORY
-- Guarantee that there is NEVER more than one active price record per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_single_active
    ON public.product_price_history(product_id)
    WHERE effective_until IS NULL;

-- Disallow arbitrary direct client INSERT, UPDATE, and DELETE on historical price records
DROP POLICY IF EXISTS "price_history_modify" ON public.product_price_history;
DROP POLICY IF EXISTS "price_history_insert" ON public.product_price_history;
DROP POLICY IF EXISTS "price_history_update" ON public.product_price_history;
DROP POLICY IF EXISTS "price_history_delete" ON public.product_price_history;
DROP POLICY IF EXISTS "price_history_close_only" ON public.product_price_history;

DROP POLICY IF EXISTS "price_history_select" ON public.product_price_history;
CREATE POLICY "price_history_select" ON public.product_price_history
    FOR SELECT USING (public.is_staff());

CREATE POLICY "price_history_insert_service_only" ON public.product_price_history
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "price_history_update_service_only" ON public.product_price_history
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);


-- 4. HARDEN INVENTORY COUNTS & ITEMS CONCURRENCY
-- Extend inventory_count_items with completion and interim concurrency tracking columns
ALTER TABLE public.inventory_count_items
    ADD COLUMN IF NOT EXISTS system_quantity_at_completion NUMERIC(12, 3),
    ADD COLUMN IF NOT EXISTS interim_movement_quantity NUMERIC(12, 3),
    ADD COLUMN IF NOT EXISTS actual_reconciliation_difference NUMERIC(12, 3),
    ADD COLUMN IF NOT EXISTS resulting_stock NUMERIC(12, 3),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Prevent duplicate lines for the same product in a single stocktake session
CREATE UNIQUE INDEX IF NOT EXISTS idx_count_items_unique_product
    ON public.inventory_count_items(inventory_count_id, product_id);


-- 5. TRUSTED AUDIT LOGGING FUNCTION
-- Generates audit records with verified auth.uid() actor
CREATE OR REPLACE FUNCTION public.log_audit_event_atomic(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_log_id UUID;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required for audit logging';
    END IF;

    v_actor_id := auth.uid();

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
        p_action,
        p_entity_type,
        p_entity_id,
        p_old_values,
        p_new_values
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event_atomic(TEXT, TEXT, UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_audit_event_atomic(TEXT, TEXT, UUID, JSONB, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event_atomic(TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated, service_role;


-- 6. UPDATE MUTATE_STOCK_ATOMIC TO LOG PREVIOUS AND RESULTING BALANCES
CREATE OR REPLACE FUNCTION public.mutate_stock_atomic(
    p_product_id UUID,
    p_quantity_change NUMERIC(12, 3),
    p_movement_type inventory_movement_type,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_unit_cost NUMERIC(12, 2) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_allow_negative BOOLEAN DEFAULT false
)
RETURNS NUMERIC(12, 3)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_stock NUMERIC(12, 3);
    v_reorder_level NUMERIC(12, 3);
    v_product_name TEXT;
    v_new_stock NUMERIC(12, 3);
    v_actual_cost NUMERIC(12, 2);
    v_effective_user_id UUID;
BEGIN
    -- 1. Authorization verification
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required for stock mutation';
    END IF;

    -- 2. Input validation
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Product ID cannot be null';
    END IF;

    IF p_quantity_change IS NULL OR p_quantity_change = 0 THEN
        RAISE EXCEPTION 'Quantity change must be non-zero';
    END IF;

    IF p_movement_type IS NULL THEN
        RAISE EXCEPTION 'Movement type is required';
    END IF;

    -- Validate movement direction
    IF p_movement_type IN ('purchase', 'customer_return', 'opening_stock') AND p_quantity_change < 0 THEN
        RAISE EXCEPTION 'Movement type % requires a positive quantity change', p_movement_type;
    ELSIF p_movement_type IN ('sale', 'supplier_return', 'damaged', 'expired') AND p_quantity_change > 0 THEN
        RAISE EXCEPTION 'Movement type % requires a negative quantity change', p_movement_type;
    END IF;

    -- Derive and verify authenticated actor
    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
            RAISE EXCEPTION 'Security violation: Actor ID mismatch (supplied %, authenticated %)', p_user_id, auth.uid();
        END IF;
        v_effective_user_id := auth.uid();
    ELSIF current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        v_effective_user_id := p_user_id;
    ELSE
        RAISE EXCEPTION 'Authentication required: Action must be invoked by an authenticated user';
    END IF;

    -- 3. Row lock on target product
    SELECT name, stock_quantity, reorder_level, purchase_cost
    INTO v_product_name, v_current_stock, v_reorder_level, v_actual_cost
    FROM public.products
    WHERE id = p_product_id AND archived_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found or has been archived', p_product_id;
    END IF;

    -- 4. Calculate projected stock and enforce non-negative constraint
    v_new_stock := v_current_stock + p_quantity_change;

    IF v_new_stock < 0 AND NOT p_allow_negative THEN
        RAISE EXCEPTION 'Insufficient stock for "%": current % units, requested reduction of % units would result in % units.',
            v_product_name, v_current_stock, abs(p_quantity_change), v_new_stock;
    END IF;

    -- 5. Mutate product stock
    UPDATE public.products
    SET stock_quantity = v_new_stock,
        updated_at = now()
    WHERE id = p_product_id;

    -- 6. Insert inventory movement audit record with immutable balances
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
        p_product_id,
        p_movement_type,
        p_quantity_change,
        v_current_stock,
        v_new_stock,
        p_reference_type,
        p_reference_id,
        COALESCE(p_unit_cost, v_actual_cost),
        p_notes,
        v_effective_user_id
    );

    -- 7. Insert system audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'inventory.stock_mutated',
        'product',
        p_product_id,
        jsonb_build_object('stock_quantity', v_current_stock),
        jsonb_build_object(
            'stock_quantity', v_new_stock,
            'change', p_quantity_change,
            'movement_type', p_movement_type,
            'reference_type', p_reference_type,
            'notes', p_notes
        )
    );

    -- 8. Dispatch notifications strictly on meaningful threshold transitions
    IF v_new_stock = 0 AND v_current_stock > 0 THEN
        INSERT INTO public.notifications (
            title,
            message,
            type,
            entity_type,
            entity_id,
            link
        ) VALUES (
            'Out of Stock Alert',
            format('Product "%s" is now completely out of stock.', v_product_name),
            'warning',
            'product',
            p_product_id,
            '/admin/inventory'
        );
    ELSIF v_new_stock > 0 AND v_new_stock <= v_reorder_level AND v_current_stock > v_reorder_level THEN
        INSERT INTO public.notifications (
            title,
            message,
            type,
            entity_type,
            entity_id,
            link
        ) VALUES (
            'Low Stock Alert',
            format('Product "%s" reached low stock (%s units remaining, reorder level is %s).', v_product_name, v_new_stock, v_reorder_level),
            'warning',
            'product',
            p_product_id,
            '/admin/inventory'
        );
    END IF;

    RETURN v_new_stock;
END;
$$;


-- 7. ATOMIC STOCKTAKE RECONCILIATION WITH CONCURRENCY PROTECTION & CORRECT MATHEMATICS
-- Preserves all legitimate interim movements that occurred between snapshot and completion.
-- Variance applied against current stock is: actual_reconciliation_difference = counted_quantity - system_quantity_at_completion.
CREATE OR REPLACE FUNCTION public.complete_inventory_count_atomic(
    p_count_id UUID,
    p_items JSONB,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count_record RECORD;
    v_item JSONB;
    v_product_id UUID;
    v_counted_qty NUMERIC(12, 3);
    v_snapshot_qty NUMERIC(12, 3);
    v_reason TEXT;
    v_current_stock NUMERIC(12, 3);
    v_reorder_level NUMERIC(12, 3);
    v_actual_cost NUMERIC(12, 2);
    v_product_name TEXT;
    v_interim_movement NUMERIC(12, 3);
    v_reconciliation_diff NUMERIC(12, 3);
    v_final_stock NUMERIC(12, 3);
    v_effective_user_id UUID;
    v_reconciled_count INTEGER := 0;
    v_variance_count INTEGER := 0;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- 1. Authorization & actor verification
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required for stock reconciliation';
    END IF;

    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
            RAISE EXCEPTION 'Security violation: Actor ID mismatch (supplied %, authenticated %)', p_user_id, auth.uid();
        END IF;
        v_effective_user_id := auth.uid();
    ELSIF current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        v_effective_user_id := p_user_id;
    ELSE
        RAISE EXCEPTION 'Authentication required: Operation must be invoked by an authenticated user';
    END IF;

    -- 2. Lock the inventory count session FOR UPDATE
    SELECT id, reference, status, started_at
    INTO v_count_record
    FROM public.inventory_counts
    WHERE id = p_count_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory count session % not found', p_count_id;
    END IF;

    IF v_count_record.status = 'completed' THEN
        RAISE EXCEPTION 'Inventory count % is already completed and immutable', v_count_record.reference;
    END IF;

    IF v_count_record.status = 'cancelled' THEN
        RAISE EXCEPTION 'Inventory count % was cancelled and cannot be reconciled', v_count_record.reference;
    END IF;

    -- 3. Process each counted item atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := COALESCE(v_item->>'productId', v_item->>'product_id')::UUID;
        v_counted_qty := COALESCE(v_item->>'countedQuantity', v_item->>'counted_quantity')::NUMERIC(12, 3);
        v_snapshot_qty := COALESCE(v_item->>'systemQuantity', v_item->>'system_quantity')::NUMERIC(12, 3);
        v_reason := COALESCE(v_item->>'reason', 'Physical stocktake reconciliation');

        IF v_counted_qty < 0 THEN
            RAISE EXCEPTION 'Counted quantity cannot be negative for product %', v_product_id;
        END IF;

        -- Row lock on product to prevent concurrent race conditions
        SELECT name, stock_quantity, reorder_level, purchase_cost
        INTO v_product_name, v_current_stock, v_reorder_level, v_actual_cost
        FROM public.products
        WHERE id = v_product_id AND archived_at IS NULL
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found or has been archived', v_product_id;
        END IF;

        -- Interim movements that occurred between snapshot and completion: (Current - Snapshot)
        v_interim_movement := v_current_stock - v_snapshot_qty;

        -- Actual physical reconciliation difference against CURRENT stock: (Counted - Current)
        v_reconciliation_diff := v_counted_qty - v_current_stock;

        -- Final resulting stock equals the physical count reality
        v_final_stock := v_current_stock + v_reconciliation_diff;

        IF v_final_stock < 0 THEN
            RAISE EXCEPTION 'Stock reconciliation would cause negative stock (% units) for "%". Interim movements: %',
                v_final_stock, v_product_name, v_interim_movement;
        END IF;

        -- Require explanation for material discrepancies
        IF v_reconciliation_diff <> 0 AND (v_reason IS NULL OR trim(v_reason) = '') THEN
            RAISE EXCEPTION 'A variance explanation is required for product "%" (Discrepancy: %)',
                v_product_name, v_reconciliation_diff;
        END IF;

        -- If physical variance against current stock is detected, apply atomic adjustment
        IF v_reconciliation_diff <> 0 THEN
            UPDATE public.products
            SET stock_quantity = v_final_stock,
                updated_at = v_now
            WHERE id = v_product_id;

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
                'count_reconciliation',
                v_reconciliation_diff,
                v_current_stock,
                v_final_stock,
                'inventory_count',
                p_count_id,
                v_actual_cost,
                format('Stocktake reconciliation (%s) - Variance: %s (Interim movement: %s, Snapshot: %s, Current: %s). Reason: %s',
                    v_count_record.reference, v_reconciliation_diff, v_interim_movement, v_snapshot_qty, v_current_stock, v_reason),
                v_effective_user_id
            );

            v_variance_count := v_variance_count + 1;
        END IF;

        -- Record line item with full audit snapshot
        INSERT INTO public.inventory_count_items (
            inventory_count_id,
            product_id,
            system_quantity,
            counted_quantity,
            difference,
            system_quantity_at_completion,
            interim_movement_quantity,
            actual_reconciliation_difference,
            resulting_stock,
            completed_at,
            reason
        )
        VALUES (
            p_count_id,
            v_product_id,
            v_snapshot_qty,
            v_counted_qty,
            (v_counted_qty - v_snapshot_qty),
            v_current_stock,
            v_interim_movement,
            v_reconciliation_diff,
            v_final_stock,
            v_now,
            v_reason
        )
        ON CONFLICT (inventory_count_id, product_id) DO UPDATE SET
            system_quantity = EXCLUDED.system_quantity,
            counted_quantity = EXCLUDED.counted_quantity,
            difference = EXCLUDED.difference,
            system_quantity_at_completion = EXCLUDED.system_quantity_at_completion,
            interim_movement_quantity = EXCLUDED.interim_movement_quantity,
            actual_reconciliation_difference = EXCLUDED.actual_reconciliation_difference,
            resulting_stock = EXCLUDED.resulting_stock,
            completed_at = EXCLUDED.completed_at,
            reason = EXCLUDED.reason;

        v_reconciled_count := v_reconciled_count + 1;
    END LOOP;

    -- 4. Mark inventory count session as completed and immutable
    UPDATE public.inventory_counts
    SET status = 'completed',
        completed_at = v_now
    WHERE id = p_count_id;

    -- 5. Record system audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'inventory.count_completed',
        'inventory_count',
        p_count_id,
        jsonb_build_object('status', 'in_progress'),
        jsonb_build_object(
            'status', 'completed',
            'reference', v_count_record.reference,
            'items_reconciled', v_reconciled_count,
            'variances_adjusted', v_variance_count,
            'completed_at', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'count_id', p_count_id,
        'reference', v_count_record.reference,
        'items_reconciled', v_reconciled_count,
        'variances_adjusted', v_variance_count
    );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_inventory_count_atomic(UUID, JSONB, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_inventory_count_atomic(UUID, JSONB, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_inventory_count_atomic(UUID, JSONB, UUID) TO authenticated, service_role;


-- 8. ATOMIC PRODUCT CREATION WITH OPENING STOCK & PRICE HISTORY
CREATE OR REPLACE FUNCTION public.create_product_atomic(
    p_product_data JSONB,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_id UUID;
    v_name TEXT;
    v_slug TEXT;
    v_sku TEXT;
    v_barcode TEXT;
    v_category_id UUID;
    v_unit TEXT;
    v_purchase_cost NUMERIC(12, 2);
    v_selling_price NUMERIC(12, 2);
    v_promo_price NUMERIC(12, 2);
    v_minimum_selling_price NUMERIC(12, 2);
    v_opening_stock NUMERIC(12, 3);
    v_reorder_level NUMERIC(12, 3);
    v_image_url TEXT;
    v_description TEXT;
    v_brand TEXT;
    v_is_active BOOLEAN;
    v_is_featured BOOLEAN;
    v_effective_user_id UUID;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required to create products';
    END IF;

    -- Derive and verify authenticated actor
    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
            RAISE EXCEPTION 'Security violation: Actor ID mismatch (supplied %, authenticated %)', p_user_id, auth.uid();
        END IF;
        v_effective_user_id := auth.uid();
    ELSIF current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        v_effective_user_id := p_user_id;
    ELSE
        RAISE EXCEPTION 'Authentication required: Action must be invoked by an authenticated user';
    END IF;

    -- Extract and validate fields
    v_name := trim(p_product_data->>'name');
    v_sku := upper(trim(p_product_data->>'sku'));
    v_barcode := nullif(trim(p_product_data->>'barcode'), '');
    v_slug := p_product_data->>'slug';
    v_category_id := nullif(p_product_data->>'category_id', '')::UUID;
    v_unit := COALESCE(p_product_data->>'unit', 'piece');
    v_purchase_cost := COALESCE((p_product_data->>'purchase_cost')::NUMERIC(12, 2), 0.00);
    v_selling_price := COALESCE((p_product_data->>'selling_price')::NUMERIC(12, 2), 0.00);
    v_promo_price := nullif(p_product_data->>'promo_price', '')::NUMERIC(12, 2);
    v_minimum_selling_price := COALESCE((p_product_data->>'minimum_selling_price')::NUMERIC(12, 2), 0.00);
    v_opening_stock := COALESCE((p_product_data->>'opening_stock')::NUMERIC(12, 3), 0.000);
    v_reorder_level := COALESCE((p_product_data->>'reorder_level')::NUMERIC(12, 3), 5.000);
    v_image_url := nullif(p_product_data->>'image_url', '');
    v_description := nullif(p_product_data->>'description', '');
    v_brand := nullif(p_product_data->>'brand', '');
    v_is_active := COALESCE((p_product_data->>'is_active')::BOOLEAN, true);
    v_is_featured := COALESCE((p_product_data->>'is_featured')::BOOLEAN, false);

    IF v_name IS NULL OR v_name = '' THEN
        RAISE EXCEPTION 'Product name is required';
    END IF;
    IF v_sku IS NULL OR v_sku = '' THEN
        RAISE EXCEPTION 'SKU is required';
    END IF;

    -- Validate pricing guardrails
    IF v_purchase_cost < 0 THEN
        RAISE EXCEPTION 'Purchase cost cannot be negative';
    END IF;
    IF v_minimum_selling_price < 0 THEN
        RAISE EXCEPTION 'Minimum selling price cannot be negative';
    END IF;
    IF v_selling_price < v_minimum_selling_price THEN
        RAISE EXCEPTION 'Selling price cannot be lower than minimum allowed price';
    END IF;
    IF v_promo_price IS NOT NULL AND v_promo_price < v_minimum_selling_price THEN
        RAISE EXCEPTION 'Promotional price cannot be lower than minimum allowed price';
    END IF;
    IF v_promo_price IS NOT NULL AND v_promo_price > v_selling_price THEN
        RAISE EXCEPTION 'Promotional price cannot be greater than normal selling price';
    END IF;
    IF v_opening_stock < 0 THEN
        RAISE EXCEPTION 'Opening stock cannot be negative';
    END IF;

    -- 1. Insert product record
    INSERT INTO public.products (
        name,
        slug,
        sku,
        barcode,
        description,
        category_id,
        brand,
        unit,
        purchase_cost,
        selling_price,
        promo_price,
        minimum_selling_price,
        stock_quantity,
        reorder_level,
        image_url,
        is_active,
        is_featured
    )
    VALUES (
        v_name,
        v_slug,
        v_sku,
        v_barcode,
        v_description,
        v_category_id,
        v_brand,
        v_unit,
        v_purchase_cost,
        v_selling_price,
        v_promo_price,
        v_minimum_selling_price,
        v_opening_stock,
        v_reorder_level,
        v_image_url,
        v_is_active,
        v_is_featured
    )
    RETURNING id INTO v_product_id;

    -- 2. Insert initial price history record
    INSERT INTO public.product_price_history (
        product_id,
        purchase_cost,
        normal_selling_price,
        promo_price,
        minimum_selling_price,
        effective_from,
        effective_until,
        changed_by,
        reason
    )
    VALUES (
        v_product_id,
        v_purchase_cost,
        v_selling_price,
        v_promo_price,
        v_minimum_selling_price,
        now(),
        null,
        v_effective_user_id,
        'Initial pricing upon product creation'
    );

    -- 3. If opening stock > 0, insert opening movement
    IF v_opening_stock > 0 THEN
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
            'opening_stock',
            v_opening_stock,
            0.000,
            v_opening_stock,
            'product_creation',
            v_product_id,
            v_purchase_cost,
            format('Opening stock balance recorded for SKU: %s', v_sku),
            v_effective_user_id
        );
    END IF;

    -- 4. Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'product.created',
        'product',
        v_product_id,
        jsonb_build_object(
            'name', v_name,
            'sku', v_sku,
            'selling_price', v_selling_price,
            'purchase_cost', v_purchase_cost,
            'stock_quantity', v_opening_stock
        )
    );

    RETURN v_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_product_atomic(JSONB, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_product_atomic(JSONB, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_product_atomic(JSONB, UUID) TO authenticated, service_role;


-- 9. ATOMIC PRICE CHANGE RPC
CREATE OR REPLACE FUNCTION public.record_product_price_change(
    p_product_id UUID,
    p_purchase_cost NUMERIC(12, 2),
    p_normal_selling_price NUMERIC(12, 2),
    p_promo_price NUMERIC(12, 2) DEFAULT NULL,
    p_minimum_selling_price NUMERIC(12, 2) DEFAULT 0.00,
    p_reason TEXT DEFAULT 'Price revision',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_name TEXT;
    v_old_purchase_cost NUMERIC(12, 2);
    v_old_selling_price NUMERIC(12, 2);
    v_old_promo_price NUMERIC(12, 2);
    v_effective_user_id UUID;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required for price change';
    END IF;

    -- Derive and verify authenticated actor
    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
            RAISE EXCEPTION 'Security violation: Actor ID mismatch (supplied %, authenticated %)', p_user_id, auth.uid();
        END IF;
        v_effective_user_id := auth.uid();
    ELSIF current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        v_effective_user_id := p_user_id;
    ELSE
        RAISE EXCEPTION 'Authentication required: Action must be invoked by an authenticated user';
    END IF;

    -- Validate price guardrails
    IF p_purchase_cost < 0 THEN
        RAISE EXCEPTION 'Purchase cost cannot be negative';
    END IF;
    IF p_minimum_selling_price < 0 THEN
        RAISE EXCEPTION 'Minimum selling price cannot be negative';
    END IF;
    IF p_normal_selling_price < p_minimum_selling_price THEN
        RAISE EXCEPTION 'Normal selling price (%s) cannot be below minimum selling price (%s)',
            p_normal_selling_price, p_minimum_selling_price;
    END IF;
    IF p_promo_price IS NOT NULL AND p_promo_price < p_minimum_selling_price THEN
        RAISE EXCEPTION 'Promotional price (%s) cannot be below minimum selling price (%s)',
            p_promo_price, p_minimum_selling_price;
    END IF;
    IF p_promo_price IS NOT NULL AND p_promo_price > p_normal_selling_price THEN
        RAISE EXCEPTION 'Promotional price (%s) cannot exceed normal selling price (%s)',
            p_promo_price, p_normal_selling_price;
    END IF;

    -- 1. Lock product row FOR UPDATE
    SELECT name, purchase_cost, selling_price, promo_price
    INTO v_product_name, v_old_purchase_cost, v_old_selling_price, v_old_promo_price
    FROM public.products
    WHERE id = p_product_id AND archived_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found or has been archived', p_product_id;
    END IF;

    -- 2. Lock current active price record FOR UPDATE
    PERFORM id FROM public.product_price_history
    WHERE product_id = p_product_id AND effective_until IS NULL
    FOR UPDATE;

    -- 3. Close existing active price history record
    UPDATE public.product_price_history
    SET effective_until = v_now
    WHERE product_id = p_product_id AND effective_until IS NULL;

    -- 4. Insert new price history record
    INSERT INTO public.product_price_history (
        product_id,
        purchase_cost,
        normal_selling_price,
        promo_price,
        minimum_selling_price,
        effective_from,
        effective_until,
        changed_by,
        reason
    )
    VALUES (
        p_product_id,
        p_purchase_cost,
        p_normal_selling_price,
        p_promo_price,
        p_minimum_selling_price,
        v_now,
        null,
        v_effective_user_id,
        p_reason
    );

    -- 5. Update product pricing fields
    UPDATE public.products
    SET purchase_cost = p_purchase_cost,
        selling_price = p_normal_selling_price,
        promo_price = p_promo_price,
        minimum_selling_price = p_minimum_selling_price,
        updated_at = v_now
    WHERE id = p_product_id;

    -- 6. Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'product.price_changed',
        'product',
        p_product_id,
        jsonb_build_object(
            'purchase_cost', v_old_purchase_cost,
            'selling_price', v_old_selling_price,
            'promo_price', v_old_promo_price
        ),
        jsonb_build_object(
            'purchase_cost', p_purchase_cost,
            'selling_price', p_normal_selling_price,
            'promo_price', p_promo_price,
            'minimum_selling_price', p_minimum_selling_price,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'purchase_cost', p_purchase_cost,
        'selling_price', p_normal_selling_price,
        'effective_from', v_now
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_product_price_change(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_product_price_change(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_product_price_change(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID) TO authenticated, service_role;
