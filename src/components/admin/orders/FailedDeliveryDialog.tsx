'use client'

import React, { useState, useTransition } from 'react'
import { transitionOrderStatusAction } from '@/app/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface FailedDeliveryDialogProps {
  orderId: string
  orderNumber: string
  isOpen: boolean
  onClose: () => void
}

const FAILURE_REASONS = [
  'Customer unavailable / No answer at door',
  'Incorrect or incomplete delivery address in Zone 19',
  'Customer refused to accept order',
  'Customer did not have cash / payment ready',
  'Gated community / Security access refused',
  'Other delivery exception',
]

export function FailedDeliveryDialog({
  orderId,
  orderNumber,
  isOpen,
  onClose,
}: FailedDeliveryDialogProps) {
  const [selectedReason, setSelectedReason] = useState(FAILURE_REASONS[0])
  const [customNotes, setCustomNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const finalReason = `${selectedReason}${customNotes ? ` — ${customNotes.trim()}` : ''}`

    startTransition(async () => {
      const res = await transitionOrderStatusAction({
        orderId,
        nextStatus: 'failed_delivery',
        failureReason: finalReason,
        notes: `Delivery attempt failed: ${finalReason}`,
      })

      if (res.success) {
        onClose()
      } else {
        setErrorMsg(res.error || 'Failed to update order status')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-rose-500/30 p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Record Failed Delivery — {orderNumber}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
          <strong>Important Inventory Rule:</strong> Recording a delivery failure does{' '}
          <strong>NOT</strong> automatically restock inventory or cancel the order. It creates an
          operational exception for staff to contact the customer, re-dispatch, or deliberately cancel.
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200 dark:border-rose-900">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Reason for Delivery Failure</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {FAILURE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Additional Details / Staff Notes
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Called customer 3 times, villa guard confirmed tenant is traveling..."
              rows={3}
              required
              className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !customNotes.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Failed Delivery
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
