'use client'

import React, { useState, useTransition } from 'react'
import { assignOrderDeliveryAction } from '@/app/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { X, UserCheck, Loader2 } from 'lucide-react'
import type { Profile } from '@/types/database.types'

interface DeliveryAssignmentDialogProps {
  orderId: string
  orderNumber: string
  isOpen: boolean
  onClose: () => void
  currentDriverId?: string | null
  availableDrivers: (Profile & { activeDeliveriesCount: number })[]
}

export function DeliveryAssignmentDialog({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  currentDriverId,
  availableDrivers,
}: DeliveryAssignmentDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState(currentDriverId || '')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriverId) {
      setErrorMsg('Please select a delivery driver')
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const res = await assignOrderDeliveryAction({
        orderId,
        driverId: selectedDriverId,
        notes: notes.trim() || undefined,
      })

      if (res.success) {
        onClose()
      } else {
        setErrorMsg(res.error || 'Failed to assign driver')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Assign Delivery Personnel</span>
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
          Assign a staff driver for order <strong className="text-foreground">{orderNumber}</strong>.
          The assigned driver will be notified and this order will appear in their active delivery queue.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200 dark:border-rose-900">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Select Active Driver</label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {availableDrivers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-2">
                  No active staff members found in system.
                </p>
              ) : (
                availableDrivers.map((driver) => (
                  <label
                    key={driver.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedDriverId === driver.id
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="driver"
                        value={driver.id}
                        checked={selectedDriverId === driver.id}
                        onChange={() => setSelectedDriverId(driver.id)}
                        className="text-emerald-600 focus:ring-emerald-600"
                      />
                      <div>
                        <span className="font-semibold text-foreground block">
                          {driver.full_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {driver.phone || 'No phone on profile'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">
                      {driver.activeDeliveriesCount} active deliveries
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Delivery Instructions for Driver (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Villa gate code #4491, ring buzzer twice..."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
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
              disabled={isPending || !selectedDriverId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Assignment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
