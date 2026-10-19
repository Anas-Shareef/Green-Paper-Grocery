import React from 'react'
import { getExpenses } from '@/lib/services/expenses'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ExpenseTable } from '@/components/admin/expenses/ExpenseTable'
import { Receipt, Fuel, Briefcase, DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Operating Expenses | Baqqala Admin',
}

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    paymentMethod?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
}) {
  const resolvedParams = await searchParams
  const category = resolvedParams.category || 'all'
  const paymentMethod = resolvedParams.paymentMethod || 'all'
  const dateFrom = resolvedParams.dateFrom
  const dateTo = resolvedParams.dateTo
  const page = Number(resolvedParams.page) || 1

  const { expenses, total, totalAmount } = await getExpenses({
    category,
    paymentMethod,
    dateFrom,
    dateTo,
    page,
    limit: 30,
  })

  // Quick category aggregates
  const deliveryFuelSum = expenses
    .filter((e) => e.category === 'delivery_fuel')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0)

  const packagingSum = expenses
    .filter((e) => e.category === 'packaging')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operating Expenses Ledger"
        description="Delivery fuel, bike maintenance, packaging materials, and store overhead tracking."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Expenses' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            Total Logged Expenses
          </span>
          <p className="text-2xl font-black text-foreground">AED {Math.round(totalAmount)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-blue-600" />
            Total Transactions
          </span>
          <p className="text-2xl font-black text-foreground">{total}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5 text-amber-600" />
            Delivery Fuel & Fleet
          </span>
          <p className="text-2xl font-black text-foreground">AED {Math.round(deliveryFuelSum)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-purple-600" />
            Packaging & Supplies
          </span>
          <p className="text-2xl font-black text-foreground">AED {Math.round(packagingSum)}</p>
        </div>
      </div>

      <ExpenseTable
        expenses={expenses}
        total={total}
        totalAmount={totalAmount}
        page={page}
        limit={30}
        currentCategory={category}
      />
    </div>
  )
}
