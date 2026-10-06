-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 5: Purchases, Suppliers, Receiving (GRN), Invoices, Payments & Returns
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. ENUM ENHANCEMENTS
-- Add partially_received and closed to purchase_status enum if not present
DO $$ BEGIN
    ALTER TYPE public.purchase_status ADD VALUE IF NOT EXISTS 'partially_received';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE public.purchase_status ADD VALUE IF NOT EXISTS 'closed';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'cheque';
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 2. SEQUENCES FOR HUMAN-READABLE DOCUMENT NUMBERS
CREATE SEQUENCE IF NOT EXISTS public.seq_supplier_code START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.seq_purchase_number START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.seq_grn_number START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.seq_supplier_payment START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.seq_supplier_return START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_document_code(p_prefix TEXT, p_seq TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_num BIGINT;
    v_year TEXT;
BEGIN
    v_year := to_char(CURRENT_DATE, 'YYYY');
    EXECUTE format('SELECT nextval(%L)', p_seq) INTO v_num;
    RETURN format('%s-%s-%s', p_prefix, v_year, lpad(v_num::text, 5, '0'));
END;
$$;


-- 3. EXTEND SUPPLIERS TABLE
ALTER TABLE public.suppliers
    ADD COLUMN IF NOT EXISTS supplier_code TEXT,
    ADD COLUMN IF NOT EXISTS tax_identifier TEXT,
    ADD COLUMN IF NOT EXISTS payment_terms TEXT NOT NULL DEFAULT '30 days',
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (credit_limit >= 0),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Populate missing supplier codes safely
UPDATE public.suppliers
SET supplier_code = 'SUP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.seq_supplier_code')::text, 5, '0')
WHERE supplier_code IS NULL;

-- Enforce uniqueness on supplier_code
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_suppliers_supplier_code'
    ) THEN
        ALTER TABLE public.suppliers ADD CONSTRAINT uq_suppliers_supplier_code UNIQUE (supplier_code);
    END IF;
END $$;


-- 4. EXTEND PURCHASES & PURCHASE ITEMS TABLES
ALTER TABLE public.purchases
    ADD COLUMN IF NOT EXISTS purchase_number TEXT,
    ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    ADD COLUMN IF NOT EXISTS additional_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (additional_charges >= 0),
    ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ordered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS invoice_status TEXT NOT NULL DEFAULT 'unbilled' CHECK (invoice_status IN ('unbilled', 'partially_billed', 'billed')),
    ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending';

-- Populate missing purchase numbers safely
UPDATE public.purchases
SET purchase_number = 'PO-' || to_char(COALESCE(purchase_date, CURRENT_DATE), 'YYYY') || '-' || lpad(nextval('public.seq_purchase_number')::text, 5, '0')
WHERE purchase_number IS NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_purchases_purchase_number'
    ) THEN
        ALTER TABLE public.purchases ADD CONSTRAINT uq_purchases_purchase_number UNIQUE (purchase_number);
    END IF;
END $$;

ALTER TABLE public.purchase_items
    ADD COLUMN IF NOT EXISTS received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (received_quantity >= 0),
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    ADD COLUMN IF NOT EXISTS notes TEXT;


-- 5. CREATE GOODS RECEIVED NOTES (GRN) & ITEMS
CREATE TABLE IF NOT EXISTS public.goods_received_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    grn_number TEXT NOT NULL UNIQUE,
    delivery_note_number TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    notes TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goods_received_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES public.goods_received_notes(id) ON DELETE CASCADE,
    purchase_item_id UUID NOT NULL REFERENCES public.purchase_items(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    ordered_quantity NUMERIC(12, 3) NOT NULL CHECK (ordered_quantity >= 0),
    previously_received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (previously_received_quantity >= 0),
    received_quantity NUMERIC(12, 3) NOT NULL CHECK (received_quantity >= 0),
    accepted_quantity NUMERIC(12, 3) NOT NULL CHECK (accepted_quantity >= 0),
    rejected_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (rejected_quantity >= 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(12, 2) NOT NULL CHECK (total_cost >= 0),
    batch_number TEXT,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 6. CREATE SUPPLIER INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (outstanding_amount >= 0),
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    attachment_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_supplier_invoice UNIQUE (supplier_id, invoice_number)
);


-- 7. CREATE SUPPLIER PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method public.payment_method NOT NULL DEFAULT 'bank_transfer',
    reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 8. CREATE SUPPLIER RETURNS TABLES
CREATE TABLE IF NOT EXISTS public.supplier_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'approved', 'completed', 'rejected', 'cancelled')),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    reason TEXT NOT NULL,
    notes TEXT,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supplier_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES public.supplier_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(12, 2) NOT NULL CHECK (total_cost >= 0),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON public.purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_goods_received_purchase_id ON public.goods_received_notes(purchase_id);
