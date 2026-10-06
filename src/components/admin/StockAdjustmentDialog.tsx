'use client'

import { useState } from 'react'
import { adjustStockAction } from '@/app/admin/inventory/actions'
import {
  ArrowDownUp,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface StockAdjustmentProduct {
  id: string
  name: string
  sku: string | null
  stock_quantity: number
  unit: string
}

interface StockAdjustmentDialogProps {
  isOpen: boolean
  onClose: () => void
  product: StockAdjustmentProduct | null
  onSuccess?: () => void
}

const ADJUSTMENT_REASONS = [
  { value: 'Counting correction', label: 'Physical Count Discrepancy' },
  { value: 'Damaged', label: 'Damaged Goods / Spillage' },
  { value: 'Expired', label: 'Expired Product Removal' },
  { value: 'Operational adjustment', label: 'Operational Reallocation' },
  { value: 'Opening stock', label: 'Opening Stock Initialization' },
  { value: 'Other', label: 'Other Operational Reason' },
]

export function StockAdjustmentDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase')
  const [quantity, setQuantity] = useState<string>('')
  const [reason, setReason] = useState<string>('Counting correction')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen || !product) return null

  const currentStock = Number(product.stock_quantity || 0)
  const parsedQty = parseFloat(quantity) || 0
  const projectedStock =
    adjustmentType === 'increase'
      ? currentStock + parsedQty
      : currentStock - parsedQty

  const isNegativeProjected = projectedStock < 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (parsedQty <= 0) {
      setErrorMessage('Please enter a quantity greater than zero.')
      return
    }

    if (adjustmentType === 'decrease' && isNegativeProjected) {
      setErrorMessage(
        `Negative stock is not permitted. Current stock is ${currentStock} ${product.unit}, requested reduction is ${parsedQty}.`
      )
      return
    }

    try {
      setIsSubmitting(true)
      const res = await adjustStockAction({
        productId: product.id,
        type: adjustmentType,
        quantity: parsedQty,
        reason,
        notes: notes.trim() || undefined,
      })

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to apply stock adjustment.')
        return
      }

      setSuccessMessage(
        `Stock successfully updated to ${res.data?.newStock} ${product.unit}.`
      )
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (err: unknown) {
      console.error('Error submitting stock adjustment:', err)
      setErrorMessage('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ArrowDownUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Stock Adjustment
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Atomic inventory adjustment with complete audit trail
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Target Product Summary */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                SKU: <span className="font-mono text-foreground">{product.sku || 'N/A'}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Current Stock
              </span>
              <span className="text-lg font-bold font-mono text-foreground">
                {currentStock}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {product.unit}
                </span>
              </span>
            </div>
          </div>

          {/* Direction Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  adjustmentType === 'increase'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'border-border hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Increase Stock (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  adjustmentType === 'decrease'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold shadow-xs'
                    : 'border-border hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Decrease Stock (-)
              </button>
            </div>
          </div>

          {/* Quantity & Projected Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Adjustment Quantity ({product.unit}) *
              </label>
              <Input
                type="number"
                step="any"
                min="0.001"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resulting Stock Level
              </label>
              <div
                className={`h-9 px-3 rounded-md border flex items-center font-mono text-sm font-semibold ${
                  isNegativeProjected
                    ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : 'border-border bg-muted/20 text-foreground'
                }`}
              >
                {parsedQty > 0 ? projectedStock : currentStock} {product.unit}
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Reason for Adjustment *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Audit Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Expired batch discarded, delivery discrepancy note..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || parsedQty <= 0 || (adjustmentType === 'decrease' && isNegativeProjected)}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
