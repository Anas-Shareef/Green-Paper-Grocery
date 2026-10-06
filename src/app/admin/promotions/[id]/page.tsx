import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPromotionById } from '@/lib/services/promotions'
import { handleUpdatePromotionStatus } from '@/app/admin/promotions/actions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import {
  Tag,
  Percent,
  Layers,
  ArrowLeft,
  PauseCircle,
  PlayCircle,
  Archive,
  CheckCircle2,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'Promotion Details | Baqqala Admin',
}

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const promo = await getPromotionById(id)

  if (!promo) {
    notFound()
  }

  const isPercentage = promo.discount_type === 'percentage'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={promo.name}
        description={`Status: ${promo.status.toUpperCase()} • Type: ${promo.promotion_type.toUpperCase()}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Promotions', href: '/admin/promotions' },
          { label: promo.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/promotions">
              <Button variant="outline" size="sm" className="text-xs">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> All Promotions
              </Button>
            </Link>

            {promo.status === 'active' && (
              <form action={handleUpdatePromotionStatus.bind(null, promo.id, 'paused')}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                >
                  <PauseCircle className="h-4 w-4 mr-1.5" /> Pause Campaign
                </Button>
              </form>
            )}

            {promo.status === 'paused' && (
              <form action={handleUpdatePromotionStatus.bind(null, promo.id, 'active')}>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PlayCircle className="h-4 w-4 mr-1.5" /> Resume Campaign
                </Button>
              </form>
            )}

            {promo.status !== 'archived' && (
              <form action={handleUpdatePromotionStatus.bind(null, promo.id, 'archived')}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Archive className="h-4 w-4 mr-1.5" /> Archive
                </Button>
              </form>
            )}
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-emerald-600" />
            Discount Value
          </span>
          <p className="text-2xl font-black text-emerald-600">
            {isPercentage ? `${promo.discount_value}% OFF` : `AED ${promo.discount_value} OFF`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Total Redemptions
          </span>
          <p className="text-2xl font-black text-foreground">
            {promo.usage_count}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              {promo.usage_limit ? `/ ${promo.usage_limit}` : '(unlimited)'}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-amber-600" />
            Min. Order Threshold
          </span>
          <p className="text-2xl font-black text-foreground">
            AED {promo.minimum_order_amount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
            Max. Cap
          </span>
          <p className="text-2xl font-black text-foreground">
            {promo.maximum_discount_amount ? `AED ${promo.maximum_discount_amount}` : 'None'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Tag className="h-4 w-4 text-emerald-600" />
              Promotion Rules & Schedule
            </h3>

            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-muted-foreground font-semibold">Promotion Type</dt>
                <dd className="font-bold font-mono uppercase text-foreground mt-0.5">
                  {promo.promotion_type}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">Current Status</dt>
                <dd className="font-bold text-foreground mt-0.5 capitalize">
                  {promo.status}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">Start Schedule</dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {new Date(promo.start_at).toLocaleString('en-AE')}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">End Schedule</dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {promo.end_at ? new Date(promo.end_at).toLocaleString('en-AE') : 'Ongoing (No expiry)'}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">Per-Customer Limit</dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {promo.per_customer_limit ? `${promo.per_customer_limit} orders` : 'Unlimited'}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground font-semibold">Stacking Exclusivity</dt>
                <dd className="text-foreground mt-0.5">
                  {promo.is_exclusive ? 'Exclusive (No coupons allowed)' : 'Standard stacking'}
                </dd>
              </div>

              {promo.banner_text && (
                <div className="col-span-2 pt-2 border-t border-border">
                  <dt className="text-muted-foreground font-semibold">Customer Badge / Headline</dt>
                  <dd className="font-semibold text-emerald-600 mt-0.5">
                    {promo.banner_text}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right Column: Linked Products or Categories */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Layers className="h-4 w-4 text-emerald-600" />
              Target Scope
            </h3>

            {promo.promotion_type === 'product' && (
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground">
                  Eligible Products ({promo.products?.length || 0}):
                </span>
                <div className="max-h-64 overflow-y-auto divide-y divide-border border rounded-2xl p-2">
                  {promo.products && promo.products.length > 0 ? (
                    promo.products.map((p) => (
                      <div key={p.id} className="py-2 px-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate pr-2">{p.name}</span>
                        <span className="font-mono text-muted-foreground shrink-0">
                          AED {p.selling_price}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground p-3 text-center">
                      No specific products linked.
                    </p>
                  )}
                </div>
              </div>
            )}

            {promo.promotion_type === 'category' && (
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground">
                  Eligible Categories ({promo.categories?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {promo.categories && promo.categories.length > 0 ? (
                    promo.categories.map((c) => (
                      <span
                        key={c.id}
                        className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-xs font-bold text-emerald-800 dark:text-emerald-300"
                      >
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No categories linked.</p>
                  )}
                </div>
              </div>
            )}

            {['cart', 'minimum_spend', 'first_order'].includes(promo.promotion_type) && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                This campaign applies store-wide to any qualifying customer checkout satisfying the spend conditions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
