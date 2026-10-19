import React from 'react'
import { getReportsData } from '@/lib/services/reports'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ReportsClient } from './ReportsClient'

export const metadata = {
  title: 'Financial & Operational Reports | Baqqala Admin',
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all'
  }>
}) {
  const resolvedParams = await searchParams
  const range = resolvedParams.range || 'this_month'

  const data = await getReportsData({ range })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Financial & Operational Analytics"
        description="Daily sales, order fulfillment metrics, operational expense breakdowns, and inventory valuation."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reports' }]}
      />

      <ReportsClient data={data} currentRange={range} />
    </div>
  )
}
