import React from 'react'
import Link from 'next/link'
import { getAdminOrders, getActiveDeliveryDrivers } from '@/lib/services/orders'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge'
import {
  Truck,
  Sparkles,
  UserCheck,
  CheckCheck,
  AlertTriangle,
  ArrowRight,
  Phone,
  MapPin,
} from 'lucide-react'

export const metadata = {
  title: 'Delivery Operations Dashboard | Admin',
  description: 'Manage Zone 19 delivery drivers, active dispatch, and completion tracking.',
}

export default async function AdminDeliveriesPage() {
  const [{ orders, kpis }, drivers] = await Promise.all([
    getAdminOrders({ pageSize: 100 }),
    getActiveDeliveryDrivers(),
  ])

  // Filter deliveries by bucket
  const readyOrders = orders.filter((o) => o.status === 'ready')
  const outForDeliveryOrders = orders.filter((o) => o.status === 'out_for_delivery')
  const failedDeliveries = orders.filter((o) => o.status === 'failed_delivery')

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Delivery Operations Board"
        description="Active dispatch center for Zone 19, Abu Dhabi express grocery deliveries."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Deliveries' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Ready for Driver"
          value={readyOrders.length}
          icon={Sparkles}
          subtitle="Packed & awaiting dispatch"
        />
        <StatCard
          title="Active on Road"
          value={outForDeliveryOrders.length}
          icon={Truck}
          subtitle="Currently out for delivery"
        />
        <StatCard
          title="Delivered Today"
          value={kpis.deliveredToday}
          icon={CheckCheck}
          subtitle="Successfully fulfilled"
        />
        <StatCard
          title="Delivery Issues"
          value={failedDeliveries.length}
          icon={AlertTriangle}
          subtitle="Exceptions needing contact"
        />
      </div>

      {/* Active Drivers Overview */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Active Delivery Personnel (Zone 19)
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {drivers.length} drivers available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-foreground text-xs block">
                  {driver.full_name}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {driver.phone || 'No phone'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  driver.activeDeliveriesCount > 0
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {driver.activeDeliveriesCount} active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ready For Dispatch Queue */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              Orders Ready for Driver Assignment ({readyOrders.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Packed grocery orders ready to hand over to Zone 19 delivery drivers.
            </p>
          </div>
        </div>

        {readyOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            No orders are currently waiting for driver dispatch.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {ord.order_number}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-foreground block">
                      {ord.recipient_name || ord.customer?.name || 'Customer'}
                    </span>
                    <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{ord.delivery_address}</span>
                    </p>
                    {ord.delivery_notes && (
                      <p className="text-[10px] text-amber-600 italic">
                        Note: &ldquo;{ord.delivery_notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <span className="font-bold font-mono text-foreground">
                    <CurrencyDisplay amount={ord.total_amount} />
                  </span>

                  <Link
                    href={`/admin/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                  >
                    Assign Driver
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* On The Road / Active Dispatch */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-600" />
              Active On-Road Deliveries ({outForDeliveryOrders.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live orders in transit with assigned drivers.
            </p>
          </div>
        </div>

        {outForDeliveryOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            No deliveries are currently out on the road.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outForDeliveryOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/10 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {ord.order_number}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Driver: {ord.driver?.full_name || 'Assigned'}</span>
                    </div>

                    <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{ord.delivery_address}</span>
                    </p>

                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Phone className="h-3 w-3" />
                      {ord.recipient_phone || ord.customer?.mobile || 'No phone'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <span className="font-bold font-mono text-foreground">
                    <CurrencyDisplay amount={ord.total_amount} />
                  </span>

                  <Link
                    href={`/admin/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
                  >
                    View Status
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
