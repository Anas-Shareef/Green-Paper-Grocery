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
