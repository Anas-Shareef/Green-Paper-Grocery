import React from 'react'
import { notFound } from 'next/navigation'
import { getAdminOrderById, getActiveDeliveryDrivers } from '@/lib/services/orders'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge'
import { PaymentStatusBadge } from '@/components/admin/orders/PaymentStatusBadge'
import { DeliveryStatusBadge } from '@/components/admin/orders/DeliveryStatusBadge'
import { OrderActionBar } from '@/components/admin/orders/OrderActionBar'
import { FulfillmentChecklist } from '@/components/admin/orders/FulfillmentChecklist'
import { OrderTimeline } from '@/components/admin/orders/OrderTimeline'
import { OrderNotesPanel } from '@/components/admin/orders/OrderNotesPanel'
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  Truck,
  User,
  AlertCircle,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const order = await getAdminOrderById(id)
  return {
    title: order ? `Order ${order.order_number} | Admin` : 'Order Details | Admin',
  }
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const [order, availableDrivers] = await Promise.all([
    getAdminOrderById(id),
    getActiveDeliveryDrivers(),
  ])

  if (!order) {
    notFound()
  }

  // Format WhatsApp number
  const rawPhone = order.recipient_phone || order.customer?.mobile || ''
  const cleanPhone = rawPhone.replace(/\D/g, '')
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('971') ? cleanPhone : `971${cleanPhone.replace(/^0/, '')}`}`
    : null

  const isTerminal = order.status === 'delivered' || order.status === 'cancelled'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order ${order.order_number}`}
        description={`Placed on ${new Date(order.order_date).toLocaleString()} • ${order.order_source} order`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Orders', href: '/admin/orders' },
          { label: order.order_number },
        ]}
      />

      {/* Top Status & Contextual Action Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Status:</span>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
            {order.delivery && (
              <DeliveryStatusBadge status={order.delivery.status} />
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium block">Total Order Value</span>
            <span className="text-lg font-black text-foreground font-mono">
              <CurrencyDisplay amount={order.total_amount} />
            </span>
          </div>
        </div>

        {/* Workflow Actions Bar */}
        <OrderActionBar
          orderId={order.id}
          orderNumber={order.order_number}
          status={order.status}
          paymentStatus={order.payment_status}
          totalAmount={Number(order.total_amount)}
          currentDriverId={order.assigned_driver_id}
          availableDrivers={availableDrivers}
        />
      </div>

      {/* Failure reason callout if failed */}
      {order.status === 'failed_delivery' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Delivery Exception Recorded</h4>
            <p className="leading-relaxed">
              Reason: <strong>{order.failure_reason || 'Unspecified'}</strong>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Please contact the customer to resolve address access or re-dispatch to another driver.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items & Financial Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Checklist */}
          <FulfillmentChecklist
            orderId={order.id}
            items={order.order_items}
            readOnly={isTerminal}
          />

          {/* Authoritative Financial Breakdown (Immutable) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Financial Summary (Immutable Transaction)
            </h3>
            <div className="divide-y divide-border text-xs space-y-2 pt-1">
              <div className="flex justify-between text-muted-foreground pb-2">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium text-foreground">
                  <CurrencyDisplay amount={order.subtotal} />
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground py-2">
                <span>UAE VAT (5%)</span>
                <span className="font-mono font-medium text-foreground">
                  <CurrencyDisplay amount={order.tax_amount || 0} />
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground py-2">
                <span>Delivery Fee (Zone 19)</span>
                <span className="font-mono font-medium text-foreground">
                  {Number(order.delivery_fee) === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    <CurrencyDisplay amount={order.delivery_fee} />
                  )}
                </span>
              </div>
              {Number(order.promotion_discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 py-1.5 font-medium">
                  <span>Promotion Savings</span>
                  <span className="font-mono">
                    -<CurrencyDisplay amount={order.promotion_discount} />
                  </span>
                </div>
              )}
              {Number(order.coupon_discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 py-1.5 font-medium">
                  <span>
                    Coupon Discount {order.coupon_code_snapshot ? `(${order.coupon_code_snapshot})` : ''}
                  </span>
                  <span className="font-mono">
                    -<CurrencyDisplay amount={order.coupon_discount} />
                  </span>
                </div>
              )}
              {Number(order.loyalty_discount || 0) > 0 && (
                <div className="flex justify-between text-amber-600 py-1.5 font-medium">
                  <span>
                    Loyalty Points Redeemed ({order.loyalty_points_redeemed || 0} pts)
                  </span>
                  <span className="font-mono">
                    -<CurrencyDisplay amount={order.loyalty_discount} />
                  </span>
                </div>
              )}
              {Number(order.discount_amount || 0) > 0 &&
                !order.promotion_discount &&
                !order.coupon_discount &&
                !order.loyalty_discount && (
                  <div className="flex justify-between text-emerald-600 py-2 font-medium">
                    <span>Store Discount</span>
                    <span className="font-mono">
                      -<CurrencyDisplay amount={order.discount_amount} />
                    </span>
                  </div>
                )}
              {Number(order.loyalty_points_earned || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 py-1.5 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/30 px-2 rounded-lg">
                  <span>Loyalty Points Earned</span>
                  <span className="font-mono">+{order.loyalty_points_earned} pts</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-foreground pt-3 border-t border-border">
                <span>Grand Total</span>
                <span className="font-mono text-emerald-600">
                  <CurrencyDisplay amount={order.total_amount} />
                </span>
              </div>
            </div>
          </div>

          {/* Operational Timeline */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Order Event Timeline & Audit Trail
            </h3>
            <OrderTimeline history={order.status_history} />
          </div>
        </div>

        {/* Right 1 Column: Customer, Delivery, Driver & Notes */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Customer Information
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px] block">Customer Name</span>
                <span className="font-bold text-foreground text-sm">
                  {order.recipient_name || order.customer?.name || 'Storefront Customer'}
                </span>
              </div>

              {rawPhone && (
                <div>
                  <span className="text-muted-foreground text-[11px] block">Phone / Mobile</span>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`tel:${rawPhone}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground font-mono font-semibold hover:bg-muted/80 transition-colors"
                    >
                      <Phone className="h-3 w-3 text-emerald-600" />
                      {rawPhone}
                    </a>

                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-500/20 transition-colors text-[11px]"
                      >
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}

              {order.customer?.email && (
                <div>
                  <span className="text-muted-foreground text-[11px] block">Email</span>
                  <span className="text-foreground font-mono">{order.customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Delivery Details (Zone 19)
            </h3>

            <div className="text-xs space-y-2">
              <p className="text-foreground leading-relaxed font-medium">
                {order.delivery_address}
              </p>

              {order.delivery_notes && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                  <strong>Special Instructions:</strong> &ldquo;{order.delivery_notes}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Driver Assignment Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              Delivery Assignment
            </h3>

            {order.driver ? (
              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">
                    {order.driver.full_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                    Assigned Driver
                  </span>
                </div>
                {order.driver.phone && (
                  <p className="text-muted-foreground font-mono flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-emerald-600" />
                    {order.driver.phone}
                  </p>
                )}
                {order.out_for_delivery_at && (
                  <p className="text-[11px] text-muted-foreground">
                    Dispatched:{' '}
                    {new Date(order.out_for_delivery_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No driver currently assigned. Click &ldquo;Assign Driver&rdquo; above to dispatch.
              </p>
            )}
          </div>

          {/* Payment Details Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Payment Information
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="capitalize font-semibold text-foreground">
                  {order.payment_method.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <PaymentStatusBadge status={order.payment_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold font-mono text-foreground">
                  <CurrencyDisplay amount={order.total_amount} />
                </span>
              </div>
            </div>
          </div>

          {/* Internal Staff Notes */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <OrderNotesPanel orderId={order.id} notes={order.notes} />
          </div>
        </div>
      </div>
    </div>
  )
}
