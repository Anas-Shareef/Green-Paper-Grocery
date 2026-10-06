-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 8: Promotions, Pricing, Discounts & Customer Loyalty
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    promotion_type TEXT NOT NULL CHECK (promotion_type IN ('product', 'category', 'cart', 'first_order', 'buy_x_get_y', 'minimum_spend')),
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item')),
    discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value >= 0),
    minimum_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (minimum_order_amount >= 0),
    maximum_discount_amount NUMERIC(12, 2) CHECK (maximum_discount_amount IS NULL OR maximum_discount_amount >= 0),
    buy_quantity INTEGER CHECK (buy_quantity IS NULL OR buy_quantity > 0),
    get_quantity INTEGER CHECK (get_quantity IS NULL OR get_quantity > 0),
    start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'expired', 'archived')),
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit >= 0),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    per_customer_limit INTEGER CHECK (per_customer_limit IS NULL OR per_customer_limit >= 0),
    is_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
    banner_text TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(promotion_type);

-- 2. PROMOTION PRODUCTS JUNCTION
CREATE TABLE IF NOT EXISTS public.promotion_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_products_prod ON public.promotion_products(product_id);

-- 3. PROMOTION CATEGORIES JUNCTION
CREATE TABLE IF NOT EXISTS public.promotion_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(promotion_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_categories_cat ON public.promotion_categories(category_id);

-- 4. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit >= 0),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    per_customer_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_customer_limit >= 1),
    minimum_order_amount NUMERIC(12, 2) CHECK (minimum_order_amount IS NULL OR minimum_order_amount >= 0),
    maximum_discount_amount NUMERIC(12, 2) CHECK (maximum_discount_amount IS NULL OR maximum_discount_amount >= 0),
    start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- 5. COUPON REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_cust ON public.coupon_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);

-- 6. CUSTOMER LOYALTY ACCOUNTS
CREATE TABLE IF NOT EXISTS public.customer_loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE UNIQUE,
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_points_earned INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points_earned >= 0),
    lifetime_points_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points_redeemed >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_cust ON public.customer_loyalty_accounts(customer_id);

-- 7. LOYALTY TRANSACTIONS LEDGER (IMMUTABLE)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment', 'reversal')),
    points INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_cust ON public.loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order ON public.loyalty_transactions(order_id);

-- 8. EXTEND orders TABLE FOR HISTORICAL COMMERCIAL SNAPSHOTS
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS promotion_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS coupon_code_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS promotion_snapshots JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 9. SEED DEFAULT LOYALTY SETTINGS IF MISSING
INSERT INTO public.settings (key, value, updated_at)
VALUES (
    'loyalty_program',
    '{"enabled": true, "points_per_aed": 1.0, "redemption_rate": 0.05, "min_redemption_points": 100}'::jsonb,
    now()
)
ON CONFLICT (key) DO NOTHING;

-- 10. ROW LEVEL SECURITY POLICIES

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Promotions: staff full access, customers/public read active promotions
DROP POLICY IF EXISTS "promotions_staff_all" ON public.promotions;
CREATE POLICY "promotions_staff_all" ON public.promotions
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "promotions_public_select" ON public.promotions;
CREATE POLICY "promotions_public_select" ON public.promotions
    FOR SELECT USING (
        status = 'active' AND
        start_at <= now() AND
        (end_at IS NULL OR end_at > now())
    );

-- Promotion products / categories: staff all, public select
DROP POLICY IF EXISTS "promo_products_staff_all" ON public.promotion_products;
CREATE POLICY "promo_products_staff_all" ON public.promotion_products
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "promo_products_public_select" ON public.promotion_products;
CREATE POLICY "promo_products_public_select" ON public.promotion_products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "promo_categories_staff_all" ON public.promotion_categories;
CREATE POLICY "promo_categories_staff_all" ON public.promotion_categories
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "promo_categories_public_select" ON public.promotion_categories;
CREATE POLICY "promo_categories_public_select" ON public.promotion_categories
    FOR SELECT USING (true);

-- Coupons: staff all, customers select active by exact query
DROP POLICY IF EXISTS "coupons_staff_all" ON public.coupons;
CREATE POLICY "coupons_staff_all" ON public.coupons
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "coupons_public_select" ON public.coupons;
CREATE POLICY "coupons_public_select" ON public.coupons
    FOR SELECT USING (
        is_active = true AND
        start_at <= now() AND
        (end_at IS NULL OR end_at > now())
    );

-- Coupon redemptions: staff all, customer select own
DROP POLICY IF EXISTS "coupon_redemptions_staff_all" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_staff_all" ON public.coupon_redemptions
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "coupon_redemptions_customer_select" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_customer_select" ON public.coupon_redemptions
    FOR SELECT USING (
        customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
        )
    );

