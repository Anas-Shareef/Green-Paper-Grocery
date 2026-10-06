import React from 'react'
import type { OrderStatus } from '@/types/database.types'
import {
  Clock,
  CheckCircle2,
  Package,
  Sparkles,
  Truck,
  CheckCheck,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 ${className}`}
        >
          <Clock className="h-3 w-3 animate-pulse" />
          Pending Confirmation
        </span>
      )
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 ${className}`}
        >
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </span>
      )
    case 'preparing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20 ${className}`}
        >
          <Package className="h-3 w-3" />
          Preparing / Packing
        </span>
      )
    case 'ready':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 border border-teal-500/20 ${className}`}
        >
          <Sparkles className="h-3 w-3" />
          Ready for Delivery
        </span>
      )
    case 'out_for_delivery':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 ${className}`}
        >
          <Truck className="h-3 w-3 animate-bounce" />
          Out for Delivery
        </span>
      )
    case 'delivered':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 ${className}`}
        >
          <CheckCheck className="h-3 w-3" />
          Delivered
        </span>
      )
    case 'failed_delivery':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 ${className}`}
        >
          <AlertTriangle className="h-3 w-3" />
          Delivery Failed
        </span>
      )
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 ${className}`}
        >
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      )
    case 'returned':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20 ${className}`}
        >
          <RotateCcwIcon className="h-3 w-3" />
          Returned
        </span>
      )
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground ${className}`}
        >
          {status}
        </span>
      )
  }
}

function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}
