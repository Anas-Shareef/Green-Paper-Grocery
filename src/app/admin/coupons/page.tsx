import React from 'react'
import Link from 'next/link'
import { getCoupons } from '@/lib/services/coupons'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'Coupons Management | Baqqala Admin',
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string
    status?: string
    page?: string
  }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.query || ''
  const statusParam = resolvedParams.status
  const isActive = statusParam === 'active' ? true : statusParam === 'disabled' ? false : 'all'
  const page = Number(resolvedParams.page) || 1

  const { coupons, total } = await getCoupons({
    query,
    isActive,
    page,
    limit: 20,
  })

  const activeCount = coupons.filter((c) => c.is_active).length
  const totalUses = coupons.reduce((acc, c) => acc + (c.usage_count || 0), 0)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coupon Codes"
        description="Create and manage unique promotional coupon codes with atomic redemption protection."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Coupons' }]}
        actions={
          <Link href="/admin/coupons/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
          </Link>
        }
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Active Codes
          </span>
          <p className="text-2xl font-black text-foreground">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-blue-600" />
            Total Configured
          </span>
          <p className="text-2xl font-black text-foreground">{total}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            Total Redemptions
          </span>
          <p className="text-2xl font-black text-foreground">{totalUses}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form method="get" className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              name="query"
              defaultValue={query}
              placeholder="Search coupon code (e.g. WELCOME10)..."
              className="pl-9 h-9 text-xs uppercase"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/coupons"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isActive === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/coupons?status=active"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isActive === true
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Active
          </Link>
          <Link
            href="/admin/coupons?status=disabled"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isActive === false
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Disabled
          </Link>
        </div>
      </div>

      {/* Coupon List Table / Mobile Cards */}
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm text-foreground">No Coupon Codes Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create promotional coupon codes that customers can enter at checkout for instant discounts.
          </p>
          <Link href="/admin/coupons/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Coupon
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
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Linked Promotion</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Per Customer</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {c.code}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {c.promotion?.name || 'Campaign'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {c.promotion?.discount_type === 'percentage'
                        ? `${c.promotion.discount_value}% OFF`
                        : `AED ${c.promotion?.discount_value} OFF`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      <span className="font-bold text-foreground">{c.usage_count}</span>
                      {c.usage_limit ? ` / ${c.usage_limit}` : ' / ∞'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {c.per_customer_limit} use{c.per_customer_limit > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {c.end_at ? (
                        <span>Until {new Date(c.end_at).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">No expiry</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/coupons/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {coupons.map((c) => (
              <Link
                key={c.id}
                href={`/admin/coupons/${c.id}`}
                className="block p-4 hover:bg-muted/30 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-emerald-600 block">
                      {c.code}
                    </span>
                    <span className="text-xs text-foreground font-semibold">
                      {c.promotion?.name}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-emerald-600">
                    {c.promotion?.discount_type === 'percentage'
                      ? `${c.promotion.discount_value}% OFF`
                      : `AED ${c.promotion?.discount_value} OFF`}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Uses: {c.usage_count}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
