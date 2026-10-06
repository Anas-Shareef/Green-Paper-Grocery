-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 4 Migration: Products & Inventory Management
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. SECURE ATOMIC STOCK MUTATION RPC FUNCTION
-- Hardened with explicit search_path, permission verification, parameter validation,
-- direction checks, non-negative guards, and automatic notification dispatch.

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

    -- Prevent forged client actor IDs: non-admins cannot impersonate other users
    v_effective_user_id := auth.uid();
    IF v_effective_user_id IS NULL OR (p_user_id IS NOT NULL AND public.is_admin()) THEN
        v_effective_user_id := COALESCE(p_user_id, auth.uid());
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
        RAISE EXCEPTION 'Insufficient stock for product "%" (ID: %). Available: %, Requested change: %',
            v_product_name, p_product_id, v_current_stock, p_quantity_change;
    END IF;

    -- 5. Commit atomic stock update
    UPDATE public.products
    SET stock_quantity = v_new_stock,
        updated_at = now()
    WHERE id = p_product_id;

    -- 6. Insert inventory movement audit record
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

    -- 8. Dispatch notifications on stock threshold transitions
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
            '/admin/inventory'
        );
    END IF;

    RETURN v_new_stock;
END;
$$;

-- Restrict RPC execution permissions
REVOKE ALL ON FUNCTION public.mutate_stock_atomic(UUID, NUMERIC, inventory_movement_type, TEXT, UUID, NUMERIC, TEXT, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mutate_stock_atomic(UUID, NUMERIC, inventory_movement_type, TEXT, UUID, NUMERIC, TEXT, UUID, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.mutate_stock_atomic(UUID, NUMERIC, inventory_movement_type, TEXT, UUID, NUMERIC, TEXT, UUID, BOOLEAN) TO authenticated, service_role;


-- 2. SERVER-SIDE INVENTORY VALUATION & SUMMARY FUNCTION
-- Aggregates inventory metrics completely on the database server.
CREATE OR REPLACE FUNCTION public.get_inventory_metrics()
RETURNS TABLE (
    total_products BIGINT,
    total_stock_quantity NUMERIC(14, 3),
    total_inventory_value NUMERIC(14, 2),
    low_stock_count BIGINT,
    out_of_stock_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_products,
        COALESCE(SUM(p.stock_quantity), 0.000)::NUMERIC(14, 3) AS total_stock_quantity,
        COALESCE(SUM(p.stock_quantity * p.purchase_cost), 0.00)::NUMERIC(14, 2) AS total_inventory_value,
        COUNT(*) FILTER (WHERE p.stock_quantity > 0 AND p.stock_quantity <= p.reorder_level)::BIGINT AS low_stock_count,
        COUNT(*) FILTER (WHERE p.stock_quantity = 0)::BIGINT AS out_of_stock_count
    FROM public.products p
    WHERE p.is_active = true AND p.archived_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_inventory_metrics() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_inventory_metrics() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_inventory_metrics() TO authenticated, service_role;


-- 3. SUPABASE STORAGE: PRODUCT IMAGES BUCKET & RLS POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB max image size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage object policies
DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
CREATE POLICY "product_images_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_staff_insert" ON storage.objects;
CREATE POLICY "product_images_staff_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images' AND public.is_staff());

DROP POLICY IF EXISTS "product_images_staff_update" ON storage.objects;
CREATE POLICY "product_images_staff_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images' AND public.is_staff());

DROP POLICY IF EXISTS "product_images_staff_delete" ON storage.objects;
CREATE POLICY "product_images_staff_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'product-images' AND public.is_staff());
