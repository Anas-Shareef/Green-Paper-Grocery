import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { InvoicesTable, type InvoiceWithDetails } from './InvoicesTable'
import { Receipt, DollarSign, Clock, AlertTriangle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function AdminInvoicesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('supplier_invoices')
    .select(`
      *,
      supplier:suppliers(id, name, supplier_code, phone),
      purchase:purchases(id, purchase_number)
    `)
    .order('invoice_date', { ascending: false })

  if (resolvedParams.status && resolvedParams.status !== 'all') {
    query = query.eq('status', resolvedParams.status as 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled')
  }

  if (resolvedParams.search?.trim()) {
    query = query.ilike('invoice_number', `%${resolvedParams.search.trim()}%`)
  }

  const { data: rawInvoices } = await query

  const invoices = (rawInvoices as InvoiceWithDetails[]) || []

  // KPI summaries
  let totalInvoiced = 0
  let totalPaid = 0
  let totalOutstanding = 0
  let overdueCount = 0
  const todayStr = new Date().toISOString().split('T')[0]

  for (const inv of invoices) {
    if (inv.status !== 'cancelled') {
      totalInvoiced += Number(inv.total_amount) || 0
      totalPaid += Number(inv.paid_amount) || 0
      totalOutstanding += Number(inv.outstanding_amount) || 0
      if (inv.status === 'overdue' || (inv.due_date < todayStr && Number(inv.outstanding_amount) > 0)) {
        overdueCount += 1
      }
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Supplier Invoices & Payables"
        description="Vendor billing statements, payment terms, and invoice settlement ledger."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Purchases', href: '/admin/purchases' },
          { label: 'Invoices' },
        ]}
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoiced"
          value={<CurrencyDisplay amount={totalInvoiced} />}
          subtitle={`${invoices.length} invoices recorded`}
          icon={Receipt}
          iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
        />

        <StatCard
          title="Total Paid"
          value={<CurrencyDisplay amount={totalPaid} />}
          subtitle="Settled via bank, cheque, or cash"
          icon={DollarSign}
          iconColor="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
        />

        <StatCard
          title="Outstanding Payables"
          value={<CurrencyDisplay amount={totalOutstanding} />}
          subtitle="Net liabilities due to suppliers"
          icon={Clock}
          iconColor={
            totalOutstanding > 0
              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
              : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
          }
        />

        <StatCard
          title="Overdue Invoices"
          value={overdueCount.toString()}
          subtitle="Past agreed payment terms"
          icon={AlertTriangle}
          iconColor={
            overdueCount > 0
              ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
              : 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800'
          }
        />
      </div>

      <InvoicesTable invoices={invoices} total={invoices.length} />
    </div>
  )
}
