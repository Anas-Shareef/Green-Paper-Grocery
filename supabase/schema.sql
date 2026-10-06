-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Initial Database Schema Migration: Phase 2
-- Zone 19, Abu Dhabi
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES / ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_source AS ENUM ('website', 'whatsapp', 'manual', 'walk_in');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash',
        'card_on_delivery',
        'card_online',
        'credit',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'paid',
        'partially_paid',
        'failed',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_movement_type AS ENUM (
        'purchase',
        'sale',
        'customer_return',
        'supplier_return',
        'damaged',
        'expired',
        'adjustment',
        'opening_stock'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purchase_status AS ENUM (
        'draft',
        'ordered',
        'received',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_segment AS ENUM (
        'new',
        'regular',
        'high_value',
        'inactive',
        'vip'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. CORE APPLICATION TABLES
-- ==============================================================================

-- 4.1 PROFILES (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.3 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    barcode TEXT,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand TEXT,
    unit TEXT NOT NULL DEFAULT 'piece',
    purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_cost >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    promo_price NUMERIC(12, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
    minimum_selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (minimum_selling_price >= 0),
    stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (stock_quantity >= 0),
    reorder_level NUMERIC(12, 3) NOT NULL DEFAULT 5.000 CHECK (reorder_level >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4 CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    whatsapp TEXT,
    address TEXT NOT NULL,
    villa_or_building TEXT,
    area TEXT,
    zone TEXT DEFAULT 'Zone 19',
    notes TEXT,
    first_order_at TIMESTAMPTZ,
    last_order_at TIMESTAMPTZ,
    total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
    total_spend NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_spend >= 0),
    customer_segment customer_segment NOT NULL DEFAULT 'new',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5 SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.6 EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    attachment_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.7 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_source order_source NOT NULL DEFAULT 'website',
    status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT,
    order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.8 ORDER ITEMS (Historical cost snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    purchase_cost_at_sale NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_cost_at_sale >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.9 PURCHASES
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    supplier_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (supplier_discount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    attachment_url TEXT,
    notes TEXT,
    status purchase_status NOT NULL DEFAULT 'received',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.10 PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    final_unit_cost NUMERIC(12, 2) NOT NULL CHECK (final_unit_cost >= 0),
    total_cost NUMERIC(12, 2) NOT NULL CHECK (total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.11 INVENTORY MOVEMENTS (Strict stock audit trail)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type inventory_movement_type NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    unit_cost NUMERIC(12, 2),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.12 AUDIT LOGS (Admin & Operational mutations)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. INDEXES FOR PERFORMANCE & INTEGRITY
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(customer_segment);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON public.purchase_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trigger_set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_categories ON public.categories;
CREATE TRIGGER trigger_set_updated_at_categories
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_products ON public.products;
CREATE TRIGGER trigger_set_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_customers ON public.customers;
CREATE TRIGGER trigger_set_updated_at_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_suppliers ON public.suppliers;
CREATE TRIGGER trigger_set_updated_at_suppliers
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_expenses ON public.expenses;
CREATE TRIGGER trigger_set_updated_at_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_orders ON public.orders;
CREATE TRIGGER trigger_set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_purchases ON public.purchases;
CREATE TRIGGER trigger_set_updated_at_purchases
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. AUTH TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.user_role := 'staff';
    user_full_name TEXT;
    user_phone TEXT;
BEGIN
    -- Determine role from metadata if valid, else default to 'staff'
    IF NEW.raw_user_meta_data->>'role' IN ('owner', 'admin', 'staff') THEN
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. SECURITY DEFINER HELPER FUNCTIONS FOR RLS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active = true AND role IN ('staff', 'admin', 'owner')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active = true AND role IN ('admin', 'owner')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active = true AND role = 'owner'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 9.1 PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR public.is_staff()
    );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
        (auth.uid() = id AND public.is_staff()) OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
        public.is_admin() OR auth.uid() = id
    );

-- 9.2 CATEGORIES POLICIES
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
CREATE POLICY "categories_select_policy" ON public.categories
    FOR SELECT USING (
        is_active = true OR public.is_staff()
    );

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.3 PRODUCTS POLICIES
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products
    FOR SELECT USING (
        is_active = true OR public.is_staff()
    );

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.4 CUSTOMERS POLICIES
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "customers_staff_modify" ON public.customers;
CREATE POLICY "customers_staff_modify" ON public.customers
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 9.5 SUPPLIERS POLICIES
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;
CREATE POLICY "suppliers_select_policy" ON public.suppliers
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "suppliers_admin_modify" ON public.suppliers;
CREATE POLICY "suppliers_admin_modify" ON public.suppliers
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.6 EXPENSES POLICIES (Sensitive - restricted to Admins & Owners)
DROP POLICY IF EXISTS "expenses_admin_select" ON public.expenses;
CREATE POLICY "expenses_admin_select" ON public.expenses
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "expenses_admin_modify" ON public.expenses;
CREATE POLICY "expenses_admin_modify" ON public.expenses
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.7 ORDERS POLICIES
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders
    FOR INSERT WITH CHECK (
        -- Allow public/anonymous online orders or staff initiated orders
        true
    );

DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders
    FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 9.8 ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
CREATE POLICY "order_items_select_policy" ON public.order_items
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
CREATE POLICY "order_items_insert_policy" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_modify_policy" ON public.order_items;
CREATE POLICY "order_items_modify_policy" ON public.order_items
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.9 PURCHASES & PURCHASE ITEMS POLICIES
DROP POLICY IF EXISTS "purchases_select_policy" ON public.purchases;
CREATE POLICY "purchases_select_policy" ON public.purchases
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "purchases_admin_modify" ON public.purchases;
CREATE POLICY "purchases_admin_modify" ON public.purchases
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "purchase_items_select_policy" ON public.purchase_items;
CREATE POLICY "purchase_items_select_policy" ON public.purchase_items
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "purchase_items_admin_modify" ON public.purchase_items;
CREATE POLICY "purchase_items_admin_modify" ON public.purchase_items
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.10 INVENTORY MOVEMENTS POLICIES
DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
CREATE POLICY "inventory_movements_select" ON public.inventory_movements
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
    FOR INSERT WITH CHECK (public.is_staff());

-- 9.11 AUDIT LOGS POLICIES (Restricted to Admin & Owner, append-only)
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_staff());
-- ==============================================================================
-- BAQQALA GROCERY OPERATING SYSTEM & CUSTOMER PLATFORM
-- Phase 3 Migration: Notifications & Settings Foundation
-- ==============================================================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL indicates system-wide broadcast to all staff
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    entity_type TEXT,
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT USING (
        user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE USING (
        user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
    ) WITH CHECK (
        user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete" ON public.notifications
    FOR DELETE USING (public.is_admin());


-- 2. SETTINGS TABLE (Database-driven grocery business configuration)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Trigger for settings updated_at
DROP TRIGGER IF EXISTS trigger_set_updated_at_settings ON public.settings;
CREATE TRIGGER trigger_set_updated_at_settings
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Settings RLS Policies
DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select" ON public.settings
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "settings_admin_all" ON public.settings;
CREATE POLICY "settings_admin_all" ON public.settings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Default Settings Seed (Safe configuration defaults for Zone 19 Abu Dhabi)
INSERT INTO public.settings (key, value, category, description)
VALUES
    ('store_profile', '{"name": "Baqqala Grocery", "phone": "+971 2 000 0000", "whatsapp": "+971 50 000 0000", "address": "Zone 19, Abu Dhabi, UAE", "city": "Abu Dhabi", "zone": "Zone 19", "country": "UAE"}'::jsonb, 'general', 'Core store contact and location profile'),
    ('localization', '{"currency": "AED", "currency_symbol": "AED", "locale": "en-AE", "timezone": "Asia/Dubai", "vat_percentage": 5}'::jsonb, 'general', 'Currency and localization standards'),
    ('delivery_rules', '{"free_delivery": true, "default_zone": "Zone 19", "avg_delivery_time_mins": 30, "min_order_amount": 0}'::jsonb, 'operations', 'Delivery business model settings'),
    ('business_rules', '{"enforce_minimum_price": true, "require_discount_approval": true, "inactive_customer_days": 45, "default_reorder_level": 5}'::jsonb, 'operations', 'Operational governance and profitability guardrails')
ON CONFLICT (key) DO NOTHING;
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

-- Helper: has_permission function for SQL-level permission checks
CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role public.user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid() AND is_active = true;

    IF v_role IS NULL THEN
        RETURN false;
    END IF;

    IF v_role IN ('owner', 'admin') THEN
        RETURN true;
    END IF;

    IF v_role = 'staff' AND p_permission NOT IN (
        'expenses.view', 'expenses.create', 'expenses.edit',
        'reports.view', 'settings.edit', 'users.manage', 'audit.view'
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

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

-- ==============================================================================
-- PHASE 6: CUSTOMER STOREFRONT, CATALOG, CART, CHECKOUT & ORDERS
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
    v_tax_rate NUMERIC(5, 4) := 0.0500;
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
    IF p_customer_id IS NOT NULL THEN
        SELECT id, name, mobile, total_orders, total_spend
        INTO v_customer
        FROM public.customers
        WHERE id = p_customer_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Customer ID % not found', p_customer_id;
        END IF;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order items array cannot be empty';
    END IF;

    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) = 0 THEN
        RAISE EXCEPTION 'Delivery address is required';
    END IF;

    SELECT nextval('public.seq_order_number') INTO v_seq_val;
    v_order_number := 'ORD-' || v_year || '-' || lpad(v_seq_val::text, 5, '0');

    v_order_id := gen_random_uuid();

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

        IF v_prod.stock_quantity < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested: %, Available: %',
                v_prod.name, v_quantity, v_prod.stock_quantity;
        END IF;

        IF v_prod.promo_price IS NOT NULL AND v_prod.promo_price > 0 AND v_prod.promo_price < v_prod.selling_price THEN
            v_unit_price := v_prod.promo_price;
        ELSE
            v_unit_price := v_prod.selling_price;
        END IF;

        v_line_total := round(v_unit_price * v_quantity, 2);
        v_subtotal := v_subtotal + v_line_total;

        v_current_stock := v_prod.stock_quantity;
        v_new_stock := v_current_stock - v_quantity;

        UPDATE public.products
        SET stock_quantity = v_new_stock,
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

    v_tax_amount := round(v_subtotal * v_tax_rate, 2);

    IF v_subtotal >= 100.00 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 10.00;
    END IF;

    v_grand_total := v_subtotal + v_tax_amount + v_delivery_fee;

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

    IF NOT public.is_staff() AND v_order.status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Order is already being prepared or dispatched and cannot be cancelled online';
    END IF;

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
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (
        public.is_staff()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

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