-- Loyalty accounts: staff all, customer select own
DROP POLICY IF EXISTS "loyalty_accounts_staff_all" ON public.customer_loyalty_accounts;
CREATE POLICY "loyalty_accounts_staff_all" ON public.customer_loyalty_accounts
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "loyalty_accounts_customer_select" ON public.customer_loyalty_accounts;
CREATE POLICY "loyalty_accounts_customer_select" ON public.customer_loyalty_accounts
    FOR SELECT USING (
        customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
        )
    );

-- Loyalty transactions: staff all, customer select own
DROP POLICY IF EXISTS "loyalty_transactions_staff_all" ON public.loyalty_transactions;
CREATE POLICY "loyalty_transactions_staff_all" ON public.loyalty_transactions
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "loyalty_transactions_customer_select" ON public.loyalty_transactions;
CREATE POLICY "loyalty_transactions_customer_select" ON public.loyalty_transactions
    FOR SELECT USING (
        customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
        )
    );

-- 11. MANUAL LOYALTY ADJUSTMENT RPC (STAFF ONLY)
CREATE OR REPLACE FUNCTION public.adjust_loyalty_points_atomic(
    p_customer_id UUID,
    p_points INTEGER,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_account RECORD;
    v_new_balance INTEGER;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can adjust loyalty points';
    END IF;

    IF p_points = 0 THEN
        RAISE EXCEPTION 'Adjustment points cannot be zero';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
        RAISE EXCEPTION 'A valid reason is required for loyalty adjustment';
    END IF;

    -- Lock or create loyalty account row FOR UPDATE
    SELECT * INTO v_account
    FROM public.customer_loyalty_accounts
    WHERE customer_id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.customer_loyalty_accounts (customer_id, points_balance, lifetime_points_earned, lifetime_points_redeemed, created_at, updated_at)
        VALUES (p_customer_id, 0, 0, 0, v_now, v_now)
        RETURNING * INTO v_account;
    END IF;

    v_new_balance := v_account.points_balance + p_points;

    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance: Customer only has % points', v_account.points_balance;
    END IF;

    -- Update account
    UPDATE public.customer_loyalty_accounts
    SET points_balance = v_new_balance,
        lifetime_points_earned = CASE WHEN p_points > 0 THEN v_account.lifetime_points_earned + p_points ELSE v_account.lifetime_points_earned END,
        lifetime_points_redeemed = CASE WHEN p_points < 0 THEN v_account.lifetime_points_redeemed + abs(p_points) ELSE v_account.lifetime_points_redeemed END,
        updated_at = v_now
    WHERE customer_id = p_customer_id;

    -- Append to immutable ledger
    INSERT INTO public.loyalty_transactions (
        customer_id,
        order_id,
        transaction_type,
        points,
        balance_before,
        balance_after,
        reason,
        created_by,
        created_at
    )
    VALUES (
        p_customer_id,
        NULL,
        'adjustment',
        p_points,
        v_account.points_balance,
        v_new_balance,
        p_reason,
        v_actor_id,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'customer_id', p_customer_id,
        'balance_before', v_account.points_balance,
        'balance_after', v_new_balance,
        'adjusted_points', p_points
    );
END;
$$;

-- 12. EXTENDED SERVER-AUTHORITATIVE ORDER CREATION RPC
-- Seamlessly integrates product base pricing, promotional rules, coupon validation,
-- atomic coupon redemption, loyalty redemption, tax calculation, and delivery fee
CREATE OR REPLACE FUNCTION public.create_customer_order_atomic(
    p_customer_id UUID,
    p_items JSONB,
    p_delivery_address TEXT,
    p_delivery_notes TEXT DEFAULT NULL,
    p_payment_method payment_method DEFAULT 'cash',
    p_order_source order_source DEFAULT 'website',
    p_user_id UUID DEFAULT NULL,
    p_coupon_code TEXT DEFAULT NULL,
    p_loyalty_points_to_redeem INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_prod RECORD;
    v_item_json JSONB;
    v_product_id UUID;
    v_quantity NUMERIC(12, 3);
    v_base_unit_price NUMERIC(12, 2);
    v_effective_unit_price NUMERIC(12, 2);
    v_line_item_discount NUMERIC(12, 2);
    v_line_total NUMERIC(12, 2);
    v_subtotal NUMERIC(12, 2) := 0.00;
    v_product_promo_discount NUMERIC(12, 2) := 0.00;
    v_cart_promo_discount NUMERIC(12, 2) := 0.00;
    v_coupon_discount NUMERIC(12, 2) := 0.00;
    v_loyalty_discount NUMERIC(12, 2) := 0.00;
    v_total_discount NUMERIC(12, 2) := 0.00;
    v_tax_rate NUMERIC(5, 4) := 0.0500; -- 5% UAE standard VAT
    v_taxable_subtotal NUMERIC(12, 2) := 0.00;
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
    v_coupon RECORD;
    v_coupon_normalized TEXT;
    v_cust_coupon_uses INTEGER;
    v_loyalty_acct RECORD;
    v_loyalty_pts_rate NUMERIC(12, 2) := 0.05; -- 100 points = 5 AED (1 pt = 0.05 AED)
    v_cart_promo RECORD;
    v_promo_snapshots JSONB := '[]'::jsonb;
BEGIN
    -- 1. Validate customer if provided
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
        SELECT id, name, selling_price, promo_price, purchase_cost, stock_quantity, is_active, archived_at, category_id
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

        v_base_unit_price := v_prod.selling_price;
        v_effective_unit_price := v_base_unit_price;

        -- Check active product/category promotions
        DECLARE
            v_p RECORD;
            v_calc_unit_price NUMERIC(12, 2);
        BEGIN
            -- Find highest active product discount or promo_price
            IF v_prod.promo_price IS NOT NULL AND v_prod.promo_price > 0 AND v_prod.promo_price < v_base_unit_price THEN
                v_effective_unit_price := v_prod.promo_price;
            END IF;

            -- Check if an active promotional rule applies to this product specifically
            FOR v_p IN
                SELECT p.*
                FROM public.promotions p
                JOIN public.promotion_products pp ON pp.promotion_id = p.id
                WHERE pp.product_id = v_product_id
                AND p.status = 'active'
                AND p.start_at <= v_now
                AND (p.end_at IS NULL OR p.end_at > v_now)
                ORDER BY p.discount_value DESC
                LIMIT 1
            LOOP
                IF v_p.discount_type = 'percentage' THEN
                    v_calc_unit_price := round(v_base_unit_price * (1.0 - (v_p.discount_value / 100.0)), 2);
                ELSIF v_p.discount_type = 'fixed_amount' THEN
                    v_calc_unit_price := GREATEST(0.00, v_base_unit_price - v_p.discount_value);
                END IF;

                IF v_calc_unit_price < v_effective_unit_price THEN
                    v_effective_unit_price := v_calc_unit_price;
                    v_promo_snapshots := v_promo_snapshots || jsonb_build_object(
                        'type', 'product_promotion',
                        'promotion_id', v_p.id,
                        'name', v_p.name,
                        'product_id', v_product_id,
                        'discount_value', v_p.discount_value,
                        'discount_type', v_p.discount_type
                    );
                END IF;
            END LOOP;

            -- If no specific product promotion, check category promotion
            IF v_effective_unit_price = v_base_unit_price AND v_prod.category_id IS NOT NULL THEN
                FOR v_p IN
                    SELECT p.*
                    FROM public.promotions p
                    JOIN public.promotion_categories pc ON pc.promotion_id = p.id
                    WHERE pc.category_id = v_prod.category_id
                    AND p.status = 'active'
                    AND p.start_at <= v_now
                    AND (p.end_at IS NULL OR p.end_at > v_now)
                    ORDER BY p.discount_value DESC
                    LIMIT 1
                LOOP
                    IF v_p.discount_type = 'percentage' THEN
                        v_calc_unit_price := round(v_base_unit_price * (1.0 - (v_p.discount_value / 100.0)), 2);
                    ELSIF v_p.discount_type = 'fixed_amount' THEN
                        v_calc_unit_price := GREATEST(0.00, v_base_unit_price - v_p.discount_value);
                    END IF;

                    IF v_calc_unit_price < v_effective_unit_price THEN
                        v_effective_unit_price := v_calc_unit_price;
                        v_promo_snapshots := v_promo_snapshots || jsonb_build_object(
                            'type', 'category_promotion',
                            'promotion_id', v_p.id,
                            'name', v_p.name,
                            'category_id', v_prod.category_id,
                            'discount_value', v_p.discount_value,
                            'discount_type', v_p.discount_type
                        );
                    END IF;
                END LOOP;
            END IF;
        END;

        v_line_item_discount := round((v_base_unit_price - v_effective_unit_price) * v_quantity, 2);
        v_product_promo_discount := v_product_promo_discount + v_line_item_discount;
        v_line_total := round(v_effective_unit_price * v_quantity, 2);
        v_subtotal := v_subtotal + round(v_base_unit_price * v_quantity, 2);

        -- Stock deduction
        v_current_stock := v_prod.stock_quantity;
        v_new_stock := v_current_stock - v_quantity;

        UPDATE public.products
        SET stock_quantity = v_new_stock,
            updated_at = v_now
        WHERE id = v_product_id;

        -- Immutable inventory movement ledger
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
            v_effective_unit_price,
            v_prod.purchase_cost,
            v_line_item_discount,
            v_line_total
        );

        v_items_count := v_items_count + 1;
    END LOOP;

    -- Subtotal after product-level discounts
    v_taxable_subtotal := v_subtotal - v_product_promo_discount;

    -- 5. Evaluate Cart / Minimum Spend / First Order Promotions (if not exclusive)
    FOR v_cart_promo IN
        SELECT p.*
        FROM public.promotions p
        WHERE p.promotion_type IN ('cart', 'minimum_spend', 'first_order')
        AND p.status = 'active'
        AND p.start_at <= v_now
        AND (p.end_at IS NULL OR p.end_at > v_now)
        AND v_taxable_subtotal >= p.minimum_order_amount
        ORDER BY p.discount_value DESC
        LIMIT 1
    LOOP
        -- If first order promotion, verify customer order history
        IF v_cart_promo.promotion_type = 'first_order' THEN
            IF p_customer_id IS NOT NULL THEN
                PERFORM 1 FROM public.orders
                WHERE customer_id = p_customer_id
                AND status NOT IN ('cancelled', 'failed_delivery');
                IF FOUND THEN
                    CONTINUE; -- Not eligible for first-order discount
                END IF;
            END IF;
        END IF;

        IF v_cart_promo.discount_type = 'percentage' THEN
            v_cart_promo_discount := round(v_taxable_subtotal * (v_cart_promo.discount_value / 100.0), 2);
            IF v_cart_promo.maximum_discount_amount IS NOT NULL THEN
                v_cart_promo_discount := LEAST(v_cart_promo_discount, v_cart_promo.maximum_discount_amount);
            END IF;
        ELSIF v_cart_promo.discount_type = 'fixed_amount' THEN
            v_cart_promo_discount := LEAST(v_taxable_subtotal, v_cart_promo.discount_value);
        END IF;

        IF v_cart_promo_discount > 0 THEN
            v_promo_snapshots := v_promo_snapshots || jsonb_build_object(
                'type', v_cart_promo.promotion_type,
                'promotion_id', v_cart_promo.id,
                'name', v_cart_promo.name,
                'discount_value', v_cart_promo.discount_value,
                'discount_type', v_cart_promo.discount_type,
                'discount_amount', v_cart_promo_discount
            );
        END IF;
    END LOOP;

    v_taxable_subtotal := GREATEST(0.00, v_taxable_subtotal - v_cart_promo_discount);

    -- 6. Evaluate Coupon (if provided)
    IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
        v_coupon_normalized := upper(trim(p_coupon_code));

        -- Lock coupon row FOR UPDATE
        SELECT c.*, p.discount_type, p.discount_value, p.minimum_order_amount as promo_min_order, p.maximum_discount_amount as promo_max_discount
        INTO v_coupon
        FROM public.coupons c
        JOIN public.promotions p ON p.id = c.promotion_id
        WHERE c.code = v_coupon_normalized
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coupon code "%" is invalid', v_coupon_normalized;
        END IF;

        IF NOT v_coupon.is_active THEN
            RAISE EXCEPTION 'Coupon "%" is no longer active', v_coupon_normalized;
        END IF;

        IF v_coupon.start_at > v_now THEN
            RAISE EXCEPTION 'Coupon "%" is not valid yet', v_coupon_normalized;
        END IF;

        IF v_coupon.end_at IS NOT NULL AND v_coupon.end_at <= v_now THEN
            RAISE EXCEPTION 'Coupon "%" has expired', v_coupon_normalized;
        END IF;

        IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
            RAISE EXCEPTION 'Coupon "%" has reached its maximum usage limit', v_coupon_normalized;
        END IF;

        -- Check minimum order threshold
        IF v_coupon.minimum_order_amount IS NOT NULL AND v_taxable_subtotal < v_coupon.minimum_order_amount THEN
            RAISE EXCEPTION 'Order subtotal (AED %) is less than coupon minimum required (AED %)',
                v_taxable_subtotal, v_coupon.minimum_order_amount;
        END IF;

        -- Check customer usage limit
        IF p_customer_id IS NOT NULL THEN
            SELECT count(*) INTO v_cust_coupon_uses
            FROM public.coupon_redemptions
            WHERE coupon_id = v_coupon.id AND customer_id = p_customer_id;

            IF v_cust_coupon_uses >= v_coupon.per_customer_limit THEN
                RAISE EXCEPTION 'You have already used coupon "%" the maximum allowed times', v_coupon_normalized;
            END IF;
        END IF;

        -- Calculate coupon discount
        IF v_coupon.discount_type = 'percentage' THEN
            v_coupon_discount := round(v_taxable_subtotal * (v_coupon.discount_value / 100.0), 2);
            IF v_coupon.maximum_discount_amount IS NOT NULL THEN
                v_coupon_discount := LEAST(v_coupon_discount, v_coupon.maximum_discount_amount);
            ELSIF v_coupon.promo_max_discount IS NOT NULL THEN
                v_coupon_discount := LEAST(v_coupon_discount, v_coupon.promo_max_discount);
            END IF;
        ELSIF v_coupon.discount_type = 'fixed_amount' THEN
            v_coupon_discount := LEAST(v_taxable_subtotal, v_coupon.discount_value);
        END IF;

        -- Atomic update to coupon usage
        UPDATE public.coupons
        SET usage_count = usage_count + 1,
            updated_at = v_now
        WHERE id = v_coupon.id;

        -- Insert coupon redemption
        IF p_customer_id IS NOT NULL THEN
            INSERT INTO public.coupon_redemptions (
                coupon_id,
                customer_id,
                order_id,
                discount_amount,
                redeemed_at
            )
            VALUES (
                v_coupon.id,
                p_customer_id,
                v_order_id,
                v_coupon_discount,
                v_now
            );
        END IF;

        v_taxable_subtotal := GREATEST(0.00, v_taxable_subtotal - v_coupon_discount);
    END IF;

    -- 7. Evaluate Loyalty Redemption (if requested)
    IF p_loyalty_points_to_redeem > 0 THEN
        IF p_customer_id IS NULL THEN
            RAISE EXCEPTION 'Customer account required to redeem loyalty points';
        END IF;

        -- Lock loyalty account row FOR UPDATE
        SELECT * INTO v_loyalty_acct
        FROM public.customer_loyalty_accounts
        WHERE customer_id = p_customer_id
        FOR UPDATE;

        IF NOT FOUND OR v_loyalty_acct.points_balance < p_loyalty_points_to_redeem THEN
            RAISE EXCEPTION 'Insufficient loyalty points. Balance: %, Requested: %',
                COALESCE(v_loyalty_acct.points_balance, 0), p_loyalty_points_to_redeem;
        END IF;

        -- Calculate monetary value of redeemed points
        v_loyalty_discount := round(p_loyalty_points_to_redeem * v_loyalty_pts_rate, 2);
        -- Ensure loyalty discount does not exceed the remaining payable merchandise amount
        v_loyalty_discount := LEAST(v_loyalty_discount, v_taxable_subtotal);

        -- Deduct points
        UPDATE public.customer_loyalty_accounts
        SET points_balance = points_balance - p_loyalty_points_to_redeem,
            lifetime_points_redeemed = lifetime_points_redeemed + p_loyalty_points_to_redeem,
            updated_at = v_now
        WHERE customer_id = p_customer_id;

        -- Record immutable loyalty transaction
        INSERT INTO public.loyalty_transactions (
            customer_id,
            order_id,
            transaction_type,
            points,
            balance_before,
            balance_after,
            reason,
            created_by,
            created_at
        )
        VALUES (
            p_customer_id,
            v_order_id,
            'redeem',
            -p_loyalty_points_to_redeem,
            v_loyalty_acct.points_balance,
            v_loyalty_acct.points_balance - p_loyalty_points_to_redeem,
            'Redeemed on Order ' || v_order_number,
            p_user_id,
            v_now
        );

        v_taxable_subtotal := GREATEST(0.00, v_taxable_subtotal - v_loyalty_discount);
    END IF;

    -- Total combined discount
    v_total_discount := v_product_promo_discount + v_cart_promo_discount + v_coupon_discount + v_loyalty_discount;

    -- 8. Calculate UAE VAT (5%) on final taxable merchandise amount
    v_tax_amount := round(v_taxable_subtotal * v_tax_rate, 2);

    -- 9. Delivery fee (standard rule: free if original merchandise subtotal >= 100 AED, else 10 AED)
    IF (v_subtotal - v_product_promo_discount) >= 100.00 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 10.00;
    END IF;

    -- Authoritative Grand Total
    v_grand_total := v_taxable_subtotal + v_tax_amount + v_delivery_fee;

    -- 10. Insert Order Header with comprehensive commercial snapshots
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
        promotion_discount,
        coupon_discount,
        loyalty_discount,
        coupon_id,
        coupon_code_snapshot,
        loyalty_points_redeemed,
        loyalty_points_earned,
        promotion_snapshots,
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
        v_total_discount,
        (v_product_promo_discount + v_cart_promo_discount),
        v_coupon_discount,
        v_loyalty_discount,
        v_coupon.id,
        v_coupon_normalized,
        p_loyalty_points_to_redeem,
        0, -- earned on delivery
        v_promo_snapshots,
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

    -- 11. Create deliveries tracking row
    INSERT INTO public.deliveries (
        order_id,
        assigned_to,
        status,
        delivery_address,
        delivery_notes,
        created_at,
        updated_at
    )
    VALUES (
        v_order_id,
        NULL,
        'unassigned',
        p_delivery_address,
        p_delivery_notes,
        v_now,
        v_now
    );

    -- 12. Create initial order status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        reason,
        notes
    )
    VALUES (
        v_order_id,
        NULL,
        'pending',
        p_user_id,
        'Order placed online',
        'Customer completed storefront checkout'
    );

    -- 13. Update customer stats
    IF p_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET total_orders = total_orders + 1,
            total_spend = total_spend + v_grand_total,
            updated_at = v_now
        WHERE id = p_customer_id;
    END IF;

    -- Return comprehensive result
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'items_count', v_items_count,
        'subtotal', v_subtotal,
        'product_promo_discount', v_product_promo_discount,
        'cart_promo_discount', v_cart_promo_discount,
        'coupon_discount', v_coupon_discount,
        'loyalty_discount', v_loyalty_discount,
        'discount_amount', v_total_discount,
        'tax_amount', v_tax_amount,
        'delivery_fee', v_delivery_fee,
        'total_amount', v_grand_total
    );
