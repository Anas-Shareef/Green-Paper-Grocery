import { Suspense } from 'react'
import Link from 'next/link'
import { getPurchases } from '@/lib/services/purchases'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { PurchaseTable } from '@/components/admin/purchases/PurchaseTable'
import { Button } from '@/components/ui/button'
import { Truck, Plus, PackageCheck, Clock, Receipt } from 'lucide-react'
import type { PurchaseStatus, PaymentStatus } from '@/types/database.types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    supplierId?: string
    status?: string
    invoiceStatus?: string
    paymentStatus?: string
    page?: string
  }>
}

export default async function AdminPurchasesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1', 10)

  const result = await getPurchases({
    search: resolvedParams.search,
    supplierId: resolvedParams.supplierId,
    status: (resolvedParams.status as PurchaseStatus | 'all') || 'all',
    invoiceStatus: (resolvedParams.invoiceStatus as 'unbilled' | 'partially_billed' | 'billed' | 'all') || 'all',
    paymentStatus: (resolvedParams.paymentStatus as PaymentStatus | 'all') || 'all',
    page,
    limit: 20,
  })

  // Calculate summary metrics across view
  let totalPurchasesSum = 0
  let pendingReceivingCount = 0
  let fullyReceivedCount = 0

  for (const p of result.purchases) {
    if (p.status !== 'cancelled') {
      totalPurchasesSum += Number(p.total_amount) || 0
    }
    if (p.status === 'ordered' || p.status === 'partially_received') {
      pendingReceivingCount += 1
    }
    if (p.status === 'received' || p.status === 'closed') {
      fullyReceivedCount += 1
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Purchases & Vendor Orders"
        description="Wholesale procurement orders, supplier deliveries, receiving notes, and inventory replenishment."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Purchases' }]}
        actions={
          <Link href="/admin/purchases/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Purchase Order
            </Button>
          </Link>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Purchase Orders"
          value={result.total.toString()}
          subtitle="Procurement orders recorded"
          icon={Truck}
          iconColor="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
        />

        <StatCard
          title="Total Spend / Commitments"
          value={<CurrencyDisplay amount={totalPurchasesSum} />}
          subtitle="Combined purchase value"
          icon={Receipt}
          iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
        />

        <StatCard
          title="Pending Receivings / GRN"
          value={pendingReceivingCount.toString()}
          subtitle="Awaiting physical stock delivery"
          icon={Clock}
          iconColor={
            pendingReceivingCount > 0
              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
              : 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800'
          }
        />

        <StatCard
          title="Fully Received Orders"
          value={fullyReceivedCount.toString()}
          subtitle="Inventory successfully added"
          icon={PackageCheck}
          iconColor="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40"
        />
      </div>

      {/* Main Purchases Table & Filters */}
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading purchases...</div>}>
        <PurchaseTable
          purchases={result.purchases}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  )
}
