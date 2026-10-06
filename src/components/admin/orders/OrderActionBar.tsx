'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { transitionOrderStatusAction } from '@/app/admin/orders/actions'
import { DeliveryAssignmentDialog } from './DeliveryAssignmentDialog'
import { FailedDeliveryDialog } from './FailedDeliveryDialog'
import { OrderCancelDialog } from './OrderCancelDialog'
import { OrderPaymentDialog } from './OrderPaymentDialog'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Package,
  Sparkles,
  Truck,
  CheckCheck,
  AlertTriangle,
  XCircle,
  CreditCard,
  Printer,
  UserCheck,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import type { OrderStatus, PaymentStatus, Profile } from '@/types/database.types'

interface OrderActionBarProps {
  orderId: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  currentDriverId?: string | null
  availableDrivers: (Profile & { activeDeliveriesCount: number })[]
}

export function OrderActionBar({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  totalAmount,
  currentDriverId,
  availableDrivers,
}: OrderActionBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Dialog States
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [failedDialogOpen, setFailedDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const handleSimpleTransition = (nextStatus: OrderStatus) => {
    if (nextStatus === 'out_for_delivery' && !currentDriverId) {
      // Must assign driver before or during dispatch
      setAssignDialogOpen(true)
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const res = await transitionOrderStatusAction({
        orderId,
        nextStatus,
      })

      if (res.success) {
        router.refresh()
      } else {
        setErrorMsg(res.error || 'Failed to update order status')
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        {/* Left: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PENDING -> CONFIRMED */}
          {status === 'pending' && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleSimpleTransition('confirmed')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Confirm Order
            </Button>
          )}

          {/* CONFIRMED -> PREPARING */}
          {status === 'confirmed' && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleSimpleTransition('preparing')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
              Start Preparing
            </Button>
          )}

          {/* PREPARING -> READY */}
          {status === 'preparing' && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleSimpleTransition('ready')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Mark Order Ready
            </Button>
          )}

          {/* READY: Assign Driver or Dispatch */}
          {status === 'ready' && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignDialogOpen(true)}
                className="text-xs h-9 px-3.5 rounded-xl gap-1.5 font-semibold"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                {currentDriverId ? 'Re-assign Driver' : 'Assign Driver'}
              </Button>

              <Button
                type="button"
                disabled={isPending}
                onClick={() => handleSimpleTransition('out_for_delivery')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Truck className="h-3.5 w-3.5" />
                )}
                Dispatch (Out for Delivery)
              </Button>
            </>
          )}

          {/* OUT_FOR_DELIVERY -> DELIVERED / FAILED */}
          {status === 'out_for_delivery' && (
            <>
              <Button
                type="button"
                disabled={isPending}
                onClick={() => handleSimpleTransition('delivered')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark Delivered
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setFailedDialogOpen(true)}
                className="text-xs h-9 px-3.5 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 font-semibold"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Delivery Failed
              </Button>
            </>
          )}

          {/* FAILED_DELIVERY: Re-dispatch */}
          {status === 'failed_delivery' && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleSimpleTransition('out_for_delivery')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-Dispatch Delivery
            </Button>
          )}

          {/* PAYMENT ACTION IF PENDING */}
          {paymentStatus !== 'paid' && status !== 'cancelled' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentDialogOpen(true)}
              className="text-xs h-9 px-3.5 rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5 font-semibold"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Collect Payment
            </Button>
          )}

          {/* CANCEL ACTION (allowed for non-terminal statuses) */}
          {status !== 'delivered' && status !== 'cancelled' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCancelDialogOpen(true)}
              className="text-xs h-9 px-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Order
            </Button>
          )}
        </div>

        {/* Right: Print Slip */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${orderId}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            Print Packing Slip
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Modals */}
      <DeliveryAssignmentDialog
        orderId={orderId}
        orderNumber={orderNumber}
        isOpen={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        currentDriverId={currentDriverId}
        availableDrivers={availableDrivers}
      />

      <FailedDeliveryDialog
        orderId={orderId}
        orderNumber={orderNumber}
        isOpen={failedDialogOpen}
        onClose={() => setFailedDialogOpen(false)}
      />

      <OrderCancelDialog
        orderId={orderId}
        orderNumber={orderNumber}
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      />

      <OrderPaymentDialog
        orderId={orderId}
        orderNumber={orderNumber}
        totalAmount={totalAmount}
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
      />
    </>
  )
}
