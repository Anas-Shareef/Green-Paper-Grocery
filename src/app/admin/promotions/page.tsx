import React from 'react'
import Link from 'next/link'
import { getPromotions } from '@/lib/services/promotions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tag,
  Plus,
  Search,
  Percent,
  CheckCircle2,
} from 'lucide-react'
import type { PromotionStatus, PromotionType } from '@/types/database.types'

export const metadata = {
  title: 'Promotions Management | Baqqala Admin',
}

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string
    status?: string
    type?: string
    page?: string
  }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.query || ''
  const status = (resolvedParams.status as PromotionStatus | 'all') || 'all'
  const promotionType = (resolvedParams.type as PromotionType | 'all') || 'all'
  const page = Number(resolvedParams.page) || 1

  const { promotions, total } = await getPromotions({
    query,
    status,
    promotion_type: promotionType,
    page,
    limit: 20,
  })

  // Basic counters
  const activeCount = promotions.filter((p) => p.status === 'active').length
  const totalRedemptions = promotions.reduce((acc, p) => acc + (p.usage_count || 0), 0)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions & Discounts"
        description="Configure controlled discounts, category campaigns, and cart promotions."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Promotions' }]}
        actions={
          <Link href="/admin/promotions/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" /> Create Promotion
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Active Campaigns
          </span>
          <p className="text-2xl font-black text-foreground">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-blue-600" />
            Total Configured
          </span>
          <p className="text-2xl font-black text-foreground">{total}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-amber-600" />
            Recorded Redemptions
          </span>
          <p className="text-2xl font-black text-foreground">{totalRedemptions}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form method="get" className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              name="query"
              defaultValue={query}
              placeholder="Search promotion name..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/promotions"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              status === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/promotions?status=active"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              status === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Active
          </Link>
          <Link
            href="/admin/promotions?status=paused"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              status === 'paused'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Paused
          </Link>
          <Link
            href="/admin/promotions?status=scheduled"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              status === 'scheduled'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Scheduled
          </Link>
        </div>
      </div>

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm text-foreground">No Promotions Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {query || status !== 'all'
              ? 'No promotional campaigns match your current filters.'
              : 'Create your first promotional campaign to offer discounts to customers.'}
          </p>
          <Link href="/admin/promotions/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Promotion
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Promotion Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promotions.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <Link
                          href={`/admin/promotions/${p.id}`}
                          className="hover:text-emerald-600 transition-colors"
                        >
                          {p.name}
                        </Link>
                        {p.description && (
                          <p className="text-[11px] text-muted-foreground font-normal truncate max-w-xs">
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono uppercase text-[10px] bg-muted px-2 py-0.5 rounded-md font-semibold text-foreground">
                          {p.promotion_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {p.discount_type === 'percentage' ? (
                          <span className="text-emerald-600 font-bold">{p.discount_value}% OFF</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">
                            <CurrencyDisplay amount={p.discount_value} /> OFF
                          </span>
                        )}
                        {p.minimum_order_amount > 0 && (
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            Min: AED {p.minimum_order_amount}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        <div>{new Date(p.start_at).toLocaleDateString()}</div>
                        {p.end_at ? (
                          <div className="text-[10px]">to {new Date(p.end_at).toLocaleDateString()}</div>
                        ) : (
                          <div className="text-[10px] text-emerald-600">Ongoing</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        <span className="font-bold text-foreground">{p.usage_count}</span>
                        {p.usage_limit ? ` / ${p.usage_limit}` : ' / ∞'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : p.status === 'paused'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : p.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/promotions/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Requirement 109) */}
          <div className="md:hidden divide-y divide-border">
            {promotions.map((p) => (
              <Link
                key={p.id}
                href={`/admin/promotions/${p.id}`}
                className="block p-4 hover:bg-muted/30 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-foreground block">{p.name}</span>
                    <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded font-semibold text-foreground">
                      {p.promotion_type}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="font-bold text-emerald-600">
                    {p.discount_type === 'percentage'
                      ? `${p.discount_value}% OFF`
                      : `AED ${p.discount_value} OFF`}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Uses: {p.usage_count}
                    {p.usage_limit ? ` / ${p.usage_limit}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
