import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { RotateCcw, CheckCircle, Clock } from 'lucide-react'
import type { SupplierReturn, Supplier } from '@/types/database.types'

interface ReturnWithDetails extends SupplierReturn {
  supplier: Pick<Supplier, 'id' | 'name' | 'supplier_code'> | null
  purchase: { id: string; purchase_number: string } | null
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminReturnsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('supplier_returns')
    .select(`
      *,
      supplier:suppliers(id, name, supplier_code),
      purchase:purchases(id, purchase_number)
    `)
    .order('created_at', { ascending: false })

  if (resolvedParams.status && resolvedParams.status !== 'all') {
    query = query.eq('status', resolvedParams.status as 'draft' | 'requested' | 'approved' | 'completed' | 'rejected' | 'cancelled')
  }

  const { data: rawReturns } = await query
  const returns = (rawReturns as ReturnWithDetails[]) || []

  let totalCreditValue = 0
  let completedCount = 0
  let pendingCount = 0

  for (const r of returns) {
    totalCreditValue += Number(r.total_amount) || 0
    if (r.status === 'completed') {
      completedCount += 1
    } else if (r.status === 'draft' || r.status === 'requested') {
      pendingCount += 1
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Supplier Returns & Credit Notes"
        description="Damaged, expired, and rejected stock returned to vendors with immutable ledger adjustments."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Purchases', href: '/admin/purchases' },
          { label: 'Returns' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Credit Generated"
          value={<CurrencyDisplay amount={totalCreditValue} />}
          subtitle={`${returns.length} return records`}
          icon={RotateCcw}
          iconColor="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
        />

        <StatCard
          title="Completed & Stock Deducted"
          value={completedCount.toString()}
          subtitle="Inventory balance updated"
          icon={CheckCircle}
          iconColor="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
        />

        <StatCard
          title="Pending Processing"
          value={pendingCount.toString()}
          subtitle="Awaiting final completion"
          icon={Clock}
          iconColor={
            pendingCount > 0
              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
              : 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800'
          }
        />
      </div>

      {returns.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12">
          <EmptyState
            title="No supplier returns recorded"
            description="Returns are initiated from a Purchase Order workspace when goods arrive damaged or expired."
            icon={RotateCcw}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Return #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Credit Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {ret.return_number}
                    </td>
                    <td className="py-3.5 px-4">
                      {ret.supplier ? (
                        <Link
                          href={`/admin/suppliers/${ret.supplier.id}`}
                          className="font-medium text-foreground hover:text-emerald-600 transition-colors"
                        >
                          {ret.supplier.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {ret.purchase ? (
                        <Link
                          href={`/admin/purchases/${ret.purchase.id}`}
                          className="text-foreground hover:text-emerald-600 hover:underline"
                        >
                          {ret.purchase.purchase_number}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-foreground">
                      {ret.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-foreground">
                      <CurrencyDisplay amount={ret.total_amount} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={ret.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground text-right">
                      {new Date(ret.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ret.purchase && (
                        <Link
                          href={`/admin/purchases/${ret.purchase.id}`}
                          className="text-xs text-emerald-600 hover:underline font-medium"
                        >
                          View PO
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
