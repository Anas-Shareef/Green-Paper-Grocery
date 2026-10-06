'use client'

import React from 'react'
import Link from 'next/link'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import type { OrderListItem } from '@/lib/services/orders'
import { ShoppingBag, ArrowRight, UserCheck, MapPin, Clock } from 'lucide-react'

interface OrderTableProps {
  orders: OrderListItem[]
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <EmptyState
          title="No Matching Orders"
          description="No grocery orders match your selected filters or search terms."
          icon={ShoppingBag}
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Order Number</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Delivery (Zone 19)</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Driver</th>
              <th className="px-4 py-3">Order Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-muted/40 transition-colors">
                {/* Order Number */}
                <td className="px-4 py-3 font-mono font-bold text-foreground whitespace-nowrap">
                  <Link
                    href={`/admin/orders/${ord.id}`}
                    className="hover:text-emerald-600 transition-colors underline-offset-2 hover:underline"
                  >
                    {ord.order_number}
                  </Link>
                </td>

                {/* Customer */}
                <td className="px-4 py-3">
                  <span className="font-semibold text-foreground block">
                    {ord.recipient_name || ord.customer?.name || 'Customer'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {ord.recipient_phone || ord.customer?.mobile || '—'}
                  </span>
                </td>

                {/* Delivery */}
                <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                  <span title={ord.delivery_address}>{ord.delivery_address}</span>
                </td>

                {/* Items */}
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  {ord.order_items?.length || 0} items
                </td>

                {/* Payment */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="capitalize text-[11px] text-muted-foreground font-medium">
                      {ord.payment_method.replace('_', ' ')}
                    </span>
                    <PaymentStatusBadge status={ord.payment_status} />
                  </div>
                </td>

                {/* Total */}
                <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                  <CurrencyDisplay amount={ord.total_amount} />
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <OrderStatusBadge status={ord.status} />
                </td>

                {/* Driver */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {ord.driver ? (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <UserCheck className="h-3 w-3 text-emerald-600" />
                      {ord.driver.full_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(ord.order_date).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-600 text-xs font-semibold transition-colors"
                  >
                    Manage
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden divide-y divide-border">
        {orders.map((ord) => (
          <div key={ord.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href={`/admin/orders/${ord.id}`}
                className="font-mono font-bold text-sm text-foreground hover:text-emerald-600"
              >
                {ord.order_number}
              </Link>
              <OrderStatusBadge status={ord.status} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-foreground block">
                  {ord.recipient_name || ord.customer?.name || 'Customer'}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {ord.recipient_phone || ord.customer?.mobile || '—'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-foreground block">
                  <CurrencyDisplay amount={ord.total_amount} />
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {ord.order_items?.length || 0} items
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{ord.delivery_address}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <PaymentStatusBadge status={ord.payment_status} />
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Clock className="h-3 w-3" />
                  {new Date(ord.order_date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <Link
                href={`/admin/orders/${ord.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
              >
                Manage
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
