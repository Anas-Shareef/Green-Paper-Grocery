import { Suspense } from 'react'
import { getSuppliers } from '@/lib/services/suppliers'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { SupplierTable } from '@/components/admin/suppliers/SupplierTable'
import { Building2, ShoppingBag, Receipt } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: 'all' | 'active' | 'archived'
    terms?: string
    page?: string
  }>
}

export default async function AdminSuppliersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1', 10)

  const result = await getSuppliers({
    search: resolvedParams.search,
    status: resolvedParams.status,
    paymentTerms: resolvedParams.terms,
    page,
    limit: 20,
  })

  // Calculate summary metrics across the current view
  let totalPurchasesSum = 0
  let totalOutstandingSum = 0
  for (const s of result.suppliers) {
    totalPurchasesSum += s.financialSummary.totalPurchases
    totalOutstandingSum += s.financialSummary.outstandingBalance
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Suppliers & Wholesalers"
        description="Wholesale vendor directory, credit limits, payment terms, and delivery history for Zone 19 operations."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Suppliers' }]}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Suppliers"
          value={result.total.toString()}
          subtitle="Registered wholesale partners"
          icon={Building2}
          iconColor="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
        />

        <StatCard
          title="Total Purchases Value"
          value={<CurrencyDisplay amount={totalPurchasesSum} />}
          subtitle="Acquisition spend across listed suppliers"
          icon={ShoppingBag}
          iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
        />

        <StatCard
          title="Outstanding Payables"
          value={<CurrencyDisplay amount={totalOutstandingSum} />}
          subtitle="Total supplier invoices payable"
          icon={Receipt}
          iconColor={
            totalOutstandingSum > 0
              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
              : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
          }
        />
      </div>

      {/* Supplier List Table & Actions */}
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading suppliers...</div>}>
        <SupplierTable
          suppliers={result.suppliers}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  )
}
