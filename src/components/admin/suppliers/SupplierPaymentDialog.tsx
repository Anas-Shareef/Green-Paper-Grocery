'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, X, AlertCircle, Loader2 } from 'lucide-react'
import { recordSupplierPaymentAction } from '@/app/admin/suppliers/actions'
import type { SupplierInvoice, PaymentMethod } from '@/types/database.types'

interface SupplierPaymentDialogProps {
  supplierId: string
  supplierName: string
  invoice?: SupplierInvoice | null
  open: boolean
  onClose: () => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Company Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Card / Other' },
]

export function SupplierPaymentDialog({
  supplierId,
  supplierName,
  invoice,
  open,
  onClose,
}: SupplierPaymentDialogProps) {
  const router = useRouter()

  const maxAmount = invoice ? Number(invoice.outstanding_amount) || 0 : undefined
  const [amount, setAmount] = useState(invoice ? invoice.outstanding_amount.toString() : '')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Payment amount must be greater than zero')
      return
    }

    if (maxAmount !== undefined && parsedAmount > maxAmount) {
      setError(`Payment cannot exceed the outstanding invoice balance of AED ${maxAmount.toFixed(2)}`)
      return
    }

    setLoading(true)
    try {
      const res = await recordSupplierPaymentAction({
        supplierId,
        invoiceId: invoice?.id || null,
        amount: parsedAmount,
        paymentMethod,
        paymentDate,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      })

      if (!res.success) {
        setError(res.error || 'Failed to record payment')
        return
      }

      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Record Supplier Payment</h3>
              <p className="text-xs text-muted-foreground">{supplierName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {invoice && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Invoice Number:</span>
                <span className="font-semibold text-foreground font-mono">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Amount:</span>
                <span className="font-medium text-foreground">AED {Number(invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  AED {Number(invoice.outstanding_amount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Payment Amount (AED) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Transaction / Cheque Reference</label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TR-2026-9912 or Cheque #4412"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Payment Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Settlement notes, bank confirmation details..."
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Recording...
                </span>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
