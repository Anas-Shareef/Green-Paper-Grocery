import React from 'react'
import type { PaymentStatus } from '@/types/database.types'
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  switch (status) {
    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 ${className}`}
        >
          <CheckCircle2 className="h-3 w-3" />
          Paid
        </span>
      )
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 ${className}`}
        >
          <Clock className="h-3 w-3" />
          Pending
        </span>
      )
    case 'partially_paid':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 ${className}`}
        >
          Partially Paid
        </span>
      )
    case 'failed':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 ${className}`}
        >
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      )
    case 'refunded':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20 ${className}`}
        >
          <RotateCcw className="h-3 w-3" />
          Refunded
        </span>
      )
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground ${className}`}
        >
          {status}
        </span>
      )
  }
}
