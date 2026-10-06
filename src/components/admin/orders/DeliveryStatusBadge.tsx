import React from 'react'
import type { DeliveryStatus } from '@/types/database.types'
import { UserCheck, Truck, CheckCheck, AlertTriangle, HelpCircle } from 'lucide-react'

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus
  className?: string
}

export function DeliveryStatusBadge({ status, className = '' }: DeliveryStatusBadgeProps) {
  switch (status) {
    case 'unassigned':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border ${className}`}
        >
          <HelpCircle className="h-3 w-3" />
          Unassigned
        </span>
      )
    case 'assigned':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 ${className}`}
        >
          <UserCheck className="h-3 w-3" />
          Driver Assigned
        </span>
      )
    case 'out_for_delivery':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 ${className}`}
        >
          <Truck className="h-3 w-3" />
          En Route
        </span>
      )
    case 'delivered':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 ${className}`}
        >
          <CheckCheck className="h-3 w-3" />
          Delivered
        </span>
      )
    case 'failed':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 ${className}`}
        >
          <AlertTriangle className="h-3 w-3" />
          Delivery Failed
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
