'use client'

import React, { useState, useTransition } from 'react'
import { cancelOrderStaffAction } from '@/app/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, Loader2 } from 'lucide-react'

interface OrderCancelDialogProps {
  orderId: string
  orderNumber: string
  isOpen: boolean
  onClose: () => void
}

export function OrderCancelDialog({
  orderId,
  orderNumber,
  isOpen,
  onClose,
}: OrderCancelDialogProps) {
  const [reason, setReason] = useState('')
  const [restock, setRestock] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setErrorMsg('Please specify a cancellation reason')
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const res = await cancelOrderStaffAction({
        orderId,
        reason: reason.trim(),
        restock,
      })

      if (res.success) {
        onClose()
      } else {
        setErrorMsg(res.error || 'Failed to cancel order')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-rose-500/30 p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Cancel Customer Order</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2 leading-relaxed">
          <p className="font-bold">
            Are you sure you want to cancel order {orderNumber}?
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li>Order status will be set to <strong>CANCELLED</strong> (terminal state).</li>
            <li>
              {restock
                ? 'All reserved quantities will be restored to store inventory with immutable ledger audit entries.'
                : 'Inventory will NOT be restored (manual write-off).'}
            </li>
            <li>Customer will receive an instant notification with the cancellation reason.</li>
          </ul>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200 dark:border-rose-900">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCancel} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer called to cancel, items out of stock, duplicate order..."
              rows={3}
              required
              className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600"
            />
            <div className="text-xs">
              <span className="font-semibold text-foreground block">
                Restore Inventory to Store Stock
              </span>
              <span className="text-[11px] text-muted-foreground">
                Appends immutable movements ledger records to reverse the sale deduction atomically.
              </span>
            </div>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Back
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !reason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
