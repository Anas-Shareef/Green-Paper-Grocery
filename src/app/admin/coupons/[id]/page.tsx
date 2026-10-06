import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCouponById } from '@/lib/services/coupons'
import { handleToggleCouponStatus } from '@/app/admin/coupons/actions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import {
  Ticket,
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Package,
} from 'lucide-react'

export const metadata = {
  title: 'Coupon Details | Baqqala Admin',
}

export default async function CouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const coupon = await getCouponById(id)

  if (!coupon) {
    notFound()
  }

  const supabase = await createClient()

  // Fetch redemptions history for this coupon
  const { data: redemptions } = await supabase
    .from('coupon_redemptions')
    .select(`
      id,
      discount_amount,
      redeemed_at,
      order:orders(id, order_number, total_amount),
      customer:customers(id, name, mobile)
    `)
    .eq('coupon_id', id)
    .order('redeemed_at', { ascending: false })
    .limit(50)

  const totalDiscountGranted = (redemptions || []).reduce(
    (acc, r) => acc + Number(r.discount_amount || 0),
    0
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Coupon: ${coupon.code}`}
        description={`Linked Promotion: ${coupon.promotion?.name || 'Campaign'}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Coupons', href: '/admin/coupons' },
          { label: coupon.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/coupons">
              <Button variant="outline" size="sm" className="text-xs">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> All Coupons
              </Button>
            </Link>

            <form
              action={handleToggleCouponStatus.bind(
                null,
                coupon.id,
                !coupon.is_active
              )}
            >
              <Button
                type="submit"
                variant={coupon.is_active ? 'secondary' : 'default'}
                size="sm"
                className={`text-xs font-semibold ${
                  coupon.is_active
                    ? 'text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {coupon.is_active ? (
                  <>
                    <XCircle className="h-4 w-4 mr-1.5" /> Disable Coupon
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Activate Coupon
                  </>
                )}
              </Button>
            </form>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Total Redemptions
          </span>
          <p className="text-2xl font-black text-foreground">
            {coupon.usage_count}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              {coupon.usage_limit ? `/ ${coupon.usage_limit}` : '(unlimited)'}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-emerald-600" />
            Total Discount Granted
          </span>
          <p className="text-2xl font-black text-emerald-600">
            AED {totalDiscountGranted.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            Per-Customer Limit
          </span>
          <p className="text-2xl font-black text-foreground">
            {coupon.per_customer_limit} use{coupon.per_customer_limit > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
            Status
          </span>
          <p
            className={`text-2xl font-black ${
              coupon.is_active ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            {coupon.is_active ? 'Active' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* Redemptions Ledger Table */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Package className="h-4 w-4 text-emerald-600" />
          Redemption History ({redemptions?.length || 0})
        </h3>

        {!redemptions || redemptions.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No customers have redeemed this coupon yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Discount Granted</th>
                  <th className="py-2.5 px-3">Redeemed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {redemptions.map((r) => {
                  const ord = r.order as unknown as { id: string; order_number: string } | null
                  const cust = r.customer as unknown as { id: string; name: string; mobile: string } | null
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        {ord ? (
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="text-emerald-700 hover:underline"
                          >
                            {ord.order_number}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground block">
                          {cust?.name || 'Guest'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {cust?.mobile || ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        AED {Number(r.discount_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {new Date(r.redeemed_at).toLocaleString('en-AE')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
