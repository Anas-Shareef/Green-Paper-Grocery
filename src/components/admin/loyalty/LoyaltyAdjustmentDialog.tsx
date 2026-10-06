'use client'

import React, { useState } from 'react'
import { handleAdjustLoyaltyPoints } from '@/app/admin/loyalty/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus, AlertCircle, X, ShieldAlert } from 'lucide-react'

interface LoyaltyAdjustmentDialogProps {
  customers: Array<{ id: string; name: string; mobile: string }>
}

export function LoyaltyAdjustmentDialog({ customers }: LoyaltyAdjustmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add')
  const [pointsInput, setPointsInput] = useState('100')
  const [reasonInput, setReasonInput] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const rawPoints = Number(pointsInput)
    if (isNaN(rawPoints) || rawPoints <= 0) {
      setErrorMsg('Points must be a positive integer.')
      return
    }

    if (!reasonInput.trim()) {
      setErrorMsg('A specific reason is strictly required for audit compliance.')
      return
    }

    const signedPoints = adjustmentType === 'add' ? rawPoints : -rawPoints

    const formData = new FormData()
    formData.append('customer_id', selectedCustomerId)
    formData.append('points', String(signedPoints))
    formData.append('reason', reasonInput.trim())

    try {
      setIsSubmitting(true)
      await handleAdjustLoyaltyPoints(formData)
      setIsOpen(false)
      setReasonInput('')
      setPointsInput('100')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to adjust points')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
      >
        <Plus className="h-4 w-4" /> Manual Adjustment
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Adjust Customer Loyalty Balance
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Customer *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`h-9 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustmentType === 'add'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Plus className="h-4 w-4" /> Grant Points (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('deduct')}
                    className={`h-9 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustmentType === 'deduct'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Minus className="h-4 w-4" /> Deduct Points (-)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Points Amount *</label>
                <Input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Adjustment Reason (Audit Required) *</label>
                <Input
                  required
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Customer service compensation for late delivery"
                  className="h-10 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  An immutable ledger entry and audit log will be created with your actor ID.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmitting ? 'Adjusting...' : 'Commit Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
