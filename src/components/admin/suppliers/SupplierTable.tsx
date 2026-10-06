'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Search,
  Phone,
  MessageCircle,
  Edit2,
  Archive,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { EmptyState } from '@/components/admin/EmptyState'
import { SupplierFormDialog } from './SupplierFormDialog'
import { archiveSupplierAction, restoreSupplierAction } from '@/app/admin/suppliers/actions'
import type { SupplierWithMetrics } from '@/lib/services/suppliers'
import type { Supplier } from '@/types/database.types'

interface SupplierTableProps {
  suppliers: SupplierWithMetrics[]
  total: number
  page: number
  totalPages: number
}

export function SupplierTable({ suppliers, total, page, totalPages }: SupplierTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [archivingSupplier, setArchivingSupplier] = useState<SupplierWithMetrics | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const currentStatus = searchParams.get('status') || 'active'
  const currentTerms = searchParams.get('terms') || 'all'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/suppliers?${params.toString()}`)
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set('page', '1')
    router.push(`/admin/suppliers?${params.toString()}`)
  }

  const handleArchiveConfirm = async () => {
    if (!archivingSupplier) return
    setActionLoading(true)
    try {
      if (archivingSupplier.is_active) {
        await archiveSupplierAction(archivingSupplier.id)
      } else {
        await restoreSupplierAction(archivingSupplier.id)
      }
      setArchivingSupplier(null)
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
              placeholder="Search by supplier name, code, contact, or phone..."
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-9">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <div className="flex rounded-lg border border-border p-0.5 bg-muted/40 shrink-0">
            <button
              onClick={() => handleFilterChange('status', 'active')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                currentStatus === 'active'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleFilterChange('status', 'archived')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                currentStatus === 'archived'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => handleFilterChange('status', 'all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                currentStatus === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
          </div>

          {/* Terms Filter */}
          <select
            value={currentTerms}
            onChange={(e) => handleFilterChange('terms', e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-hidden"
          >
            <option value="all">All Terms</option>
            <option value="Cash">Cash</option>
            <option value="Due immediately">Due immediately</option>
            <option value="7 days">7 days</option>
            <option value="15 days">15 days</option>
            <option value="30 days">30 days</option>
            <option value="45 days">45 days</option>
            <option value="60 days">60 days</option>
          </select>

          <Button
            onClick={() => {
              setEditingSupplier(null)
              setFormOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Table / Cards Container */}
      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12">
          <EmptyState
            title="No suppliers found"
            description={
              search
                ? `No suppliers matched your search query "${search}". Try adjusting your filters.`
                : 'No supplier records match the selected status filter.'
            }
            icon={Building2}
            action={
              <Button
                onClick={() => {
                  setEditingSupplier(null)
                  setFormOpen(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Register First Supplier
              </Button>
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
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Terms & Credit</th>
                    <th className="py-3 px-4 text-right">Total Purchases</th>
                    <th className="py-3 px-4 text-right">Outstanding Payable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((sup) => {
                    const hasPayable = sup.financialSummary.outstandingBalance > 0
                    return (
                      <tr key={sup.id} className="hover:bg-muted/30 transition-colors">
                        {/* Supplier Info */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/admin/suppliers/${sup.id}`}
                            className="font-semibold text-foreground hover:text-emerald-600 transition-colors inline-block"
                          >
                            {sup.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">
                              {sup.supplier_code || 'SUP'}
                            </span>
                            {sup.tax_identifier && (
                              <span className="text-[11px]">TRN: {sup.tax_identifier}</span>
                            )}
                          </div>
                        </td>

                        {/* Contact details */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-foreground">
                            {sup.contact_person || '—'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {sup.phone && (
                              <a
                                href={`tel:${sup.phone}`}
                                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" /> {sup.phone}
                              </a>
                            )}
                            {sup.whatsapp && (
                              <a
                                href={`https://wa.me/${sup.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Terms & Credit */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-foreground">{sup.payment_terms}</div>
                          <div className="text-muted-foreground mt-0.5">
                            Limit: <CurrencyDisplay amount={sup.credit_limit} />
                          </div>
                        </td>

                        {/* Total Purchases */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-semibold text-foreground">
                            <CurrencyDisplay amount={sup.financialSummary.totalPurchases} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {sup.financialSummary.totalPurchasesCount} order(s)
                          </div>
                        </td>

                        {/* Outstanding Payable */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className={`font-semibold ${
                              hasPayable
                                ? 'text-amber-700 dark:text-amber-400 font-bold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <CurrencyDisplay amount={sup.financialSummary.outstandingBalance} />
                          </div>
                          {hasPayable && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Payable
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={sup.is_active ? 'active' : 'archived'} />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/suppliers/${sup.id}`}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="View details & invoices"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setEditingSupplier(sup)
                                setFormOpen(true)
                              }}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit Supplier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setArchivingSupplier(sup)}
                              className={`p-1.5 rounded-lg border border-border hover:bg-muted transition-colors ${
                                sup.is_active
                                  ? 'text-muted-foreground hover:text-rose-600'
                                  : 'text-muted-foreground hover:text-emerald-600'
                              }`}
                              title={sup.is_active ? 'Archive Supplier' : 'Restore Supplier'}
                            >
                              {sup.is_active ? (
                                <Archive className="h-4 w-4" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
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
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {sup.supplier_code || 'SUP'}
                    </span>
                    <h4 className="font-semibold text-base text-foreground mt-1">{sup.name}</h4>
                    {sup.contact_person && (
                      <p className="text-xs text-muted-foreground">{sup.contact_person}</p>
                    )}
                  </div>
                  <StatusBadge status={sup.is_active ? 'active' : 'archived'} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                  <div>
                    <span className="text-muted-foreground">Terms:</span>
                    <p className="font-medium text-foreground">{sup.payment_terms}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <p className="font-medium text-foreground">
                      <CurrencyDisplay amount={sup.credit_limit} />
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purchases:</span>
                    <p className="font-semibold text-foreground">
                      <CurrencyDisplay amount={sup.financialSummary.totalPurchases} />
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payable:</span>
                    <p
                      className={`font-bold ${
                        sup.financialSummary.outstandingBalance > 0
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <CurrencyDisplay amount={sup.financialSummary.outstandingBalance} />
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sup.phone && (
                      <a
                        href={`tel:${sup.phone}`}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {sup.whatsapp && (
                      <a
                        href={`https://wa.me/${sup.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-border text-emerald-600"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingSupplier(sup)
                        setFormOpen(true)
                      }}
                      className="px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/admin/suppliers/${sup.id}`}
                      className="px-3 py-1 text-xs bg-emerald-600 text-white font-medium rounded-lg inline-flex items-center gap-1"
                    >
                      Workspace <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-2">
              <span>
                Showing page {page} of {totalPages} ({total} suppliers total)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', (page - 1).toString())
                    router.push(`/admin/suppliers?${params.toString()}`)
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
                    router.push(`/admin/suppliers?${params.toString()}`)
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

      {/* Supplier Create / Edit Modal */}
      {formOpen && (
        <SupplierFormDialog
          supplier={editingSupplier}
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setEditingSupplier(null)
          }}
        />
      )}

      {/* Archive / Restore Confirmation Modal */}
      {archivingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {archivingSupplier.is_active ? 'Archive Supplier?' : 'Restore Supplier?'}
                </h3>
                <p className="text-xs text-muted-foreground">{archivingSupplier.name}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {archivingSupplier.is_active
                ? 'Archiving hides this supplier from new purchase orders. Historical purchases, invoices, payments, and balances remain completely intact for accounting auditability.'
                : 'Restoring this supplier will make them active and selectable for new purchase orders.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchivingSupplier(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleArchiveConfirm}
                disabled={actionLoading}
                className={
                  archivingSupplier.is_active
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }
              >
                {actionLoading
                  ? 'Processing...'
                  : archivingSupplier.is_active
                  ? 'Confirm Archive'
                  : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
