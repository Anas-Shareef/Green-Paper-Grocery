import React from 'react'
import Link from 'next/link'
import { getCustomerOrders } from '@/lib/services/customerStore'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { Package, Clock } from 'lucide-react'

export const metadata = {
  title: 'Order History | My Account',
}

export default async function CustomerOrdersPage() {
  const orders = await getCustomerOrders()

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">My Order History</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track and review all your previous grocery orders in Zone 19
        </p>
      </div>

      {orders.length > 0 ? (
        <div className="divide-y divide-border">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-sm text-foreground">
                    {ord.order_number}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ord.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : ord.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(ord.order_date).toLocaleString()}</span>
                  </div>
                  <span>•</span>
                  <span>{ord.items.length} items</span>
                  <span>•</span>
                  <span className="capitalize">{ord.payment_method.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5">
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Total Amount</span>
                  <CurrencyDisplay
                    amount={ord.total_amount}
                    className="font-bold text-base text-foreground"
                  />
                </div>

                <Link href={`/account/orders/${ord.id}`}>
                  <Button variant="outline" size="sm" className="h-9 text-xs font-semibold rounded-xl">
                    Order Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-muted-foreground space-y-3">
          <Package className="h-10 w-10 mx-auto opacity-30" />
          <p>You haven&apos;t placed any orders with us yet.</p>
          <Link href="/shop">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Browse Grocery Catalog
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
