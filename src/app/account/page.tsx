import React from 'react'
import Link from 'next/link'
import {
  getOrCreateCurrentCustomer,
  getCustomerOrders,
  getCustomerAddresses,
} from '@/lib/services/customerStore'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import {
  Package,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react'

export const metadata = {
  title: 'My Account Dashboard',
}

export default async function AccountOverviewPage() {
  const [customer, orders, addresses] = await Promise.all([
    getOrCreateCurrentCustomer(),
    getCustomerOrders(),
    getCustomerAddresses(),
  ])

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0]
  const recentOrders = orders.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Orders Placed
          </span>
          <div className="text-2xl font-black text-foreground">
            {customer?.total_orders || orders.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Lifetime Zone 19 orders</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Spend
          </span>
          <div className="text-2xl font-black text-emerald-600">
            <CurrencyDisplay amount={customer?.total_spend || 0} />
          </div>
          <p className="text-[11px] text-muted-foreground">Total grocery spend in AED</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Customer Status
          </span>
          <div className="text-2xl font-black capitalize text-foreground">
            {customer?.customer_segment || 'New Customer'}
          </div>
          <p className="text-[11px] text-muted-foreground">Baqqala neighborhood member</p>
        </div>
      </div>

      {/* Default Address Shortcut Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-foreground">Primary Delivery Address</h3>
            {defaultAddress ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {defaultAddress.building_or_villa}, {defaultAddress.street}, {defaultAddress.area}, {defaultAddress.city}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No delivery address saved yet. Save an address for 1-click checkout.
              </p>
            )}
          </div>
        </div>

        <Link href="/account/addresses">
          <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl shrink-0">
            {defaultAddress ? 'Manage Addresses' : 'Add Delivery Address'}
          </Button>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-base text-foreground">Recent Orders</h2>
          </div>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All ({orders.length}) <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-border">
            {recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-foreground">
                      {ord.order_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {ord.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(ord.order_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{ord.items.length} items</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <CurrencyDisplay
                    amount={ord.total_amount}
                    className="font-bold text-sm text-foreground"
                  />
                  <Link href={`/account/orders/${ord.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-3">
            <p>You haven&apos;t placed any grocery orders yet.</p>
            <Link href="/shop">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Start Shopping Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
