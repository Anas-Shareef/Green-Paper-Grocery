import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { getCustomerOrderById } from '@/lib/services/customerStore'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  ShoppingBag,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Order Confirmed! | Baqqala Grocery',
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const { id } = await params
  const order = await getCustomerOrderById(id)

  if (!order) {
    notFound()
  }

  return (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-in zoom-in">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your grocery order has been received and is being prepared for express delivery across Zone 19, Abu Dhabi.
          </p>
        </div>

        {/* Order Receipt Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Order Reference
              </span>
              <span className="text-xl font-black font-mono text-foreground">
                {order.order_number}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Date & Time
              </span>
              <span className="text-xs font-semibold text-foreground">
                {new Date(order.order_date).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Delivery & Payment Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Delivery Address (Zone 19)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-5">
                {order.delivery_address}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Payment</span>
              </div>
              <p className="text-muted-foreground pl-5 capitalize">
                {order.payment_method.replace('_', ' ')} • {order.payment_status}
              </p>
            </div>
          </div>

          {/* Purchased Items Snapshot */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground">Items in this Order ({order.items.length})</h3>
            <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {order.items.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{item.product_name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.quantity} × <CurrencyDisplay amount={item.selling_price} />
                    </span>
                  </div>
                  <CurrencyDisplay
                    amount={item.total_amount}
                    className="font-bold text-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="rounded-2xl bg-muted/30 border border-border p-4 space-y-2 text-xs">
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
              <span className="font-bold text-sm text-foreground">Grand Total</span>
              <CurrencyDisplay
                amount={order.total_amount}
                className="text-xl font-black text-emerald-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href={`/account/orders/${order.id}`} className="flex-1">
              <Button variant="outline" className="w-full h-11 text-xs font-bold rounded-xl">
                <Package className="h-4 w-4 mr-1.5" /> View Order Status
              </Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                <ShoppingBag className="h-4 w-4 mr-1.5" /> Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