CREATE INDEX IF NOT EXISTS idx_goods_received_supplier_id ON public.goods_received_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices(status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_due_date ON public.supplier_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON public.supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON public.supplier_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_supplier_id ON public.supplier_returns(supplier_id);


-- 10. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_return_items ENABLE ROW LEVEL SECURITY;

-- GRN: Staff view, trusted RPC write
DROP POLICY IF EXISTS "grn_select" ON public.goods_received_notes;
CREATE POLICY "grn_select" ON public.goods_received_notes FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "grn_write_service" ON public.goods_received_notes;
CREATE POLICY "grn_write_service" ON public.goods_received_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "grn_items_select" ON public.goods_received_items;
CREATE POLICY "grn_items_select" ON public.goods_received_items FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "grn_items_write_service" ON public.goods_received_items;
CREATE POLICY "grn_items_write_service" ON public.goods_received_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Supplier Invoices
DROP POLICY IF EXISTS "invoices_select" ON public.supplier_invoices;
CREATE POLICY "invoices_select" ON public.supplier_invoices FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "invoices_insert" ON public.supplier_invoices;
CREATE POLICY "invoices_insert" ON public.supplier_invoices FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "invoices_update" ON public.supplier_invoices;
CREATE POLICY "invoices_update" ON public.supplier_invoices FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Supplier Payments
DROP POLICY IF EXISTS "payments_select" ON public.supplier_payments;
CREATE POLICY "payments_select" ON public.supplier_payments FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "payments_insert" ON public.supplier_payments;
CREATE POLICY "payments_insert" ON public.supplier_payments FOR INSERT WITH CHECK (public.is_admin());

-- Supplier Returns
DROP POLICY IF EXISTS "returns_select" ON public.supplier_returns;
CREATE POLICY "returns_select" ON public.supplier_returns FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "returns_insert" ON public.supplier_returns;
CREATE POLICY "returns_insert" ON public.supplier_returns FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "returns_update" ON public.supplier_returns;
CREATE POLICY "returns_update" ON public.supplier_returns FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "return_items_select" ON public.supplier_return_items;
CREATE POLICY "return_items_select" ON public.supplier_return_items FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "return_items_insert" ON public.supplier_return_items;
CREATE POLICY "return_items_insert" ON public.supplier_return_items FOR INSERT WITH CHECK (public.is_staff());


-- 11. ATOMIC TRANSACTION: RECEIVE PURCHASE ORDER (GRN + STOCK IN)
CREATE OR REPLACE FUNCTION public.receive_purchase_order_atomic(
    p_purchase_id UUID,
    p_items JSONB,
    p_delivery_note TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_purchase RECORD;
    v_item JSONB;
    v_purchase_item_id UUID;
    v_product_id UUID;
    v_accepted_qty NUMERIC(12, 3);
    v_rejected_qty NUMERIC(12, 3);
    v_unit_cost NUMERIC(12, 2);
    v_batch_number TEXT;
    v_expiry_date DATE;
    v_pitem RECORD;
    v_prod RECORD;
    v_current_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
    v_grn_id UUID;
    v_grn_number TEXT;
    v_effective_user_id UUID;
    v_all_received BOOLEAN := true;
    v_any_received BOOLEAN := false;
    v_total_accepted_items INTEGER := 0;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- 1. Authorization & actor verification
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Permission denied: Staff access required for purchase receiving';
    END IF;

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

    -- 2. Lock purchase record FOR UPDATE
    SELECT id, purchase_number, supplier_id, status
    INTO v_purchase
    FROM public.purchases
    WHERE id = p_purchase_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', p_purchase_id;
    END IF;

    IF v_purchase.status NOT IN ('ordered', 'partially_received') THEN
        RAISE EXCEPTION 'Cannot receive purchase order with status "%" (must be ordered or partially_received)', v_purchase.status;
    END IF;

    -- 3. Create GRN Header
    v_grn_number := public.generate_document_code('GRN', 'public.seq_grn_number');

    INSERT INTO public.goods_received_notes (
        purchase_id,
        supplier_id,
        grn_number,
        delivery_note_number,
        status,
        notes,
        received_at,
        received_by
    )
    VALUES (
        p_purchase_id,
        v_purchase.supplier_id,
        v_grn_number,
        p_delivery_note,
        'completed',
        p_notes,
        v_now,
        v_effective_user_id
    )
    RETURNING id INTO v_grn_id;

    -- 4. Process each item in p_items atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_purchase_item_id := (v_item->>'purchaseItemId')::UUID;
        v_accepted_qty := COALESCE((v_item->>'acceptedQuantity')::NUMERIC(12, 3), 0.000);
        v_rejected_qty := COALESCE((v_item->>'rejectedQuantity')::NUMERIC(12, 3), 0.000);
        v_unit_cost := nullif(v_item->>'unitCost', '')::NUMERIC(12, 2);
        v_batch_number := nullif(trim(v_item->>'batchNumber'), '');
        v_expiry_date := nullif(v_item->>'expiryDate', '')::DATE;

        IF v_accepted_qty < 0 OR v_rejected_qty < 0 THEN
            RAISE EXCEPTION 'Received quantities cannot be negative';
        END IF;

        -- Lock purchase item FOR UPDATE
        SELECT id, product_id, quantity, received_quantity, final_unit_cost
        INTO v_pitem
        FROM public.purchase_items
        WHERE id = v_purchase_item_id AND purchase_id = p_purchase_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Purchase item % not found in purchase %', v_purchase_item_id, p_purchase_id;
        END IF;

        -- Fallback unit cost to purchase order item cost if not specified
        IF v_unit_cost IS NULL OR v_unit_cost <= 0 THEN
            v_unit_cost := v_pitem.final_unit_cost;
        END IF;

        -- Validate over-receiving: accepted_quantity + previously received must not exceed ordered quantity
        IF (v_pitem.received_quantity + v_accepted_qty) > v_pitem.quantity THEN
            RAISE EXCEPTION 'Over-receiving rejected for item %: ordered %, already received %, requested %',
                v_purchase_item_id, v_pitem.quantity, v_pitem.received_quantity, v_accepted_qty;
        END IF;

        -- Process stock increase only if accepted_qty > 0
        IF v_accepted_qty > 0 THEN
            v_any_received := true;

            -- Row lock on product
            SELECT id, name, stock_quantity, purchase_cost
            INTO v_prod
            FROM public.products
            WHERE id = v_pitem.product_id AND archived_at IS NULL
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Product % not found or has been archived', v_pitem.product_id;
            END IF;

            v_current_stock := v_prod.stock_quantity;
            v_new_stock := v_current_stock + v_accepted_qty;

            -- 4a. Update product stock quantity
            UPDATE public.products
            SET stock_quantity = v_new_stock,
                purchase_cost = v_unit_cost, -- Keep last acquisition purchase cost updated
                updated_at = v_now
            WHERE id = v_pitem.product_id;

            -- 4b. Insert immutable inventory movement ledger record
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
                v_pitem.product_id,
                'purchase',
                v_accepted_qty,
                v_current_stock,
                v_new_stock,
                'goods_received_note',
                v_grn_id,
                v_unit_cost,
                format('Received via %s for PO %s (%s units)', v_grn_number, v_purchase.purchase_number, v_accepted_qty),
                v_effective_user_id
            );

            -- 4c. Batch tracking if provided
            IF v_batch_number IS NOT NULL THEN
                INSERT INTO public.product_batches (
                    product_id,
                    batch_number,
                    expiry_date,
                    quantity,
                    purchase_cost
                )
                VALUES (
                    v_pitem.product_id,
                    v_batch_number,
                    v_expiry_date,
                    v_accepted_qty,
                    v_unit_cost
                )
                ON CONFLICT (product_id, batch_number) DO UPDATE SET
                    quantity = product_batches.quantity + EXCLUDED.quantity,
                    expiry_date = COALESCE(EXCLUDED.expiry_date, product_batches.expiry_date);
            END IF;

            v_total_accepted_items := v_total_accepted_items + 1;
        END IF;

        -- 4d. Update purchase_items received quantity
        UPDATE public.purchase_items
        SET received_quantity = received_quantity + v_accepted_qty
        WHERE id = v_purchase_item_id;

        -- 4e. Record GRN line item
        INSERT INTO public.goods_received_items (
            grn_id,
            purchase_item_id,
            product_id,
            ordered_quantity,
            previously_received_quantity,
            received_quantity,
            accepted_quantity,
            rejected_quantity,
            unit_cost,
            total_cost,
            batch_number,
            expiry_date,
            notes
        )
        VALUES (
            v_grn_id,
            v_purchase_item_id,
            v_pitem.product_id,
            v_pitem.quantity,
            v_pitem.received_quantity,
            (v_accepted_qty + v_rejected_qty),
            v_accepted_qty,
            v_rejected_qty,
            v_unit_cost,
            (v_accepted_qty * v_unit_cost),
            v_batch_number,
            v_expiry_date,
            nullif(trim(v_item->>'notes'), '')
        );
    END LOOP;

    -- 5. Determine new status of the Purchase Order
    -- Check if all items are fully received
    SELECT bool_and(received_quantity >= quantity)
    INTO v_all_received
    FROM public.purchase_items
    WHERE purchase_id = p_purchase_id;

    IF v_all_received THEN
        UPDATE public.purchases
        SET status = 'received',
            updated_at = v_now
        WHERE id = p_purchase_id;
    ELSIF v_any_received THEN
        UPDATE public.purchases
        SET status = 'partially_received',
            updated_at = v_now
        WHERE id = p_purchase_id;
    END IF;

    -- 6. Record System Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'purchase.received',
        'goods_received_note',
        v_grn_id,
        jsonb_build_object(
            'grn_number', v_grn_number,
            'purchase_id', p_purchase_id,
            'purchase_number', v_purchase.purchase_number,
            'items_received', v_total_accepted_items,
            'delivery_note', p_delivery_note,
            'all_received', v_all_received
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'grn_id', v_grn_id,
        'grn_number', v_grn_number,
        'all_received', v_all_received
    );
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase_order_atomic(UUID, JSONB, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.receive_purchase_order_atomic(UUID, JSONB, TEXT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order_atomic(UUID, JSONB, TEXT, TEXT, UUID) TO authenticated, service_role;


-- 12. ATOMIC TRANSACTION: RECORD SUPPLIER PAYMENT
CREATE OR REPLACE FUNCTION public.record_supplier_payment_atomic(
    p_supplier_id UUID,
    p_invoice_id UUID,
    p_amount NUMERIC(12, 2),
    p_payment_method public.payment_method,
    p_reference TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inv RECORD;
    v_payment_id UUID;
    v_payment_number TEXT;
    v_effective_user_id UUID;
    v_new_paid NUMERIC(12, 2);
    v_new_outstanding NUMERIC(12, 2);
    v_new_status TEXT;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Permission denied: Admin access required to record payments';
    END IF;

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

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be strictly greater than zero';
    END IF;

    -- 1. If linked to an invoice, lock and validate
    IF p_invoice_id IS NOT NULL THEN
        SELECT id, purchase_id, total_amount, paid_amount, outstanding_amount, status
        INTO v_inv
        FROM public.supplier_invoices
        WHERE id = p_invoice_id AND supplier_id = p_supplier_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier invoice % not found for supplier %', p_invoice_id, p_supplier_id;
        END IF;

        IF p_amount > v_inv.outstanding_amount THEN
            RAISE EXCEPTION 'Payment amount (%s) exceeds outstanding invoice balance (%s)', p_amount, v_inv.outstanding_amount;
        END IF;

        v_new_paid := v_inv.paid_amount + p_amount;
        v_new_outstanding := v_inv.outstanding_amount - p_amount;

        IF v_new_outstanding <= 0.001 THEN
            v_new_status := 'paid';
        ELSE
            v_new_status := 'partially_paid';
        END IF;

        -- Update invoice
        UPDATE public.supplier_invoices
        SET paid_amount = v_new_paid,
            outstanding_amount = v_new_outstanding,
            status = v_new_status,
            updated_at = v_now
        WHERE id = p_invoice_id;

        -- If linked to purchase, update purchase payment status
        IF v_inv.purchase_id IS NOT NULL THEN
            UPDATE public.purchases
            SET payment_status = v_new_status::public.payment_status,
                updated_at = v_now
            WHERE id = v_inv.purchase_id;
        END IF;
    END IF;

    -- 2. Insert Payment Record
    v_payment_number := public.generate_document_code('SPAY', 'public.seq_supplier_payment');

    INSERT INTO public.supplier_payments (
        payment_number,
        supplier_id,
        invoice_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        recorded_by
    )
    VALUES (
        v_payment_number,
        p_supplier_id,
        p_invoice_id,
        p_amount,
        CURRENT_DATE,
        p_payment_method,
        p_reference,
        p_notes,
        v_effective_user_id
    )
    RETURNING id INTO v_payment_id;

    -- 3. Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'supplier_payment.recorded',
        'supplier_payment',
        v_payment_id,
        jsonb_build_object(
            'payment_number', v_payment_number,
            'supplier_id', p_supplier_id,
            'invoice_id', p_invoice_id,
            'amount', p_amount,
            'payment_method', p_payment_method,
            'reference', p_reference
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_number', v_payment_number
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_supplier_payment_atomic(UUID, UUID, NUMERIC, public.payment_method, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_supplier_payment_atomic(UUID, UUID, NUMERIC, public.payment_method, TEXT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_supplier_payment_atomic(UUID, UUID, NUMERIC, public.payment_method, TEXT, TEXT, UUID) TO authenticated, service_role;


-- 13. ATOMIC TRANSACTION: COMPLETE SUPPLIER RETURN (STOCK OUT)
CREATE OR REPLACE FUNCTION public.complete_supplier_return_atomic(
    p_return_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ret RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_effective_user_id UUID;
    v_current_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
    v_total_items INTEGER := 0;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Permission denied: Admin access required to finalize supplier returns';
    END IF;

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

    -- 1. Lock return record
    SELECT id, return_number, supplier_id, purchase_id, status, total_amount
    INTO v_ret
    FROM public.supplier_returns
    WHERE id = p_return_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier return % not found', p_return_id;
    END IF;

    IF v_ret.status NOT IN ('draft', 'requested', 'approved') THEN
        RAISE EXCEPTION 'Cannot complete return with status "%" (must be draft, requested, or approved)', v_ret.status;
    END IF;

    -- 2. Process items and decrease inventory atomically
    FOR v_item IN
        SELECT id, product_id, quantity, unit_cost
        FROM public.supplier_return_items
        WHERE return_id = p_return_id
    LOOP
        -- Lock product
        SELECT id, name, stock_quantity
        INTO v_prod
        FROM public.products
        WHERE id = v_item.product_id AND archived_at IS NULL
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found or has been archived', v_item.product_id;
        END IF;

        IF v_prod.stock_quantity < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock to return "%": available % units, requested return of % units',
                v_prod.name, v_prod.stock_quantity, v_item.quantity;
        END IF;

        v_current_stock := v_prod.stock_quantity;
        v_new_stock := v_current_stock - v_item.quantity;

        -- Update stock
        UPDATE public.products
        SET stock_quantity = v_new_stock,
            updated_at = v_now
        WHERE id = v_item.product_id;

        -- Insert movement ledger record
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
            'supplier_return',
            -v_item.quantity,
            v_current_stock,
            v_new_stock,
            'supplier_return',
            p_return_id,
            v_item.unit_cost,
            format('Supplier Return %s (Qty: %s)', v_ret.return_number, v_item.quantity),
            v_effective_user_id
        );

        v_total_items := v_total_items + 1;
    END LOOP;

    -- 3. Mark return completed
    UPDATE public.supplier_returns
    SET status = 'completed',
        completed_at = v_now,
        approved_by = v_effective_user_id,
        updated_at = v_now
    WHERE id = p_return_id;

    -- 4. Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values
    )
    VALUES (
        v_effective_user_id,
        'supplier_return.completed',
        'supplier_return',
        p_return_id,
        jsonb_build_object(
            'return_number', v_ret.return_number,
            'supplier_id', v_ret.supplier_id,
            'purchase_id', v_ret.purchase_id,
            'items_count', v_total_items,
            'total_amount', v_ret.total_amount
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'return_id', p_return_id,
        'return_number', v_ret.return_number,
        'items_returned', v_total_items
    );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_supplier_return_atomic(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_supplier_return_atomic(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_supplier_return_atomic(UUID, UUID) TO authenticated, service_role;
