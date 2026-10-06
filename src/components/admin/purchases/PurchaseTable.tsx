'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Truck,
  Search,
  ChevronRight,
  PackageCheck,
  Send,
  XCircle,
  AlertTriangle,
  Plus,
  Calendar,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { EmptyState } from '@/components/admin/EmptyState'
import { orderPurchaseAction, cancelPurchaseAction } from '@/app/admin/purchases/actions'
import type { PurchaseWithSupplier } from '@/lib/services/purchases'

interface PurchaseTableProps {
  purchases: PurchaseWithSupplier[]
  total: number
  page: number
  totalPages: number
}

const PURCHASE_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function PurchaseTable({ purchases, total, page, totalPages }: PurchaseTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [orderingPurchaseId, setOrderingPurchaseId] = useState<string | null>(null)
  const [cancellingPurchaseId, setCancellingPurchaseId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const currentStatus = searchParams.get('status') || 'all'
  const currentInvoiceStatus = searchParams.get('invoiceStatus') || 'all'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/purchases?${params.toString()}`)
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set('page', '1')
    router.push(`/admin/purchases?${params.toString()}`)
  }

  const handleConfirmOrder = async () => {
    if (!orderingPurchaseId) return
    setActionLoading(true)
    try {
      await orderPurchaseAction(orderingPurchaseId)
      setOrderingPurchaseId(null)
      router.refresh()
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancellingPurchaseId) return
    setActionLoading(true)
    try {
      await cancelPurchaseAction(cancellingPurchaseId, cancelReason)
      setCancellingPurchaseId(null)
      setCancelReason('')
      router.refresh()
    } finally {
      setActionLoading(false)
    }
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
              placeholder="Search PO number or external reference..."
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-9">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Dropdown */}
          <select
            value={currentStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PURCHASE_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Invoice Status Dropdown */}
          <select
            value={currentInvoiceStatus}
            onChange={(e) => handleFilterChange('invoiceStatus', e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Invoicing</option>
            <option value="unbilled">Unbilled</option>
            <option value="partially_billed">Partially Billed</option>
            <option value="billed">Billed</option>
          </select>

          <Link href="/admin/purchases/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shrink-0 inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New PO
            </Button>
          </Link>
        </div>
      </div>

      {/* Table / Empty State */}
      {purchases.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12">
          <EmptyState
            title="No purchase orders found"
            description={
              search
                ? `No purchases matched your search query "${search}". Try adjusting your filters.`
                : 'No purchase records match the selected status filter.'
            }
            icon={Truck}
            action={
              <Link href="/admin/purchases/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create First Purchase Order
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4 text-center">Receiving Progress</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Invoicing</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map((po) => {
                    const ordered = po.total_ordered_qty || 0
                    const received = po.total_received_qty || 0
                    const isDraft = po.status === 'draft'
                    const canReceive = po.status === 'ordered' || po.status === 'partially_received'
                    const canCancel = po.status === 'draft' || po.status === 'ordered'

                    return (
                      <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                        {/* PO Number */}
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                          <Link
                            href={`/admin/purchases/${po.id}`}
                            className="font-semibold text-foreground hover:text-emerald-600 transition-colors block"
                          >
                            {po.purchase_number}
                          </Link>
                          {po.invoice_number && po.invoice_number !== po.purchase_number && (
                            <span className="text-[11px] text-muted-foreground font-sans">
                              Ref: {po.invoice_number}
                            </span>
                          )}
                        </td>

                        {/* Supplier */}
                        <td className="py-3.5 px-4">
                          {po.supplier ? (
                            <Link
                              href={`/admin/suppliers/${po.supplier.id}`}
                              className="font-medium text-foreground hover:text-emerald-600 transition-colors block"
                            >
                              {po.supplier.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Unknown Supplier</span>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">
                            {po.supplier?.supplier_code || 'SUP'}
                          </span>
                        </td>

                        {/* Order Date */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 text-foreground">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {po.purchase_date}
                          </div>
                          {po.expected_delivery_date && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Exp: {po.expected_delivery_date}
                            </div>
                          )}
                        </td>

                        {/* Receiving Progress */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-block text-xs">
                            <span className="font-semibold text-foreground">{received}</span>
                            <span className="text-muted-foreground"> / {ordered} units</span>
                            <div className="w-20 bg-muted rounded-full h-1.5 mt-1 overflow-hidden mx-auto">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 text-right font-bold text-foreground">
                          <CurrencyDisplay amount={po.total_amount} />
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={po.status} />
                        </td>

                        {/* Invoice Status */}
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={po.invoice_status} />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canReceive && (
                              <Link
                                href={`/admin/purchases/${po.id}/receive`}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-xs transition-colors"
                                title="Receive physical stock (GRN)"
                              >
                                <PackageCheck className="h-3.5 w-3.5" /> Receive
                              </Link>
                            )}

                            {isDraft && (
                              <button
                                onClick={() => setOrderingPurchaseId(po.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1 shadow-xs transition-colors"
                                title="Order PO"
                              >
                                <Send className="h-3.5 w-3.5" /> Order
                              </button>
                            )}

                            <Link
                              href={`/admin/purchases/${po.id}`}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="View PO Details"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>

                            {canCancel && (
                              <button
                                onClick={() => setCancellingPurchaseId(po.id)}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-rose-600 transition-colors"
                                title="Cancel PO"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-3">
            {purchases.map((po) => {
              const ordered = po.total_ordered_qty || 0
              const received = po.total_received_qty || 0
              const canReceive = po.status === 'ordered' || po.status === 'partially_received'

              return (
                <div
                  key={po.id}
                  className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {po.purchase_number}
                      </span>
                      <h4 className="font-semibold text-sm text-foreground mt-0.5">
                        {po.supplier?.name || 'Unknown Supplier'}
                      </h4>
                      <p className="text-xs text-muted-foreground">Order Date: {po.purchase_date}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <StatusBadge status={po.status} />
                      <div>
                        <StatusBadge status={po.invoice_status} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                    <div>
                      <span className="text-muted-foreground">Total Value:</span>
                      <p className="font-bold text-foreground">
                        <CurrencyDisplay amount={po.total_amount} />
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Received Progress:</span>
                      <p className="font-medium text-foreground">
                        {received} / {ordered} units
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    {canReceive ? (
                      <Link
                        href={`/admin/purchases/${po.id}/receive`}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
                      >
                        <PackageCheck className="h-3.5 w-3.5" /> Receive GRN
                      </Link>
                    ) : (
                      <span />
                    )}

                    <Link
                      href={`/admin/purchases/${po.id}`}
                      className="px-3 py-1.5 text-xs border border-border font-medium rounded-lg inline-flex items-center gap-1 text-foreground"
                    >
                      Workspace <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-2">
              <span>
                Showing page {page} of {totalPages} ({total} purchases total)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', (page - 1).toString())
                    router.push(`/admin/purchases?${params.toString()}`)
                  }}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', (page + 1).toString())
                    router.push(`/admin/purchases?${params.toString()}`)
                  }}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Place Order Confirmation Modal */}
      {orderingPurchaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Place Purchase Order?</h3>
                <p className="text-xs text-muted-foreground">Transition from Draft to Ordered</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Placing this order commits the purchase record and notifies receiving personnel.
              Inventory will <strong className="text-foreground">NOT</strong> be increased until
              physical goods are received via a Goods Received Note (GRN).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderingPurchaseId(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmOrder}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? 'Ordering...' : 'Confirm Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel PO Confirmation Modal */}
      {cancellingPurchaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Cancel Purchase Order?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Cancellation Reason</label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Supplier out of stock, duplicate order..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingPurchaseId(null)}
                disabled={actionLoading}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
