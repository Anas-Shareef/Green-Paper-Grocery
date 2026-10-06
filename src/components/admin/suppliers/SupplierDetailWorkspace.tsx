'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  CreditCard,
  Plus,
  DollarSign,
  Edit2,
  ChevronRight,
  Receipt,
  Truck,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { EmptyState } from '@/components/admin/EmptyState'
import { SupplierFormDialog } from './SupplierFormDialog'
import { SupplierPaymentDialog } from './SupplierPaymentDialog'
import type { SupplierDetailResult } from '@/lib/services/suppliers'
import type { SupplierInvoice } from '@/types/database.types'

interface SupplierDetailWorkspaceProps {
  data: SupplierDetailResult
}

export function SupplierDetailWorkspace({ data }: SupplierDetailWorkspaceProps) {
  const { supplier, financialSummary, purchases, invoices, payments, returns } = data

  const [activeTab, setActiveTab] = useState<'purchases' | 'invoices' | 'payments' | 'returns'>('purchases')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<SupplierInvoice | null>(null)

  const availableCredit = Math.max(0, Number(supplier.credit_limit) - financialSummary.outstandingBalance)

  return (
    <div className="space-y-6">
      {/* Supplier Profile Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{supplier.name}</h1>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                  {supplier.supplier_code || 'SUP'}
                </span>
                <StatusBadge status={supplier.is_active ? 'active' : 'archived'} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {supplier.contact_person
                  ? `Contact: ${supplier.contact_person}`
                  : 'Wholesale Supplier Profile'}{' '}
                {supplier.tax_identifier && `• TRN: ${supplier.tax_identifier}`}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="h-9 inline-flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvoiceForPayment(null)
                setPaymentDialogOpen(true)
              }}
              className="h-9 inline-flex items-center gap-1.5"
            >
              <DollarSign className="h-3.5 w-3.5" /> Record Payment
            </Button>

            <Link href={`/admin/purchases/new?supplierId=${supplier.id}`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> New Purchase Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Contact & Terms Ribbon */}
        <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Contact & WhatsApp</span>
            <div className="flex items-center gap-2">
              {supplier.phone ? (
                <a href={`tel:${supplier.phone}`} className="text-foreground hover:underline inline-flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" /> {supplier.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">No phone provided</span>
              )}
              {supplier.whatsapp && (
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Email Address</span>
            {supplier.email ? (
              <a href={`mailto:${supplier.email}`} className="text-foreground hover:underline flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> {supplier.email}
              </a>
            ) : (
              <span className="text-muted-foreground block">No email provided</span>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Payment Terms</span>
            <p className="font-semibold text-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-muted-foreground" /> {supplier.payment_terms}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Credit Facility</span>
            <p className="font-semibold text-foreground">
              Limit: <CurrencyDisplay amount={supplier.credit_limit} />
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Total Purchases
          </span>
          <p className="text-lg font-bold text-foreground mt-1">
            <CurrencyDisplay amount={financialSummary.totalPurchases} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {financialSummary.totalPurchasesCount} orders
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Total Invoiced
          </span>
          <p className="text-lg font-bold text-foreground mt-1">
            <CurrencyDisplay amount={financialSummary.totalInvoiced} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {invoices.length} bill(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Total Paid
          </span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            <CurrencyDisplay amount={financialSummary.totalPaid} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {payments.length} payout(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Total Returned
          </span>
          <p className="text-lg font-bold text-foreground mt-1">
            <CurrencyDisplay amount={financialSummary.totalReturned} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {returns.length} return(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Current Payable
          </span>
          <p
            className={`text-lg font-bold mt-1 ${
              financialSummary.outstandingBalance > 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-muted-foreground'
            }`}
          >
            <CurrencyDisplay amount={financialSummary.outstandingBalance} />
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
            Net balance due
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Available Credit
          </span>
          <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
            <CurrencyDisplay amount={availableCredit} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Remaining credit
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="border-b border-border flex items-center gap-2">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'purchases'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck className="h-4 w-4" /> Purchase Orders ({purchases.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4" /> Invoices ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign className="h-4 w-4" /> Payments ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'returns'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <RotateCcw className="h-4 w-4" /> Returns ({returns.length})
        </button>
      </div>

      {/* Tab 1: Purchases */}
      {activeTab === 'purchases' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {purchases.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No purchase orders yet"
                description={`No orders have been recorded for ${supplier.name}. Create a PO to procure inventory.`}
                icon={Truck}
                action={
                  <Link href={`/admin/purchases/new?supplierId=${supplier.id}`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Create First Purchase Order
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Invoicing</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        <Link
                          href={`/admin/purchases/${p.id}`}
                          className="hover:text-emerald-600 hover:underline"
                        >
                          {p.purchase_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{p.purchase_date}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.invoice_status} />
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        <CurrencyDisplay amount={p.total_amount} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/purchases/${p.id}`}
                          className="text-xs text-emerald-600 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Workspace <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {invoices.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No supplier invoices recorded"
                description="When the supplier issues wholesale bills for goods received, log them here to reconcile accounts."
                icon={Receipt}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{inv.invoice_date}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{inv.due_date}</td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        <CurrencyDisplay amount={inv.total_amount} />
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        <CurrencyDisplay amount={inv.paid_amount} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700 dark:text-amber-400">
                        <CurrencyDisplay amount={inv.outstanding_amount} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {Number(inv.outstanding_amount) > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv)
                              setPaymentDialogOpen(true)
                            }}
                            className="h-7 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            Pay Balance
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {payments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No payments recorded"
                description="Payments made via bank transfer, cheque, or cash will appear in this ledger."
                icon={DollarSign}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Payment #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {pmt.payment_number}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{pmt.payment_date}</td>
                      <td className="py-3 px-4 capitalize text-xs font-medium text-foreground">
                        {pmt.payment_method.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                        {pmt.reference || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        <CurrencyDisplay amount={pmt.amount} />
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {pmt.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Returns */}
      {activeTab === 'returns' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {returns.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No returns recorded"
                description="Damaged or rejected inventory returned to this supplier will be listed here with credit notes."
                icon={RotateCcw}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Return #</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Credit Amount</th>
                    <th className="py-3 px-4 text-right">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {ret.return_number}
                      </td>
                      <td className="py-3 px-4 text-xs text-foreground font-medium">{ret.reason}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ret.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        <CurrencyDisplay amount={ret.total_amount} />
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                        {ret.completed_at ? new Date(ret.completed_at).toLocaleDateString() : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editDialogOpen && (
        <SupplierFormDialog
          supplier={supplier}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
        />
      )}

      {/* Record Payment Modal */}
      {paymentDialogOpen && (
        <SupplierPaymentDialog
          supplierId={supplier.id}
          supplierName={supplier.name}
          invoice={selectedInvoiceForPayment}
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false)
            setSelectedInvoiceForPayment(null)
          }}
        />
      )}
    </div>
  )
}
