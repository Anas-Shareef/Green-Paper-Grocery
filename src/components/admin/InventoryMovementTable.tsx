'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { InventoryMovementWithProduct } from '@/lib/services/inventory'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InventoryMovementTableProps {
  movements: InventoryMovementWithProduct[]
  total: number
  page: number
  limit?: number
  totalPages: number
  currentType?: string
}

const MOVEMENT_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  purchase: {
    label: 'Purchase In',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  opening_stock: {
    label: 'Opening Stock',
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  customer_return: {
    label: 'Customer Return',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  sale: {
    label: 'Sale Out',
    bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
  },
  damaged: {
    label: 'Damaged Spillage',
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
  },
  expired: {
    label: 'Expired Removal',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
  },
  supplier_return: {
    label: 'Supplier Return',
    bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
  },
  adjustment: {
    label: 'Stocktake Adj',
    bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
  },
}

export function InventoryMovementTable({
  movements,
  total,
  page,
  totalPages,
  currentType = 'all',
}: InventoryMovementTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleFilterType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') {
      params.delete('movementType')
    } else {
      params.set('movementType', type)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const navigatePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-border bg-muted/20">
        <button
          type="button"
          onClick={() => handleFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentType === 'all'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Types
        </button>
        {Object.entries(MOVEMENT_LABELS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleFilterType(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentType === key
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Movements Table */}
      {movements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center space-y-2">
          <History className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">No inventory movements recorded</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Stock movements will appear here automatically when opening stock is cataloged, adjustments are applied, or orders are processed.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border font-medium">
                <tr>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">Product & SKU</th>
                  <th className="py-3 px-3.5">Movement Type</th>
                  <th className="py-3 px-3.5 text-right">Quantity Change</th>
                  <th className="py-3 px-3.5 text-right">Unit Cost</th>
                  <th className="py-3 px-3.5">Reference</th>
                  <th className="py-3 px-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => {
                  const qty = Number(m.quantity || 0)
                  const isPositive = qty > 0
                  const cfg = MOVEMENT_LABELS[m.movement_type] || {
                    label: m.movement_type,
                    bg: 'bg-zinc-100 dark:bg-zinc-800',
                    text: 'text-zinc-700 dark:text-zinc-300',
                  }

                  return (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      {/* Timestamp */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Product */}
                      <td className="py-2.5 px-3.5">
                        <p className="font-semibold text-foreground line-clamp-1">
                          {m.product?.name || 'Deleted/Unknown Product'}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          SKU: {m.product?.sku || '—'}
                        </p>
                      </td>

                      {/* Movement Type Badge */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.text}`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {cfg.label}
                        </span>
                      </td>

                      {/* Quantity Change */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {isPositive ? `+${qty}` : qty}{' '}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {m.product?.unit || 'pcs'}
                          </span>
                        </span>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-2.5 px-3.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {m.unit_cost !== null && m.unit_cost !== undefined ? (
                          <CurrencyDisplay amount={m.unit_cost} />
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Reference */}
                      <td className="py-2.5 px-3.5 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {m.reference_type ? (
                          <span className="bg-muted px-2 py-0.5 rounded">
                            {m.reference_type}
                          </span>
                        ) : (
                          'Manual'
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-3.5 text-foreground max-w-xs truncate text-[11px]">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card text-xs text-muted-foreground">
          <div>
            Page <span className="font-semibold text-foreground">{page}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span> ({total} movements)
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigatePage(page - 1)}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigatePage(page + 1)}
              className="h-8 text-xs gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
