import React from 'react'
import { getAdminOrders } from '@/lib/services/orders'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { OrderFilters } from '@/components/admin/orders/OrderFilters'
import { OrderTable } from '@/components/admin/orders/OrderTable'
import { Clock, Package, Sparkles, Truck, CheckCircle2, DollarSign } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    status?: string
    paymentStatus?: string
    search?: string
    dateRange?: 'all' | 'today' | 'yesterday' | 'week' | 'month'
    page?: string
  }>
}

export const metadata = {
  title: 'Orders & Fulfillment Operations | Admin',
  description: 'Manage grocery orders lifecycle, packing, and Zone 19 deliveries.',
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const currentPage = parseInt(resolvedParams.page || '1', 10)

  const { orders, totalCount, kpis } = await getAdminOrders({
    status: resolvedParams.status,
    paymentStatus: resolvedParams.paymentStatus,
    search: resolvedParams.search,
    dateRange: resolvedParams.dateRange,
    page: currentPage,
    pageSize: 25,
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders & Fulfillment Queue"
        description={`Live operational queue for customer orders (${totalCount} in list), picking, packing, and Zone 19 express deliveries.`}
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders' }]}
      />

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Pending"
          value={kpis.pendingOrders}
          icon={Clock}
          subtitle="Needs confirmation"
        />
        <StatCard
          title="Preparing"
          value={kpis.preparingOrders}
          icon={Package}
          subtitle="Being packed"
        />
        <StatCard
          title="Ready"
          value={kpis.readyOrders}
          icon={Sparkles}
          subtitle="Awaiting driver"
        />
        <StatCard
          title="Out for Delivery"
          value={kpis.outForDeliveryOrders}
          icon={Truck}
          subtitle="On the road"
        />
        <StatCard
          title="Delivered Today"
          value={kpis.deliveredToday}
          icon={CheckCircle2}
          subtitle="Completed today"
        />
        <StatCard
          title="Today's Sales"
          value={<CurrencyDisplay amount={kpis.todayRevenue} />}
          icon={DollarSign}
          subtitle="Delivered orders"
        />
      </div>

      {/* Filter Tabs & Search */}
      <OrderFilters
        currentStatus={resolvedParams.status}
        currentPaymentStatus={resolvedParams.paymentStatus}
        currentDateRange={resolvedParams.dateRange}
        currentSearch={resolvedParams.search}
        kpis={kpis}
      />

      {/* Orders Table */}
      <OrderTable orders={orders} />
    </div>
  )
}
