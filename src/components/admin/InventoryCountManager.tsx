'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InventoryCount, Product } from '@/types/database.types'
import {
  createInventoryCountAction,
  completeInventoryCountAction,
  cancelInventoryCountAction,
} from '@/app/admin/inventory/actions'
import {
  ClipboardCheck,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Check,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InventoryCountManagerProps {
  counts: InventoryCount[]
  activeProducts: Product[]
}

interface CountItemRow {
  productId: string
  name: string
  sku: string | null
  unit: string
  systemQuantity: number
  countedQuantity: string
  reason: string
}

export function InventoryCountManager({
  counts,
  activeProducts,
}: InventoryCountManagerProps) {
  const router = useRouter()

  // Modal / Session State
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  // Active Counting Workspace State
  const [activeCount, setActiveCount] = useState<InventoryCount | null>(null)
  const [countItems, setCountItems] = useState<CountItemRow[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Start new count
  const handleStartCount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsStarting(true)
      setErrorMessage(null)

      const res = await createInventoryCountAction({
        reference: reference.trim() || undefined,
        notes: sessionNotes.trim() || undefined,
      })

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to start inventory count.')
        return
      }

      // Initialize line items from active products
      const initialRows: CountItemRow[] = activeProducts.map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        systemQuantity: Number(p.stock_quantity || 0),
        countedQuantity: String(p.stock_quantity || 0),
        reason: '',
      }))

      const newCount: InventoryCount = {
        id: res.data.id,
        reference: res.data.reference,
        status: 'draft',
        counted_by: null,
        started_at: new Date().toISOString(),
        completed_at: null,
        notes: sessionNotes.trim() || null,
        created_at: new Date().toISOString(),
      }

      setActiveCount(newCount)
      setCountItems(initialRows)
      setIsStartOpen(false)
      setReference('')
      setSessionNotes('')
    } catch (err: unknown) {
      console.error('Error starting stock count:', err)
      setErrorMessage('An unexpected error occurred.')
    } finally {
      setIsStarting(false)
    }
  }

  // Update item physical count
  const handleCountChange = (productId: string, val: string) => {
    setCountItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, countedQuantity: val } : item
      )
    )
  }

  // Update variance reason
  const handleReasonChange = (productId: string, reason: string) => {
    setCountItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, reason } : item
      )
    )
  }

  // Complete and reconcile count
  const handleCompleteCount = async () => {
    if (!activeCount) return
    setErrorMessage(null)
    setSuccessMessage(null)

    // Check for missing reasons on variances
    const itemsToSubmit = []
    for (const item of countItems) {
      const counted = parseFloat(item.countedQuantity)
      if (isNaN(counted) || counted < 0) {
        setErrorMessage(`Invalid counted quantity for "${item.name}". Must be 0 or greater.`)
        return
      }

      const diff = Number((counted - item.systemQuantity).toFixed(3))
      if (diff !== 0 && !item.reason.trim()) {
        setErrorMessage(
          `Please provide a variance reason for "${item.name}" (Variance: ${diff > 0 ? '+' : ''}${diff} ${item.unit}).`
        )
        return
      }

      itemsToSubmit.push({
        productId: item.productId,
        systemQuantity: item.systemQuantity,
        countedQuantity: counted,
        reason: item.reason.trim() || undefined,
      })
    }

    try {
      setIsCompleting(true)
      const res = await completeInventoryCountAction(activeCount.id, itemsToSubmit)

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to complete stock reconciliation.')
        return
      }

      setSuccessMessage(
        `Physical count ${activeCount.reference} completed! All inventory differences atomically reconciled.`
      )
      setActiveCount(null)
      setCountItems([])
      router.refresh()
    } catch (err: unknown) {
      console.error('Error completing count:', err)
      setErrorMessage('An unexpected error occurred during count reconciliation.')
    } finally {
      setIsCompleting(false)
    }
  }

  // Cancel count
  const handleCancelCount = async () => {
    if (!activeCount) return
    if (!confirm('Are you sure you want to cancel this stocktake session? No stock adjustments will be applied.')) return

    try {
      setIsCancelling(true)
      const res = await cancelInventoryCountAction(activeCount.id)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to cancel count.')
        return
      }
      setActiveCount(null)
      setCountItems([])
      router.refresh()
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Physical Stocktake & Reconciliation
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit physical shelf stock, detect inventory shrinkage, and reconcile database counts atomically.
          </p>
        </div>

        {!activeCount && (
          <Button
            type="button"
            size="sm"
            onClick={() => setIsStartOpen(true)}
            className="gap-2 text-xs"
          >
            <Plus className="h-4 w-4" /> Start Physical Count
          </Button>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Count Workspace */}
      {activeCount && (
        <div className="rounded-xl border border-primary/40 bg-card p-5 space-y-5 shadow-xs animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                Active Count Session
              </span>
              <h4 className="text-base font-bold text-foreground mt-1 font-mono">
                {activeCount.reference}
              </h4>
              <p className="text-xs text-muted-foreground">
                Started {new Date(activeCount.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Review each product line and enter physical count
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelCount}
                disabled={isCancelling || isCompleting}
                className="h-8 text-xs text-rose-600 hover:text-rose-700 gap-1.5"
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel Session
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCompleteCount}
                disabled={isCompleting || isCancelling}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCompleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Complete & Reconcile
              </Button>
            </div>
          </div>

          {/* Counting Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground sticky top-0 border-b border-border z-10 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Product Line</th>
                    <th className="py-2.5 px-3 text-right">System Quantity</th>
                    <th className="py-2.5 px-3 text-right w-36">Physical Count</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                    <th className="py-2.5 px-3 w-64">Variance Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {countItems.map((item) => {
                    const counted = parseFloat(item.countedQuantity) || 0
                    const diff = Number((counted - item.systemQuantity).toFixed(3))
                    const hasVariance = diff !== 0

                    return (
                      <tr
                        key={item.productId}
                        className={`transition-colors ${
                          hasVariance
                            ? diff > 0
                              ? 'bg-emerald-500/5'
                              : 'bg-rose-500/5'
                            : 'hover:bg-muted/20'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            SKU: {item.sku || '—'}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-muted-foreground">
                          {item.systemQuantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={item.countedQuantity}
                            onChange={(e) => handleCountChange(item.productId, e.target.value)}
                            className="h-8 text-right font-mono font-bold text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {hasVariance ? (
                            <span
                              className={
                                diff > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {diff > 0 ? `+${diff}` : diff} {item.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0.00</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {hasVariance ? (
                            <Input
                              placeholder="Reason for discrepancy *"
                              value={item.reason}
                              onChange={(e) => handleReasonChange(item.productId, e.target.value)}
                              required
                              className="h-8 text-xs border-amber-300 dark:border-amber-700 bg-background"
                            />
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Match</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Past Stocktake Sessions */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          Past Count Sessions
        </h4>

        {counts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No physical inventory counts have been conducted yet. Click &quot;Start Physical Count&quot; to begin your first stocktake.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Started At</th>
                  <th className="py-2.5 px-3 font-semibold">Completed At</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {counts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-bold text-foreground">{c.reference}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(c.started_at).toLocaleDateString()} {new Date(c.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {c.completed_at
                        ? `${new Date(c.completed_at).toLocaleDateString()} ${new Date(c.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {c.status === 'completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Completed (Reconciled)
                        </span>
                      ) : c.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-muted-foreground max-w-xs truncate">
                      {c.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Start Count Modal */}
      {isStartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Initialize Stocktake Session
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsStartOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleStartCount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Session Reference (Optional)
                </label>
                <Input
                  placeholder="Leave blank for auto-generated STK-YYYYMMDD-XXXX"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Session Scope / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. End of month physical inventory count, Dairy & Fresh section audit..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
                <ClipboardCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Starting this session will snapshot all {activeProducts.length} active products with their current system stock.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStartOpen(false)}
                  disabled={isStarting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isStarting} className="gap-1.5">
                  {isStarting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Begin Count
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
