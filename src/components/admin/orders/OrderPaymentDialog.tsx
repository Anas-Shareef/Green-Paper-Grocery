'use client'

import React, { useState, useTransition } from 'react'
import { collectOrderPaymentAction } from '@/app/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, CreditCard, Loader2 } from 'lucide-react'
import type { PaymentMethod } from '@/types/database.types'

interface OrderPaymentDialogProps {
  orderId: string
  orderNumber: string
  totalAmount: number
  isOpen: boolean
  onClose: () => void
}

export function OrderPaymentDialog({
  orderId,
  orderNumber,
  totalAmount,
  isOpen,
  onClose,
}: OrderPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState(totalAmount.toString())
  const [reference, setReference] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCollect = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount')
      return
    }

    if (numAmount > totalAmount) {
      setErrorMsg(`Collected amount cannot exceed the order total of AED ${totalAmount.toFixed(2)}`)
      return
    }

    startTransition(async () => {
      const res = await collectOrderPaymentAction({
        orderId,
        amount: numAmount,
        paymentMethod,
        reference: reference.trim() || undefined,
      })

      if (res.success) {
        onClose()
      } else {
        setErrorMsg(res.error || 'Failed to record payment collection')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span>Record Payment Collection</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Record payment received for order <strong className="text-foreground">{orderNumber}</strong>.
          Order total is <strong className="text-emerald-600">AED {totalAmount.toFixed(2)}</strong>.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200 dark:border-rose-900">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCollect} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="cash">Cash on Delivery</option>
              <option value="card_on_delivery">Card on Delivery (POS Machine)</option>
              <option value="card_online">Card Online / Payment Link</option>
              <option value="credit">Store Credit / Customer Account</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Amount Collected (AED)</label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Transaction / POS Reference (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. POS Auth Code #884102 or Receipt #..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9 text-xs rounded-xl"
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
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Mark Payment Collected
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
