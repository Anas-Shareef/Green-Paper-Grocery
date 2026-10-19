import React from 'react'
import { getAdminCustomers } from '@/lib/services/customers'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CustomerTable } from '@/components/admin/customers/CustomerTable'
import { Users, UserCheck, Star, ShoppingCart } from 'lucide-react'

export const metadata = {
  title: 'Customer Directory & CRM | Baqqala Admin',
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    segment?: string
    zone?: string
    page?: string
  }>
}) {
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ''
  const segment = resolvedParams.segment || 'all'
  const zone = resolvedParams.zone || 'all'
  const page = Number(resolvedParams.page) || 1

  const { customers, total } = await getAdminCustomers({
    search,
    segment,
    zone,
    page,
    limit: 25,
  })

  // Derive summary metrics
  const totalSpendSum = customers.reduce((acc, c) => acc + (Number(c.total_spend) || 0), 0)
  const regularOrVipCount = customers.filter(
    (c) => c.customer_segment === 'regular' || c.customer_segment === 'vip'
  ).length
  const zone19Count = customers.filter((c) => !c.zone || c.zone.toLowerCase().includes('zone 19')).length

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Management & Segments"
        description="Verified customer directory with Abu Dhabi Zone 19 delivery addresses, WhatsApp integration, and lifetime value tracking."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Customers' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            Total Customers
          </span>
          <p className="text-2xl font-black text-foreground">{total}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            Zone 19 Residents
          </span>
          <p className="text-2xl font-black text-foreground">{zone19Count}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-600" />
            Regular / VIP Customers
          </span>
          <p className="text-2xl font-black text-foreground">{regularOrVipCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5 text-purple-600" />
            Tracked Lifetime Spend
          </span>
          <p className="text-2xl font-black text-foreground">AED {Math.round(totalSpendSum)}</p>
        </div>
      </div>

      <CustomerTable
        customers={customers}
        total={total}
        page={page}
        limit={25}
        currentSearch={search}
        currentSegment={segment}
      />
    </div>
  )
}
