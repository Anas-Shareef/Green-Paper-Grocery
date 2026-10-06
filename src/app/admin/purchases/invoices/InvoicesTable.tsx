'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Receipt,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { EmptyState } from '@/components/admin/EmptyState'
import { SupplierPaymentDialog } from '@/components/admin/suppliers/SupplierPaymentDialog'
import type { SupplierInvoice, Supplier } from '@/types/database.types'

export interface InvoiceWithDetails extends SupplierInvoice {
  supplier: Pick<Supplier, 'id' | 'name' | 'supplier_code' | 'phone'> | null
  purchase?: { id: string; purchase_number: string } | null
}

interface InvoicesTableProps {
  invoices: InvoiceWithDetails[]
  total?: number
}

const INVOICE_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const currentStatus = searchParams.get('status') || 'all'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }
    router.push(`/admin/purchases/invoices?${params.toString()}`)
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    router.push(`/admin/purchases/invoices?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-xs">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number or supplier name..."
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-9">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            {INVOICE_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List / Empty State */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12">
          <EmptyState
            title="No supplier invoices found"
            description={
              search
                ? `No supplier invoices match "${search}".`
                : 'No invoices have been logged yet for the selected filter.'
            }
            icon={Receipt}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Purchase Order</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.supplier ? (
                        <Link
                          href={`/admin/suppliers/${inv.supplier.id}`}
                          className="font-medium text-foreground hover:text-emerald-600 transition-colors"
                        >
                          {inv.supplier.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {inv.purchase ? (
                        <Link
                          href={`/admin/purchases/${inv.purchase.id}`}
                          className="text-foreground hover:text-emerald-600 hover:underline"
                        >
                          {inv.purchase.purchase_number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Direct Bill</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{inv.invoice_date}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{inv.due_date}</td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      <CurrencyDisplay amount={inv.total_amount} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      <CurrencyDisplay amount={inv.paid_amount} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-700 dark:text-amber-400">
                      <CurrencyDisplay amount={inv.outstanding_amount} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {Number(inv.outstanding_amount) > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setPaymentDialogOpen(true)
                          }}
                          className="h-7 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentDialogOpen && selectedInvoice && (
        <SupplierPaymentDialog
          supplierId={selectedInvoice.supplier_id}
          supplierName={selectedInvoice.supplier?.name || 'Supplier'}
          invoice={selectedInvoice}
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false)
            setSelectedInvoice(null)
          }}
        />
      )}
    </div>
  )
}
