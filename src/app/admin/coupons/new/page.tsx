import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { handleCreateCoupon } from '@/app/admin/coupons/actions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Ticket, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Create Coupon | Baqqala Admin',
}

export default async function NewCouponPage() {
  const supabase = await createClient()

  // Fetch active promotions to link
  const { data: promotions } = await supabase
    .from('promotions')
    .select('id, name, discount_type, discount_value, status')
    .in('status', ['active', 'scheduled'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader
        title="Create Coupon Code"
        description="Generate a unique code that customers can enter at storefront checkout."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Coupons', href: '/admin/coupons' },
          { label: 'New Coupon' },
        ]}
      />

      <form action={handleCreateCoupon} className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Ticket className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-base text-foreground">Coupon Setup</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-foreground">Coupon Code *</label>
              <Input
                required
                name="code"
                placeholder="e.g. WELCOME10, FRUIT25, SAVE50"
                className="h-10 text-xs font-mono uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                Codes are automatically converted to uppercase and checked for uniqueness.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-foreground">Linked Promotion Rule *</label>
              <select
                required
                name="promotion_id"
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {promotions && promotions.length > 0 ? (
                  promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.discount_type === 'percentage' ? `${p.discount_value}%` : `AED ${p.discount_value}`} OFF)
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No active promotions available — please create a promotion first
                  </option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Total Usage Limit (Overall)</label>
              <Input
                type="number"
                min="1"
                name="usage_limit"
                placeholder="e.g. 100 (leave empty for unlimited)"
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Per-Customer Usage Limit *</label>
              <Input
                required
                type="number"
                min="1"
                defaultValue="1"
                name="per_customer_limit"
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Min. Order Threshold (AED)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="minimum_order_amount"
                placeholder="Optional override"
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Max. Discount Cap (AED)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="maximum_discount_amount"
                placeholder="Optional override"
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Start Date & Time (UTC) *</label>
              <Input
                required
                type="datetime-local"
                name="start_at"
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Expiry Date & Time (Optional)</label>
              <Input
                type="datetime-local"
                name="end_at"
                className="h-10 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/admin/coupons">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Coupons
            </Button>
          </Link>

          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-xs"
          >
            Create Coupon Code
          </Button>
        </div>
      </form>
    </div>
  )
}
