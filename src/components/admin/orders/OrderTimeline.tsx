import React from 'react'
import type { OrderStatusHistory } from '@/types/database.types'
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

interface OrderTimelineProps {
  history: (OrderStatusHistory & {
    author?: { id: string; full_name: string } | null
  })[]
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground">
        No state transitions recorded yet.
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case 'preparing':
        return <Package className="h-4 w-4 text-purple-600" />
      case 'ready':
        return <Sparkles className="h-4 w-4 text-teal-600" />
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-indigo-600" />
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-emerald-600" />
      case 'failed_delivery':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-600" />
      default:
        return <Clock className="h-4 w-4 text-amber-600" />
    }
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {history.map((event) => (
        <div key={event.id} className="relative space-y-1 text-xs">
          {/* Timeline marker */}
          <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center">
            {getStatusIcon(event.to_status)}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground capitalize">
              {event.to_status.replace('_', ' ')}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {new Date(event.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="text-muted-foreground text-[11px]">
            {event.author?.full_name ? (
              <span>Updated by <strong className="text-foreground">{event.author.full_name}</strong></span>
            ) : (
              <span>System automated transition</span>
            )}
            {event.reason && (
              <p className="mt-0.5 text-foreground italic">
                &ldquo;{event.reason}&rdquo;
              </p>
            )}
            {event.notes && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Note: {event.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
