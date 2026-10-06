import { getDashboardSummary, type DashboardDateRange } from '@/lib/services/dashboard'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { DateRangePicker } from '@/components/admin/DateRangePicker'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Boxes,
  Users,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Tag,
  Ticket,
  Gift,
  Coins,
} from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const validRanges: DashboardDateRange[] = ['today', 'yesterday', '7d', '30d', 'this_month']
  const range: DashboardDateRange = validRanges.includes(resolvedParams.range as DashboardDateRange)
    ? (resolvedParams.range as DashboardDateRange)
    : 'today'

  const [data, supabase] = await Promise.all([
    getDashboardSummary(range),
    createClient(),
  ])

  // Phase 8 Commercial KPIs
  const [promosRes, couponsRes, loyaltyRes] = await Promise.all([
    supabase
      .from('promotions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('customer_loyalty_accounts')
      .select('points_balance'),
  ])

  const activePromotionsCount = promosRes.count || 0
  const couponRedemptionsCount = couponsRes.count || 0
  const totalOutstandingPoints = (loyaltyRes.data || []).reduce(
    (acc, row) => acc + (row.points_balance || 0),
    0
  )
  const totalLoyaltyMembers = loyaltyRes.data?.length || 0

  return (
    <div className="space-y-8">
      {/* Page Header with Synchronized Date Range Switcher */}
      <AdminPageHeader
        title="Operations Dashboard"
        description={`Real-time business performance for Zone 19 physical grocery operations (${data.rangeLabel}).`}
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Dashboard' }]}
        actions={<DateRangePicker currentRange={range} />}
      />

      {/* 1. Core Financial & Performance Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Financial & Sales Performance
          </h2>
          <span className="text-[11px] font-mono text-muted-foreground">
            Database Snapshot • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sales */}
          <StatCard
            title="Total Revenue"
            value={<CurrencyDisplay amount={data.overview.totalSales} />}
            subtitle={`${data.overview.orderCount} total orders in ${data.rangeLabel.toLowerCase()}`}
            icon={DollarSign}
            iconColor="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
          />

          {/* Average Order Value */}
          <StatCard
            title="Avg Order Value"
            value={<CurrencyDisplay amount={data.overview.averageOrderValue} />}
            subtitle="Benchmark: Free delivery offset target"
            icon={TrendingUp}
            iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
          />

          {/* Gross Profit */}
          <StatCard
            title="Gross Profit"
            value={<CurrencyDisplay amount={data.overview.grossProfit} />}
            subtitle="Formula: Revenue minus snapshotted COGS"
            icon={ShoppingCart}
            iconColor="text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
          />

          {/* Operating Expenses */}
          <StatCard
            title="Operating Expenses"
            value={<CurrencyDisplay amount={data.overview.operatingExpenses} />}
            subtitle="Recorded delivery, fuel, packaging & overhead"
            icon={Receipt}
            iconColor="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
          />

          {/* Estimated Operating Profit */}
          <StatCard
            title="Est. Operating Profit"
            value={
              <CurrencyDisplay
                amount={data.overview.estimatedOperatingProfit}
                className={
                  data.overview.estimatedOperatingProfit >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }
              />
            }
            subtitle="Gross profit minus operating expenses"
            icon={TrendingUp}
            iconColor={
              data.overview.estimatedOperatingProfit >= 0
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
            }
          />

          {/* Total Active Customers */}
          <StatCard
            title="Customer Base"
            value={data.customers.totalCustomers.toString()}
            subtitle={`${data.customers.returningCustomersCount} returning (>=2 orders) • ${data.customers.inactiveCustomersCount} inactive`}
            icon={Users}
            iconColor="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40"
          />
        </div>
      </div>

      {/* 2. Purchasing & Supplier Operations (Phase 5) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Purchasing & Supplier Operations
          </h2>
          <Link
            href="/admin/purchases"
            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            Manage Purchases <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/purchases?status=ordered" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Pending Receivings / GRN"
              value={data.purchasingSummary.pendingReceivingsCount.toString()}
              subtitle="PO shipments awaiting receiving & stock-in"
              icon={Truck}
              iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
            />
          </Link>

          <Link href="/admin/suppliers" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Outstanding Supplier Payables"
              value={<CurrencyDisplay amount={data.purchasingSummary.outstandingPayables} />}
              subtitle="Unpaid & partially paid supplier invoices"
              icon={Building2}
              iconColor="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
            />
          </Link>

          <Link href="/admin/purchases" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Overdue Supplier Invoices"
              value={data.purchasingSummary.overdueInvoicesCount.toString()}
              subtitle={
                data.purchasingSummary.overdueInvoicesCount > 0
                  ? 'Invoices past due date requiring settlement'
                  : 'All supplier invoices current'
              }
              icon={AlertTriangle}
              iconColor={
                data.purchasingSummary.overdueInvoicesCount > 0
                  ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              }
            />
          </Link>
        </div>
      </div>

      {/* 3. Commercial Promotions, Coupons & Loyalty (Phase 8) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Promotions & Customer Loyalty (Phase 8)
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/admin/promotions"
              className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Promotions <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/coupons"
              className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Coupons <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/loyalty"
              className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Loyalty <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/promotions" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Active Promotions"
              value={activePromotionsCount.toString()}
              subtitle="Live product, category & cart discounts"
              icon={Tag}
              iconColor="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
            />
          </Link>

          <Link href="/admin/coupons" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Coupon Redemptions"
              value={couponRedemptionsCount.toString()}
              subtitle="Total checkout coupons redeemed"
              icon={Ticket}
              iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
            />
          </Link>

          <Link href="/admin/loyalty" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Points Outstanding"
              value={`${totalOutstandingPoints.toLocaleString()} pts`}
              subtitle={`≈ AED ${(totalOutstandingPoints * 0.05).toFixed(2)} available redemption value`}
              icon={Coins}
              iconColor="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
            />
          </Link>

          <Link href="/admin/loyalty" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Loyalty Members"
              value={totalLoyaltyMembers.toString()}
              subtitle="Enrolled customer accounts earning points"
              icon={Gift}
              iconColor="text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40"
            />
          </Link>
        </div>
      </div>

      {/* 4. Operational Breakdown & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment Status Board */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-semibold text-foreground">
                  Order Status Pipeline
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {data.overview.orderCount} active
              </span>
            </div>

            {data.overview.orderCount === 0 ? (
              <EmptyState
                title="No orders found for this period"
                description={`There are currently no orders recorded for ${data.rangeLabel.toLowerCase()}. New orders from web, WhatsApp, or walk-ins will appear here.`}
                icon={ShoppingCart}
                action={
                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    View Order Processing Queue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="pending" />
                    <span className="font-bold text-base">{data.orderStatuses.pending}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="confirmed" />
                    <span className="font-bold text-base">{data.orderStatuses.confirmed}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="preparing" />
                    <span className="font-bold text-base">{data.orderStatuses.preparing}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="ready" />
                    <span className="font-bold text-base">{data.orderStatuses.ready}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="out_for_delivery" />
                    <span className="font-bold text-base">{data.orderStatuses.out_for_delivery}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <StatusBadge status="delivered" />
                    <span className="font-bold text-base">{data.orderStatuses.delivered}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Zone 19 Delivery Route
            </span>
            <span>Free Delivery Active</span>
          </div>
        </div>

        {/* Inventory Guardrails & Stock Alerts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-semibold text-foreground">
                  Stock Health & Inventory Alerts
                </h3>
              </div>
              {data.inventoryAlerts.lowStockCount + data.inventoryAlerts.outOfStockCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {data.inventoryAlerts.lowStockCount + data.inventoryAlerts.outOfStockCount} Alerts
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> Healthy
                </span>
              )}
            </div>

            {data.inventoryAlerts.items.length === 0 ? (
              <EmptyState
                title="All inventory healthy"
                description="There are currently no items below their reorder threshold or out of stock. Stock replenishment signals are active."
                icon={ShieldCheck}
                action={
                  <Link
                    href="/admin/inventory"
                    className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    View Inventory Logs <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {data.inventoryAlerts.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        SKU: {item.sku || 'N/A'} • Reorder Level: {item.reorderLevel} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.stockQuantity <= 0 ? (
                        <StatusBadge status="out_of_stock" />
                      ) : (
                        <StatusBadge status="low_stock" />
                      )}
                      <p className="text-xs font-semibold text-foreground mt-1">
                        {item.stockQuantity} {item.unit} left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Automated reorder triggers enabled</span>
            <Link href="/admin/inventory" className="text-emerald-700 hover:underline font-medium">
              Manage stock →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
