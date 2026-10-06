-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 3 Pre-Phase 4 Data Integrity Patch Migration
-- ==============================================================================

-- 1. PRODUCT ARCHIVE STRATEGY & BARCODE UNIQUENESS
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure partial unique index on non-empty barcode
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique
    ON public.products(barcode)
    WHERE barcode IS NOT NULL AND barcode <> '';

-- 2. PRODUCT PRICE HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    purchase_cost NUMERIC(12, 2) NOT NULL CHECK (purchase_cost >= 0),
    normal_selling_price NUMERIC(12, 2) NOT NULL CHECK (normal_selling_price >= 0),
    promo_price NUMERIC(12, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
    minimum_selling_price NUMERIC(12, 2) NOT NULL CHECK (minimum_selling_price >= 0),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_until TIMESTAMPTZ,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
    ON public.product_price_history(product_id, effective_from DESC);

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_history_select" ON public.product_price_history;
CREATE POLICY "price_history_select" ON public.product_price_history
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "price_history_modify" ON public.product_price_history;
CREATE POLICY "price_history_modify" ON public.product_price_history
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 3. INVENTORY RECONCILIATION / COUNTING TABLES
CREATE TABLE IF NOT EXISTS public.inventory_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    counted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_count_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    system_quantity NUMERIC(12, 3) NOT NULL,
    counted_quantity NUMERIC(12, 3) NOT NULL,
    difference NUMERIC(12, 3) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_count_items_count_id
    ON public.inventory_count_items(inventory_count_id);

ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_counts_select" ON public.inventory_counts;
CREATE POLICY "inventory_counts_select" ON public.inventory_counts
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "inventory_counts_modify" ON public.inventory_counts;
CREATE POLICY "inventory_counts_modify" ON public.inventory_counts
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "inventory_count_items_select" ON public.inventory_count_items;
CREATE POLICY "inventory_count_items_select" ON public.inventory_count_items
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "inventory_count_items_modify" ON public.inventory_count_items;
CREATE POLICY "inventory_count_items_modify" ON public.inventory_count_items
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());


-- 4. GROCERY BATCH & EXPIRY FOUNDATION
CREATE TABLE IF NOT EXISTS public.product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (quantity >= 0),
    purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_batches_expiry
    ON public.product_batches(product_id, expiry_date);

ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_batches_select" ON public.product_batches;
CREATE POLICY "product_batches_select" ON public.product_batches
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "product_batches_modify" ON public.product_batches;
CREATE POLICY "product_batches_modify" ON public.product_batches
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 5. ATOMIC INVENTORY MUTATION RPC FUNCTION
-- Guarantees atomic stock check, stock update, movement log, and audit record in a single transaction.
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
AS $$
DECLARE
    v_current_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
    v_actual_cost NUMERIC(12, 2);
BEGIN
    -- 1. Lock the product row for update to prevent concurrent race conditions
    SELECT stock_quantity, purchase_cost
    INTO v_current_stock, v_actual_cost
    FROM public.products
    WHERE id = p_product_id AND archived_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found or is archived', p_product_id;
    END IF;

    -- Calculate projected stock
    v_new_stock := v_current_stock + p_quantity_change;

    -- Enforce non-negative rule unless explicitly overridden by configuration
    IF v_new_stock < 0 AND NOT p_allow_negative THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Current stock: %, requested change: %',
            p_product_id, v_current_stock, p_quantity_change;
    END IF;

    -- 2. Update stock quantity
    UPDATE public.products
    SET stock_quantity = v_new_stock,
        updated_at = now()
    WHERE id = p_product_id;

    -- 3. Record inventory movement log
    INSERT INTO public.inventory_movements (
        product_id,
        movement_type,
        quantity,
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
        p_reference_type,
        p_reference_id,
        COALESCE(p_unit_cost, v_actual_cost),
        p_notes,
        p_user_id
    );

    -- 4. Record audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        p_user_id,
        'inventory.stock_mutated',
        'product',
        p_product_id,
        jsonb_build_object('stock_quantity', v_current_stock),
        jsonb_build_object(
            'stock_quantity', v_new_stock,
            'change', p_quantity_change,
            'movement_type', p_movement_type,
            'reference_type', p_reference_type
        )
    );

    RETURN v_new_stock;
END;
$$;
