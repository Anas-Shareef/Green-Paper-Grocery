import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { ShoppingBag, Clock, CheckCircle, Package } from 'lucide-react'
import type { Order, OrderItem, Customer } from '@/types/database.types'

interface OrderWithDetails extends Order {
  customer: Pick<Customer, 'id' | 'name' | 'mobile'> | null
  order_items: Pick<OrderItem, 'id' | 'quantity'>[]
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
  }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers(id, name, mobile),
      order_items(id, quantity)
    `)
    .order('order_date', { ascending: false })

  if (resolvedParams.status && resolvedParams.status !== 'all') {
    query = query.eq(
      'status',
      resolvedParams.status as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned'
    )
  }

  if (resolvedParams.search?.trim()) {
    query = query.or(
      `order_number.ilike.%${resolvedParams.search.trim()}%,delivery_address.ilike.%${resolvedParams.search.trim()}%`
    )
  }

  const { data: rawOrders } = await query
  const orders = (rawOrders as unknown as OrderWithDetails[]) || []

  // KPI calculations
  let totalSales = 0
  let pendingCount = 0
  let deliveredCount = 0

  for (const o of orders) {
    if (o.status !== 'cancelled') {
      totalSales += Number(o.total_amount) || 0
    }
    if (o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing') {
      pendingCount++
    }
    if (o.status === 'delivered') {
      deliveredCount++
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders Processing"
        description="Fulfillment queue for customer website and multi-channel grocery orders in Zone 19."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingBag}
          subtitle="Website & customer orders"
        />
        <StatCard
          title="Pending Fulfillment"
          value={pendingCount}
          icon={Clock}
          subtitle="Awaiting prep / dispatch"
        />
        <StatCard
          title="Delivered Orders"
          value={deliveredCount}
          icon={CheckCircle}
          subtitle="Successfully fulfilled"
        />
        <StatCard
          title="Orders Revenue"
          value={<CurrencyDisplay amount={totalSales} />}
          icon={Package}
          subtitle="Net order sales volume"
        />
      </div>

      {/* Orders Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Delivery Area</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {ord.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground block">
                        {ord.customer?.name || 'Customer'}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {ord.customer?.mobile || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                      {ord.delivery_address}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {ord.order_items?.length || 0} items
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-muted-foreground block font-medium">
                        {ord.payment_method.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          ord.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <CurrencyDisplay amount={ord.total_amount} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(ord.order_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No Customer Orders Yet"
              description="Customer website orders placed through the storefront catalog and checkout will appear here in real time."
              icon={ShoppingBag}
            />
          </div>
        )}
      </div>
    </div>
  )
}
