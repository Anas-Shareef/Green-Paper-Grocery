'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Truck,
  Building2,
  DollarSign,
  PackageCheck,
  Send,
  XCircle,
  Receipt,
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { EmptyState } from '@/components/admin/EmptyState'
import {
  orderPurchaseAction,
  cancelPurchaseAction,
  createInvoiceAction,
  recordPaymentAction,
  createReturnAction,
  completeReturnAction,
} from '@/app/admin/purchases/actions'
import type { PurchaseDetailResult } from '@/lib/services/purchases'
import type { SupplierInvoice, PaymentMethod } from '@/types/database.types'

interface PurchaseDetailWorkspaceProps {
  data: PurchaseDetailResult
}

export function PurchaseDetailWorkspace({ data }: PurchaseDetailWorkspaceProps) {
  const router = useRouter()
  const { purchase, supplier, items, goodsReceivedNotes, invoices, returns, summary } = data

  const [activeTab, setActiveTab] = useState<'items' | 'grns' | 'invoices' | 'returns'>('items')

  // Modals state
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null)
  const [returnModalOpen, setReturnModalOpen] = useState(false)

  // Actions loading
  const [loading, setLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // New Invoice Form State
  const [invNumber, setInvNumber] = useState('')
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0])
  const [invDueDate, setInvDueDate] = useState('')
  const [invTotal, setInvTotal] = useState(summary.totalAmount.toString())

  // Payment Form State
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bank_transfer')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

  // Return Form State
  const [retProductId, setRetProductId] = useState(items[0]?.product_id || '')
  const [retQuantity, setRetQuantity] = useState('1')
  const [retReason, setRetReason] = useState('Damaged goods')

  const isDraft = purchase.status === 'draft'
  const isOrdered = purchase.status === 'ordered'
  const isPartiallyReceived = purchase.status === 'partially_received'
  const isReceived = purchase.status === 'received'
  const canReceive = isOrdered || isPartiallyReceived
  const canCancel = isDraft || isOrdered

  // Handle Order PO
  const handleOrderPO = async () => {
    setLoading(true)
    setModalError(null)
    try {
      const res = await orderPurchaseAction(purchase.id)
      if (!res.success) {
        setModalError(res.error || 'Failed to order purchase')
        return
      }
      setOrderConfirmOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Handle Cancel PO
  const handleCancelPO = async () => {
    setLoading(true)
    setModalError(null)
    try {
      const res = await cancelPurchaseAction(purchase.id, cancelReason)
      if (!res.success) {
        setModalError(res.error || 'Failed to cancel purchase')
        return
      }
      setCancelConfirmOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Handle Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!invNumber.trim()) {
      setModalError('Supplier invoice number is required')
      return
    }

    setLoading(true)
    try {
      const res = await createInvoiceAction({
        supplierId: supplier.id,
        purchaseId: purchase.id,
        invoiceNumber: invNumber.trim(),
        invoiceDate: invDate,
        dueDate: invDueDate || null,
        subtotal: summary.subtotal,
        discountAmount: summary.discountTotal,
        taxAmount: summary.taxTotal,
        totalAmount: parseFloat(invTotal) || 0,
      })

      if (!res.success) {
        setModalError(res.error || 'Failed to create invoice')
        return
      }

      setInvoiceModalOpen(false)
      setInvNumber('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) {
      setModalError('Payment amount must be greater than zero')
      return
    }

    setLoading(true)
    try {
      const res = await recordPaymentAction({
        supplierId: supplier.id,
        invoiceId: selectedInvoice?.id || null,
        amount,
        paymentMethod: payMethod,
        paymentDate: payDate,
        reference: payRef.trim() || null,
        notes: payNotes.trim() || null,
      })

      if (!res.success) {
        setModalError(res.error || 'Failed to record payment')
        return
      }

      setPaymentModalOpen(false)
      setSelectedInvoice(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Handle Create Return Request
  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    const retItem = items.find((it) => it.product_id === retProductId)
    const qty = parseFloat(retQuantity)
    if (!retItem || isNaN(qty) || qty <= 0) {
      setModalError('Valid return quantity required')
      return
    }

    if (qty > retItem.received_quantity) {
      setModalError(`Cannot return more than received quantity (${retItem.received_quantity} units)`)
      return
    }

    setLoading(true)
    try {
      const res = await createReturnAction({
        supplierId: supplier.id,
        purchaseId: purchase.id,
        reason: retReason.trim(),
        items: [
          {
            productId: retProductId,
            quantity: qty,
            unitCost: Number(retItem.final_unit_cost) || Number(retItem.purchase_price),
          },
        ],
      })

      if (!res.success) {
        setModalError(res.error || 'Failed to create return request')
        return
      }

      setReturnModalOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Handle Complete Return (atomically decreases inventory)
  const handleCompleteReturn = async (returnId: string) => {
    if (!confirm('Complete this return? Inventory stock will be atomically decreased and a supplier credit will be logged.')) {
      return
    }

    setLoading(true)
    try {
      const res = await completeReturnAction(returnId, purchase.id)
      if (!res.success) {
        alert(res.error || 'Failed to complete return')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Purchase Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold font-mono text-foreground">{purchase.purchase_number}</h1>
                <StatusBadge status={purchase.status} />
                <StatusBadge status={purchase.invoice_status} />
                <StatusBadge status={purchase.payment_status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span>Supplier:</span>
                <Link
                  href={`/admin/suppliers/${supplier.id}`}
                  className="font-semibold text-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {supplier.name} ({supplier.supplier_code || 'SUP'})
                </Link>
                <span>• Order Date: {purchase.purchase_date}</span>
                {purchase.expected_delivery_date && (
                  <span>• Expected: {purchase.expected_delivery_date}</span>
                )}
              </p>
            </div>
          </div>

          {/* Operational Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canReceive && (
              <Link href={`/admin/purchases/${purchase.id}/receive`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shadow-xs inline-flex items-center gap-1.5 font-semibold">
                  <PackageCheck className="h-4 w-4" /> Receive Goods (GRN)
                </Button>
              </Link>
            )}

            {isDraft && (
              <Button
                onClick={() => setOrderConfirmOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 shadow-xs inline-flex items-center gap-1.5 font-semibold"
              >
                <Send className="h-4 w-4" /> Place Order
              </Button>
            )}

            {(isOrdered || isPartiallyReceived || isReceived) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoiceModalOpen(true)}
                className="h-9 inline-flex items-center gap-1.5"
              >
                <Receipt className="h-3.5 w-3.5" /> Log Supplier Invoice
              </Button>
            )}

            {(isPartiallyReceived || isReceived) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnModalOpen(true)}
                className="h-9 inline-flex items-center gap-1.5 text-muted-foreground hover:text-rose-600"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Return Items
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelConfirmOpen(true)}
                className="h-9 inline-flex items-center gap-1.5 text-muted-foreground hover:text-rose-600"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel PO
              </Button>
            )}
          </div>
        </div>

        {/* Operational Notes Ribbon */}
        {purchase.notes && (
          <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Order Notes: </span>
            {purchase.notes}
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Ordered Units
          </span>
          <p className="text-lg font-bold text-foreground mt-1 font-mono">
            {summary.totalOrderedQty}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {items.length} product(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Received Units
          </span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {summary.totalReceivedQty}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {goodsReceivedNotes.length} GRN shipment(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Remaining Units
          </span>
          <p
            className={`text-lg font-bold mt-1 font-mono ${
              summary.remainingQty > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
            }`}
          >
            {summary.remainingQty}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Pending physical delivery
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            PO Commitment Total
          </span>
          <p className="text-lg font-bold text-foreground mt-1">
            <CurrencyDisplay amount={summary.totalAmount} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Agreed procurement value
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Invoiced Amount
          </span>
          <p className="text-lg font-bold text-foreground mt-1">
            <CurrencyDisplay amount={summary.invoicedTotal} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {invoices.length} bill(s) logged
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Outstanding Payable
          </span>
          <p
            className={`text-lg font-bold mt-1 ${
              summary.outstandingTotal > 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-muted-foreground'
            }`}
          >
            <CurrencyDisplay amount={summary.outstandingTotal} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Paid: <CurrencyDisplay amount={summary.paidTotal} />
          </p>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="border-b border-border flex items-center gap-2">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'items'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" /> Order Items ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('grns')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'grns'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PackageCheck className="h-4 w-4" /> Goods Received Notes ({goodsReceivedNotes.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4" /> Invoices & Payments ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'returns'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <RotateCcw className="h-4 w-4" /> Returns & Credits ({returns.length})
        </button>
      </div>

      {/* Tab 1: Order Items Table */}
      {activeTab === 'items' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-center">Ordered</th>
                  <th className="py-3 px-4 text-center">Received</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((it) => {
                  const ordered = Number(it.quantity) || 0
                  const received = Number(it.received_quantity) || 0
                  const remaining = Math.max(0, ordered - received)

                  return (
                    <tr key={it.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {it.product?.name || 'Unknown Product'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          SKU: {it.product?.sku || 'N/A'} • Unit: {it.product?.unit || 'unit'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{ordered}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {received}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-amber-600 dark:text-amber-400">
                        {remaining}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <CurrencyDisplay amount={it.purchase_price} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        <CurrencyDisplay amount={it.discount_amount} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        <CurrencyDisplay amount={it.tax_amount} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        <CurrencyDisplay amount={it.total_cost} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: GRNs */}
      {activeTab === 'grns' && (
        <div className="space-y-4">
          {goodsReceivedNotes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12">
              <EmptyState
                title="No Goods Received Notes (GRN) yet"
                description={
                  canReceive
                    ? 'Shipment has not been received yet. Click "Receive Goods" when physical stock arrives at the store.'
                    : 'Place the purchase order to enable receiving workflows.'
                }
                icon={PackageCheck}
                action={
                  canReceive ? (
                    <Link href={`/admin/purchases/${purchase.id}/receive`}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Record First GRN Receiving
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            goodsReceivedNotes.map((grn) => (
              <div
                key={grn.id}
                className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {grn.grn_number}
                      </span>
                      <StatusBadge status={grn.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Received: {new Date(grn.received_at).toLocaleString()}{' '}
                      {grn.delivery_note_number && `• Delivery Note: ${grn.delivery_note_number}`}
                    </p>
                  </div>
                  {grn.notes && (
                    <p className="text-xs text-muted-foreground italic">&ldquo;{grn.notes}&rdquo;</p>
                  )}
                </div>

                {/* GRN Items List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/30 text-[11px] font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3 text-center">Accepted Stock In</th>
                        <th className="py-2 px-3 text-center">Rejected / Damaged</th>
                        <th className="py-2 px-3 text-right">Unit Acquisition Cost</th>
                        <th className="py-2 px-3 text-right">Total Line Cost</th>
                        <th className="py-2 px-3">Batch / Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {grn.items.map((git) => (
                        <tr key={git.id}>
                          <td className="py-2 px-3 font-medium text-foreground">
                            {git.product?.name || 'Product'}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            +{git.accepted_quantity}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                            {git.rejected_quantity > 0 ? (
                              <span className="text-rose-600 font-semibold">{git.rejected_quantity}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            <CurrencyDisplay amount={git.unit_cost} />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            <CurrencyDisplay amount={git.total_cost} />
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {git.batch_number ? (
                              <span>
                                Batch: {git.batch_number} {git.expiry_date && `(Exp: ${git.expiry_date})`}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {invoices.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No supplier invoices recorded for this purchase"
                description="When the vendor provides an invoice matching this PO and GRN, log it here to establish payable reconciliation."
                icon={Receipt}
                action={
                  <Button
                    onClick={() => setInvoiceModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Log Supplier Invoice
                  </Button>
                }
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
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{inv.invoice_date}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{inv.due_date}</td>
                      <td className="py-3 px-4 text-right font-medium">
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
                              setSelectedInvoice(inv)
                              setPayAmount(inv.outstanding_amount.toString())
                              setPaymentModalOpen(true)
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

      {/* Tab 4: Returns */}
      {activeTab === 'returns' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {returns.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No supplier returns recorded"
                description="If any received items are defective, expired, or rejected, initiate a return to decrease stock and generate credit."
                icon={RotateCcw}
                action={
                  summary.totalReceivedQty > 0 ? (
                    <Button
                      onClick={() => setReturnModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Initiate Return Request
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {returns.map((ret) => (
                <div key={ret.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {ret.return_number}
                        </span>
                        <StatusBadge status={ret.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reason: {ret.reason} • Created: {new Date(ret.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Credit Value:</span>
                        <p className="font-bold text-foreground">
                          <CurrencyDisplay amount={ret.total_amount} />
                        </p>
                      </div>

                      {ret.status === 'draft' || ret.status === 'requested' ? (
                        <Button
                          size="sm"
                          disabled={loading}
                          onClick={() => handleCompleteReturn(ret.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                        >
                          Complete Return & Adjust Stock
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Return items */}
                  <div className="bg-muted/20 rounded-lg p-3 text-xs space-y-1.5 border border-border">
                    {ret.items.map((rit) => (
                      <div key={rit.id} className="flex justify-between items-center">
                        <span className="font-medium text-foreground">
                          {rit.product?.name || 'Product'} ({rit.quantity} units)
                        </span>
                        <span className="font-mono font-semibold">
                          <CurrencyDisplay amount={rit.total_cost} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Place Order Modal */}
      {orderConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Place Purchase Order?</h3>
                <p className="text-xs text-muted-foreground">{purchase.purchase_number}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Ordering marks this purchase as approved for supplier fulfillment.
              Inventory will <strong className="text-foreground">NOT</strong> be changed until
              goods arrive and a Goods Received Note (GRN) is completed.
            </p>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">{modalError}</div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderConfirmOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleOrderPO}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel PO Modal */}
      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Cancel Purchase Order?</h3>
                <p className="text-xs text-muted-foreground">{purchase.purchase_number}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reason for cancellation</label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Supplier pricing disagreement..."
              />
            </div>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">{modalError}</div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelConfirmOpen(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleCancelPO}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Log Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-foreground">Log Supplier Invoice</h3>
              </div>
              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{modalError}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Supplier Invoice Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  placeholder="e.g. INV-99021"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Invoice Date</label>
                  <Input
                    type="date"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Due Date (Optional)</label>
                  <Input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Invoice Total (AED)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={invTotal}
                  onChange={(e) => setInvTotal(e.target.value)}
                  required
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInvoiceModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-foreground">Record Supplier Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{modalError}</div>
              )}

              {selectedInvoice && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs flex justify-between">
                  <span>Invoice {selectedInvoice.invoice_number}:</span>
                  <span className="font-bold text-amber-600">
                    Outstanding AED {Number(selectedInvoice.outstanding_amount).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Payment Amount (AED)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Date</label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="other">Card / Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Transaction Reference</label>
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. Bank Ref / Cheque No"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Payment Remarks</label>
                <Input
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Payment notes, settlement memo..."
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-foreground">Create Return Request</h3>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{modalError}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Select Product to Return</label>
                <select
                  value={retProductId}
                  onChange={(e) => setRetProductId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                >
                  {items.map((it) => (
                    <option key={it.product_id} value={it.product_id}>
                      {it.product?.name} (Received: {it.received_quantity} units)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Return Quantity</label>
                <Input
                  type="number"
                  step="any"
                  min="0.001"
                  value={retQuantity}
                  onChange={(e) => setRetQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason for Return</label>
                <Input
                  value={retReason}
                  onChange={(e) => setRetReason(e.target.value)}
                  placeholder="e.g. Expired on arrival, broken packaging..."
                  required
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Return'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
