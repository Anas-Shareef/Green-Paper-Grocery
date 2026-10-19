'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { ReportsData } from '@/lib/services/reports'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Receipt,
  Download,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  Archive,
} from 'lucide-react'

interface ReportsClientProps {
  data: ReportsData
  currentRange: string
}

export function ReportsClient({ data, currentRange }: ReportsClientProps) {
  const router = useRouter()

  const handleRangeChange = (rangeKey: string) => {
    router.push(`/admin/reports?range=${rangeKey}`)
  }

  const exportSalesCsv = () => {
    const headers = ['Metric', 'Value (AED / Count)']
    const rows = [
      ['Gross Delivered Sales', data.salesSummary.grossSales],
      ['Discounts Given', data.salesSummary.discountsGiven],
      ['Net Sales', data.salesSummary.netSales],
      ['Delivered Orders Count', data.salesSummary.deliveredOrders],
      ['Average Order Value', data.salesSummary.averageOrderValue],
      ['Total Operating Expenses', data.totalExpenses],
      ['Inventory Asset Valuation', data.inventorySummary.valuation],
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `baqqala_report_${currentRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector & Export Controls */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'today', label: 'Today' },
            { key: 'last_7_days', label: 'Last 7 Days' },
            { key: 'this_month', label: 'This Month' },
            { key: 'last_30_days', label: 'Last 30 Days' },
            { key: 'all', label: 'All Time' },
          ].map((r) => {
            const isActive = currentRange === r.key
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRangeChange(r.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        <Button
          onClick={exportSalesCsv}
          variant="secondary"
          size="sm"
          className="text-xs font-semibold gap-1.5 shrink-0"
        >
          <Download className="h-4 w-4 text-emerald-600" /> Export Summary CSV
        </Button>
      </div>

      {/* Primary Financial Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            Gross Sales (Delivered)
          </span>
          <p className="text-2xl font-black text-foreground">
            <CurrencyDisplay amount={data.salesSummary.grossSales} />
          </p>
          <span className="text-[10px] text-muted-foreground">
            Net: AED {data.salesSummary.netSales}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
            Average Order Value
          </span>
          <p className="text-2xl font-black text-foreground">
            <CurrencyDisplay amount={data.salesSummary.averageOrderValue} />
          </p>
          <span className="text-[10px] text-muted-foreground">
            {data.salesSummary.deliveredOrders} delivered orders
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-rose-600" />
            Operating Expenses
          </span>
          <p className="text-2xl font-black text-foreground">
            <CurrencyDisplay amount={data.totalExpenses} />
          </p>
          <span className="text-[10px] text-muted-foreground">Fuel, packaging, rent</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Archive className="h-3.5 w-3.5 text-purple-600" />
            Inventory Asset Value
          </span>
          <p className="text-2xl font-black text-foreground">
            <CurrencyDisplay amount={data.inventorySummary.valuation} />
          </p>
          <span className="text-[10px] text-muted-foreground">
            {data.inventorySummary.totalUnits} items in store
          </span>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" /> Order Fulfillment Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'pending', label: 'Pending', count: data.statusBreakdown.pending || 0, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
            { key: 'confirmed', label: 'Confirmed', count: data.statusBreakdown.confirmed || 0, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
            { key: 'preparing', label: 'Preparing', count: data.statusBreakdown.preparing || 0, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
            { key: 'ready', label: 'Ready', count: data.statusBreakdown.ready || 0, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60' },
            { key: 'out_for_delivery', label: 'On Route', count: data.statusBreakdown.out_for_delivery || 0, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
            { key: 'delivered', label: 'Delivered', count: data.statusBreakdown.delivered || 0, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
            { key: 'cancelled', label: 'Cancelled', count: data.statusBreakdown.cancelled || 0, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
          ].map((s) => (
            <div key={s.key} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${s.color}`}>
                {s.label}
              </span>
              <p className="text-xl font-mono font-bold text-foreground">{s.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Top Products & Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" /> Top Selling Catalogue Items
          </h3>

          {data.topProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No product sales recorded in this date range.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs">
              {data.topProducts.map((p, idx) => (
                <div key={p.productId} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-muted-foreground text-[11px] w-4">{idx + 1}.</span>
                    <div>
                      <span className="font-bold text-foreground block">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.unitsSold} units sold</span>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-foreground">
                    <CurrencyDisplay amount={p.totalRevenue} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" /> Operating Expenses by Category
          </h3>

          {data.expensesByCategory.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No operating expenses logged in this date range.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs">
              {data.expensesByCategory.map((c) => {
                const pct = data.totalExpenses > 0 ? Math.round((c.amount / data.totalExpenses) * 100) : 0
                return (
                  <div key={c.category} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold capitalize text-foreground">{c.category.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">{pct}%</span>
                        <span className="font-bold font-mono text-foreground">
                          <CurrencyDisplay amount={c.amount} />
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
