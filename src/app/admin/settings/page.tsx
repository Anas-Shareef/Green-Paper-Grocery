import { getAllSettings, updateSetting, type BusinessRulesSettings, type DeliveryRulesSettings, type StoreProfileSettings } from '@/lib/services/settings'
import { logAuditEvent } from '@/lib/services/audit'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Store, Shield, Truck, Save } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function SettingsPage() {
  const settings = await getAllSettings()

  const storeProfile = (settings['store_profile'] as unknown as StoreProfileSettings) || {
    name: 'Baqqala Grocery',
    phone: '+971 2 000 0000',
    whatsapp: '+971 50 000 0000',
    address: 'Zone 19, Abu Dhabi, UAE',
    city: 'Abu Dhabi',
    zone: 'Zone 19',
    country: 'UAE',
  }

  const businessRules = (settings['business_rules'] as unknown as BusinessRulesSettings) || {
    enforce_minimum_price: true,
    require_discount_approval: true,
    inactive_customer_days: 45,
    default_reorder_level: 5,
  }

  const deliveryRules = (settings['delivery_rules'] as unknown as DeliveryRulesSettings) || {
    free_delivery: true,
    default_zone: 'Zone 19',
    avg_delivery_time_mins: 30,
    min_order_amount: 0,
  }

  async function handleSaveSettings(formData: FormData) {
    'use server'

    const updatedProfile = {
      name: formData.get('storeName') as string,
      phone: formData.get('storePhone') as string,
      whatsapp: formData.get('storeWhatsapp') as string,
      address: formData.get('storeAddress') as string,
      city: 'Abu Dhabi',
      zone: formData.get('storeZone') as string,
      country: 'UAE',
    }

    const updatedBusiness = {
      enforce_minimum_price: formData.get('enforceMinPrice') === 'on',
      require_discount_approval: formData.get('requireDiscountApproval') === 'on',
      inactive_customer_days: Number(formData.get('inactiveDays') || 45),
      default_reorder_level: Number(formData.get('defaultReorder') || 5),
    }

    const updatedDelivery = {
      free_delivery: true, // Market standard in Abu Dhabi
      default_zone: formData.get('storeZone') as string,
      avg_delivery_time_mins: Number(formData.get('deliveryTime') || 30),
      min_order_amount: 0,
    }

    await updateSetting('store_profile', updatedProfile, 'Store identity and contact profile')
    await updateSetting('business_rules', updatedBusiness, 'Operational guardrails and pricing rules')
    await updateSetting('delivery_rules', updatedDelivery, 'Delivery route configuration')

    await logAuditEvent({
      action: 'settings.update',
      entityType: 'settings',
      newValues: { updatedProfile, updatedBusiness, updatedDelivery },
    })

    revalidatePath('/admin/settings')
    revalidatePath('/admin/dashboard')
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Store Settings & Configuration"
        description="Database-driven business rules, delivery parameters, and contact coordinates for Zone 19."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Settings' }]}
      />

      <form action={handleSaveSettings} className="space-y-6 max-w-4xl">
        {/* Store Profile Section */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Store className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-foreground">
              Store Profile & Contact
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Store Name
              </label>
              <Input
                name="storeName"
                defaultValue={storeProfile.name}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operating Zone
              </label>
              <Input
                name="storeZone"
                defaultValue={storeProfile.zone}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Store Phone
              </label>
              <Input
                name="storePhone"
                defaultValue={storeProfile.phone}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                WhatsApp Order Line
              </label>
              <Input
                name="storeWhatsapp"
                defaultValue={storeProfile.whatsapp}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Physical Address
              </label>
              <Input
                name="storeAddress"
                defaultValue={storeProfile.address}
                required
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Business Rules & Profitability Guardrails */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-foreground">
              Profitability & Operational Guardrails
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
              <input
                type="checkbox"
                id="enforceMinPrice"
                name="enforceMinPrice"
                defaultChecked={businessRules.enforce_minimum_price}
                className="h-4 w-4 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <label htmlFor="enforceMinPrice" className="text-sm font-semibold text-foreground block">
                  Enforce Minimum Selling Price
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Blocks unauthorized sales below minimum cost threshold to prevent negative margin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
              <input
                type="checkbox"
                id="requireDiscountApproval"
                name="requireDiscountApproval"
                defaultChecked={businessRules.require_discount_approval}
                className="h-4 w-4 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <label htmlFor="requireDiscountApproval" className="text-sm font-semibold text-foreground block">
                  Require Discount Approval
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Discounts exceeding authorized limit require admin PIN or approval.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer Inactivity Days Threshold
              </label>
              <Input
                type="number"
                name="inactiveDays"
                defaultValue={businessRules.inactive_customer_days}
                min={7}
                max={365}
                required
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                Days without an order before customer is categorized as inactive.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Reorder Stock Threshold
              </label>
              <Input
                type="number"
                name="defaultReorder"
                defaultValue={businessRules.default_reorder_level}
                min={1}
                required
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                Default units remaining to trigger low-stock replenishment alert.
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Rules */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Truck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-foreground">
              Delivery Logistics (Zone 19)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Delivery Window (Minutes)
              </label>
              <Input
                type="number"
                name="deliveryTime"
                defaultValue={deliveryRules.avg_delivery_time_mins}
                min={10}
                max={120}
                required
                className="h-10"
              />
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-muted-foreground space-y-1 flex flex-col justify-center">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Free Delivery Policy Enforced
              </span>
              <span>
                Standard physical grocery model in Zone 19 provides free delivery. Revenue protection is managed via Average Order Value and profitability guardrails.
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium inline-flex items-center gap-2 px-6 h-10 shadow-sm"
          >
            <Save className="h-4 w-4" />
            Save Store Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}