END;
$$;

-- 13. UPDATE transition_order_status_atomic TO AWARD LOYALTY POINTS ON DELIVERY
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
    v_prev_status public.order_status;
    v_actor_id UUID;
    v_now TIMESTAMPTZ := now();
    v_notif_title TEXT;
    v_notif_msg TEXT;
    v_customer_user_id UUID;
    v_delivery_status TEXT;
    v_eligible_spend NUMERIC(12, 2);
    v_points_to_award INTEGER := 0;
    v_loyalty_acct RECORD;
BEGIN
    v_actor_id := auth.uid();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only store staff can transition operational order status';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    v_prev_status := v_order.status;

    IF v_prev_status = p_next_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order is already in status ' || p_next_status,
            'order_id', p_order_id,
            'status', p_next_status
        );
    END IF;

    -- Validate state transitions
    IF v_prev_status = 'pending' AND p_next_status NOT IN ('confirmed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: pending orders can only transition to confirmed or cancelled';
    ELSIF v_prev_status = 'confirmed' AND p_next_status NOT IN ('preparing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: confirmed orders can only transition to preparing or cancelled';
    ELSIF v_prev_status = 'preparing' AND p_next_status NOT IN ('ready', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: preparing orders can only transition to ready or cancelled';
    ELSIF v_prev_status = 'ready' AND p_next_status NOT IN ('out_for_delivery', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: ready orders can only transition to out_for_delivery or cancelled';
    ELSIF v_prev_status = 'out_for_delivery' AND p_next_status NOT IN ('delivered', 'failed_delivery', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: out_for_delivery orders can only transition to delivered, failed_delivery, or cancelled';
    ELSIF v_prev_status = 'failed_delivery' AND p_next_status NOT IN ('out_for_delivery', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: failed_delivery orders can only be re-dispatched or cancelled';
    ELSIF v_prev_status IN ('delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Terminal state reached: order % cannot transition from %', v_order.order_number, v_prev_status;
    END IF;

    -- Status updates
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
        -- AWARD LOYALTY POINTS IF NOT ALREADY AWARDED
        IF v_order.customer_id IS NOT NULL AND v_order.loyalty_points_earned = 0 THEN
            -- Eligible merchandise spend = subtotal - product/cart/coupon discounts
            v_eligible_spend := GREATEST(0.00, v_order.subtotal - v_order.discount_amount);
            -- 1 point per 1 AED eligible spend
            v_points_to_award := floor(v_eligible_spend);

            IF v_points_to_award > 0 THEN
                -- Lock or create loyalty account
                SELECT * INTO v_loyalty_acct
                FROM public.customer_loyalty_accounts
                WHERE customer_id = v_order.customer_id
                FOR UPDATE;

                IF NOT FOUND THEN
                    INSERT INTO public.customer_loyalty_accounts (customer_id, points_balance, lifetime_points_earned, lifetime_points_redeemed, created_at, updated_at)
                    VALUES (v_order.customer_id, v_points_to_award, v_points_to_award, 0, v_now, v_now)
                    RETURNING * INTO v_loyalty_acct;
                ELSE
                    UPDATE public.customer_loyalty_accounts
                    SET points_balance = points_balance + v_points_to_award,
                        lifetime_points_earned = lifetime_points_earned + v_points_to_award,
                        updated_at = v_now
                    WHERE customer_id = v_order.customer_id;
                END IF;

                -- Insert immutable loyalty transaction ledger
                INSERT INTO public.loyalty_transactions (
                    customer_id,
                    order_id,
                    transaction_type,
                    points,
                    balance_before,
                    balance_after,
                    reason,
                    created_by,
                    created_at
                )
                VALUES (
                    v_order.customer_id,
                    p_order_id,
                    'earn',
                    v_points_to_award,
                    COALESCE(v_loyalty_acct.points_balance - v_points_to_award, 0),
                    v_loyalty_acct.points_balance,
                    'Earned from Delivered Order ' || v_order.order_number,
                    v_actor_id,
                    v_now
                );
            END IF;
        END IF;

        UPDATE public.orders
        SET status = p_next_status,
            delivered_at = COALESCE(delivered_at, v_now),
            loyalty_points_earned = v_points_to_award,
            updated_at = v_now
        WHERE id = p_order_id;
        v_notif_title := 'Order Delivered';
        v_notif_msg := 'Order ' || v_order.order_number || ' has been successfully delivered. You earned ' || v_points_to_award || ' loyalty points!';

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
        RAISE EXCEPTION 'Please use cancel_order_staff_atomic for cancellation to handle stock and loyalty restoration';
    END IF;

    -- Synchronize deliveries table
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
        CASE WHEN p_driver_id IS NOT NULL THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'out_for_delivery' THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'delivered' THEN v_now ELSE NULL END,
        CASE WHEN p_next_status = 'failed_delivery' THEN v_now ELSE NULL END,
        p_failure_reason,
        v_now
    )
    ON CONFLICT (order_id) DO UPDATE
    SET assigned_to = COALESCE(EXCLUDED.assigned_to, deliveries.assigned_to),
        status = EXCLUDED.status,
        picked_up_at = COALESCE(deliveries.picked_up_at, EXCLUDED.picked_up_at),
        delivered_at = COALESCE(deliveries.delivered_at, EXCLUDED.delivered_at),
        failed_at = COALESCE(deliveries.failed_at, EXCLUDED.failed_at),
        failure_reason = COALESCE(EXCLUDED.failure_reason, deliveries.failure_reason),
        updated_at = v_now;

    -- Insert status history
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
        v_prev_status,
        p_next_status,
        v_actor_id,
        p_reason,
        p_notes
    );

    -- Customer notification
    IF v_order.customer_id IS NOT NULL THEN
        SELECT auth_user_id INTO v_customer_user_id
        FROM public.customers
        WHERE id = v_order.customer_id;

        IF v_customer_user_id IS NOT NULL AND v_notif_title IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                link
            )
            VALUES (
                v_customer_user_id,
                v_notif_title,
                v_notif_msg,
                'order',
                '/account/orders/' || p_order_id
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'previous_status', v_prev_status,
        'current_status', p_next_status,
        'loyalty_points_awarded', v_points_to_award,
        'updated_at', v_now
    );
END;
$$;

-- 14. UPDATE cancel_order_staff_atomic TO REVERSE COUPONS AND RESTORE REDEEMED LOYALTY POINTS
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
    v_loyalty_acct RECORD;
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

    -- Restore inventory if restock requested
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
                        'order',
                        p_order_id,
                        v_prod.purchase_cost,
                        'Restock for cancelled order ' || v_order.order_number,
                        v_actor_id
                    );

                    v_items_restored := v_items_restored + 1;
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- Reverse coupon usage count and redemptions
    IF v_order.coupon_id IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = GREATEST(0, usage_count - 1),
            updated_at = v_now
        WHERE id = v_order.coupon_id;

        DELETE FROM public.coupon_redemptions
        WHERE order_id = p_order_id;
    END IF;

    -- Restore redeemed loyalty points to customer account
    IF v_order.customer_id IS NOT NULL AND v_order.loyalty_points_redeemed > 0 THEN
        SELECT * INTO v_loyalty_acct
        FROM public.customer_loyalty_accounts
        WHERE customer_id = v_order.customer_id
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.customer_loyalty_accounts
            SET points_balance = points_balance + v_order.loyalty_points_redeemed,
                lifetime_points_redeemed = GREATEST(0, lifetime_points_redeemed - v_order.loyalty_points_redeemed),
                updated_at = v_now
            WHERE customer_id = v_order.customer_id;

            INSERT INTO public.loyalty_transactions (
                customer_id,
                order_id,
                transaction_type,
                points,
                balance_before,
                balance_after,
                reason,
                created_by,
                created_at
            )
            VALUES (
                v_order.customer_id,
                p_order_id,
                'reversal',
                v_order.loyalty_points_redeemed,
                v_loyalty_acct.points_balance,
                v_loyalty_acct.points_balance + v_order.loyalty_points_redeemed,
                'Restored redeemed points for cancelled order ' || v_order.order_number,
                v_actor_id,
                v_now
            );
        END IF;
    END IF;

    -- Update order to cancelled
    UPDATE public.orders
    SET status = 'cancelled',
        cancelled_at = v_now,
        cancellation_reason = p_reason,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Update deliveries table
    UPDATE public.deliveries
    SET status = 'failed',
        failed_at = v_now,
        failure_reason = 'Cancelled by staff: ' || p_reason,
        updated_at = v_now
    WHERE order_id = p_order_id;

    -- Status history
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
        CASE WHEN p_restock THEN 'Restocked ' || v_items_restored || ' items' ELSE 'Stock not restored' END
    );

    -- Notify customer
    IF v_order.customer_id IS NOT NULL THEN
        SELECT auth_user_id INTO v_customer_user_id
        FROM public.customers
        WHERE id = v_order.customer_id;

        IF v_customer_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                link
            )
            VALUES (
                v_customer_user_id,
                'Order Cancelled',
                'Your order ' || v_order.order_number || ' was cancelled. Reason: ' || p_reason,
                'order',
                '/account/orders/' || p_order_id
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'items_restored', v_items_restored,
        'loyalty_points_restored', v_order.loyalty_points_redeemed
    );
END;
$$;

-- 15. UPDATE cancel_customer_order_atomic FOR ONLINE CUSTOMER SELF-CANCELLATION
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
    v_loyalty_acct RECORD;
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

    -- Only allow online customer cancellation if status is 'pending' or 'confirmed'
    IF NOT public.is_staff() AND v_order.status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Order is already being prepared or dispatched and cannot be cancelled online';
    END IF;

    -- Restore stock
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
                    'order',
                    p_order_id,
                    v_prod.purchase_cost,
                    'Customer cancelled order ' || v_order.order_number,
                    p_user_id
                );

                v_items_restored := v_items_restored + 1;
            END IF;
        END IF;
    END LOOP;

    -- Reverse coupon usage
    IF v_order.coupon_id IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = GREATEST(0, usage_count - 1),
            updated_at = v_now
        WHERE id = v_order.coupon_id;

        DELETE FROM public.coupon_redemptions
        WHERE order_id = p_order_id;
    END IF;

    -- Restore redeemed loyalty points
    IF v_order.customer_id IS NOT NULL AND v_order.loyalty_points_redeemed > 0 THEN
        SELECT * INTO v_loyalty_acct
        FROM public.customer_loyalty_accounts
        WHERE customer_id = v_order.customer_id
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.customer_loyalty_accounts
            SET points_balance = points_balance + v_order.loyalty_points_redeemed,
                lifetime_points_redeemed = GREATEST(0, lifetime_points_redeemed - v_order.loyalty_points_redeemed),
                updated_at = v_now
            WHERE customer_id = v_order.customer_id;

            INSERT INTO public.loyalty_transactions (
                customer_id,
                order_id,
                transaction_type,
                points,
                balance_before,
                balance_after,
                reason,
                created_by,
                created_at
            )
            VALUES (
                v_order.customer_id,
                p_order_id,
                'reversal',
                v_order.loyalty_points_redeemed,
                v_loyalty_acct.points_balance,
                v_loyalty_acct.points_balance + v_order.loyalty_points_redeemed,
                'Restored redeemed points for customer-cancelled order ' || v_order.order_number,
                p_user_id,
                v_now
            );
        END IF;
    END IF;

    -- Update order
    UPDATE public.orders
    SET status = 'cancelled',
        cancelled_at = v_now,
        cancellation_reason = COALESCE(p_reason, 'Cancelled by customer online'),
        updated_at = v_now
    WHERE id = p_order_id;

    -- Update deliveries
    UPDATE public.deliveries
    SET status = 'failed',
        failed_at = v_now,
        failure_reason = 'Cancelled by customer: ' || COALESCE(p_reason, 'Online self-cancellation'),
        updated_at = v_now
    WHERE order_id = p_order_id;

    -- History
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
        p_user_id,
        p_reason,
        'Self-cancelled by customer online. Restocked ' || v_items_restored || ' items.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'items_restored', v_items_restored,
        'loyalty_points_restored', v_order.loyalty_points_redeemed
    );
END;
$$;
