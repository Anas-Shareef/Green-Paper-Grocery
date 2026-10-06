'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelCustomerOrderAction } from '@/app/account/actions'
import { Button } from '@/components/ui/button'
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'

interface CancelOrderButtonProps {
  orderId: string
  orderNumber: string
}

export function CancelOrderButton({ orderId, orderNumber }: CancelOrderButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelCustomerOrderAction(orderId, reason)
        setConfirmOpen(false)
        router.refresh()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to cancel order')
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="h-9 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200/50"
      >
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Cancel Order
      </Button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Cancel Order {orderNumber}?</h3>
                <p className="text-xs text-muted-foreground">
                  Reserved stock will be immediately returned to store inventory.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Changed items / ordered by mistake"
                rows={2}
                className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-xs focus:bg-card focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                className="text-xs font-semibold rounded-xl"
              >
                Keep Order
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleCancel}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
