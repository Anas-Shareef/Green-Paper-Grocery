import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCustomerOrderById } from '@/lib/services/customerStore'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { CancelOrderButton } from '@/components/storefront/CancelOrderButton'
import {
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Order Details | My Account',
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await getCustomerOrderById(id)

  if (!order) {
    notFound()
  }

  const canCancel = order.status === 'pending' || order.status === 'confirmed'

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Orders
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black font-mono text-foreground">
                {order.order_number}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : order.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Placed on {new Date(order.order_date).toLocaleString()}
            </p>
          </div>

          {/* Cancellation Action if pending */}
          {canCancel && (
            <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />
          )}
        </div>

        {/* Customer Visual Order Lifecycle Tracker */}
        {order.status === 'cancelled' ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs space-y-1">
            <h4 className="font-bold text-sm">Order Cancelled</h4>
            <p>
              {order.cancellation_reason
                ? `Reason: "${order.cancellation_reason}"`
                : 'This order was cancelled and will not be delivered.'}
            </p>
          </div>
        ) : order.status === 'failed_delivery' ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <h4 className="font-bold text-sm">Delivery Exception in Zone 19</h4>
            <p>
              Our driver attempted delivery but could not complete it. Our store staff will contact
              you via phone or WhatsApp shortly.
            </p>
          </div>
        ) : (
          <div className="py-2 px-1">
            <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">
              Live Order Progress
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                {
                  label: 'Order Placed',
                  time: order.order_date,
                  done: true,
                },
                {
                  label: 'Confirmed',
                  time: order.confirmed_at,
                  done: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(
                    order.status
                  ),
                },
                {
                  label: 'Preparing',
                  time: order.preparing_at,
                  done: ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
                },
                {
                  label: 'Ready',
                  time: order.ready_at,
                  done: ['ready', 'out_for_delivery', 'delivered'].includes(order.status),
                },
                {
                  label: 'Out for Delivery',
                  time: order.out_for_delivery_at,
                  done: ['out_for_delivery', 'delivered'].includes(order.status),
                },
                {
                  label: 'Delivered',
                  time: order.delivered_at,
                  done: order.status === 'delivered',
                },
              ].map((step, idx) => (
                <div
                  key={step.label}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                    step.done
                      ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'border-border bg-muted/20 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <span
                      className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                        step.done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate">{step.label}</span>
                  </div>
                  {step.time && step.done ? (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(step.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">
                      {step.done ? 'Done' : 'Pending'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery & Payment Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Delivery Information (Zone 19)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed pl-6">
              {order.delivery_address}
            </p>
            {order.delivery_notes && (
              <p className="text-[11px] text-muted-foreground italic pl-6">
                Note: &ldquo;{order.delivery_notes}&rdquo;
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Payment Details</span>
            </div>
            <div className="pl-6 space-y-1 text-muted-foreground">
              <p>
                Method:{' '}
                <strong className="text-foreground capitalize font-semibold">
                  {order.payment_method.replace('_', ' ')}
                </strong>
              </p>
              <p>
                Status:{' '}
                <strong className="text-foreground capitalize font-semibold">
                  {order.payment_status}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">Purchased Items ({order.items.length})</h3>
          <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <h4 className="font-bold text-foreground">{item.product_name}</h4>
                  <div className="text-[11px] text-muted-foreground">
                    Qty: <strong>{item.quantity}</strong> × <CurrencyDisplay amount={item.selling_price} />
                  </div>
                </div>

                <div className="text-right">
                  <CurrencyDisplay
                    amount={item.total_amount}
                    className="font-bold text-sm text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-2xl bg-muted/30 border border-border p-5 space-y-2.5 text-xs max-w-sm ml-auto">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <CurrencyDisplay amount={order.subtotal} className="font-semibold text-foreground" />
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>5% UAE VAT</span>
            <CurrencyDisplay amount={order.tax_amount || 0} className="font-semibold text-foreground" />
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Delivery Fee</span>
            {(order.delivery_fee || 0) === 0 ? (
              <span className="text-emerald-600 font-bold">FREE</span>
            ) : (
              <CurrencyDisplay amount={order.delivery_fee} className="font-semibold text-foreground" />
            )}
          </div>

          <div className="h-px bg-border my-1" />

          <div className="flex items-baseline justify-between pt-1">
            <span className="font-bold text-sm text-foreground">Total Paid / Due</span>
            <CurrencyDisplay
              amount={order.total_amount}
              className="text-lg font-black text-emerald-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
