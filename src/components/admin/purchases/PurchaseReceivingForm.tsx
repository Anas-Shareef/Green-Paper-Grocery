'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PackageCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { receivePurchaseAction } from '@/app/admin/purchases/actions'
import type { PurchaseDetailResult } from '@/lib/services/purchases'

interface ReceivingItemState {
  purchaseItemId: string
  productId: string
  productName: string
  sku: string | null
  unit: string
  orderedQty: number
  previouslyReceivedQty: number
  remainingQty: number
  acceptedQty: string
  rejectedQty: string
  unitCost: string
  batchNumber: string
  expiryDate: string
  notes: string
}

interface PurchaseReceivingFormProps {
  data: PurchaseDetailResult
}

export function PurchaseReceivingForm({ data }: PurchaseReceivingFormProps) {
  const router = useRouter()
  const { purchase, supplier, items, summary } = data

  const [deliveryNote, setDeliveryNote] = useState('')
  const [receivingNotes, setReceivingNotes] = useState('')

  // Initialize receiving rows for each purchase item with remaining > 0
  const [receivingItems, setReceivingItems] = useState<ReceivingItemState[]>(() => {
    return items.map((it) => {
      const ordered = Number(it.quantity) || 0
      const prev = Number(it.received_quantity) || 0
      const remaining = Math.max(0, ordered - prev)
      const cost = Number(it.final_unit_cost) || Number(it.purchase_price) || 0

      return {
        purchaseItemId: it.id,
        productId: it.product_id,
        productName: it.product?.name || 'Product',
        sku: it.product?.sku || null,
        unit: it.product?.unit || 'unit',
        orderedQty: ordered,
        previouslyReceivedQty: prev,
        remainingQty: remaining,
        acceptedQty: remaining > 0 ? remaining.toString() : '0',
        rejectedQty: '0',
        unitCost: cost.toString(),
        batchNumber: '',
        expiryDate: '',
        notes: '',
      }
    })
  })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFieldChange = (index: number, field: keyof ReceivingItemState, value: string) => {
    const updated = [...receivingItems]
    updated[index] = { ...updated[index], [field]: value }
    setReceivingItems(updated)
  }

  // Calculate total units being accepted in this receiving
  let totalAcceptedInThisGRN = 0
  receivingItems.forEach((it) => {
    totalAcceptedInThisGRN += parseFloat(it.acceptedQty) || 0
  })

  // Validate receiving before opening confirmation
  const handleValidateBeforeConfirm = () => {
    setError(null)

    if (totalAcceptedInThisGRN <= 0) {
      setError('You must accept at least one unit across items to complete a receiving operation')
      return
    }

    // Validate quantities
    for (let i = 0; i < receivingItems.length; i++) {
      const it = receivingItems[i]
      const acc = parseFloat(it.acceptedQty) || 0
      const rej = parseFloat(it.rejectedQty) || 0

      if (acc < 0 || rej < 0) {
        setError(`Row #${i + 1} (${it.productName}): Quantities cannot be negative`)
        return
      }

      if (acc > it.remainingQty) {
        setError(
          `Row #${i + 1} (${it.productName}): Accepted quantity (${acc}) cannot exceed remaining outstanding quantity (${it.remainingQty})`
        )
        return
      }

      const cost = parseFloat(it.unitCost)
      if (isNaN(cost) || cost < 0) {
        setError(`Row #${i + 1} (${it.productName}): Unit cost must be a valid non-negative number`)
        return
      }

      // Check expiry date if provided
      if (it.expiryDate) {
        const todayStr = new Date().toISOString().split('T')[0]
        if (it.expiryDate < todayStr) {
          setError(
            `Row #${i + 1} (${it.productName}): Expiry date (${it.expiryDate}) cannot be in the past on receipt`
          )
          return
        }
      }
    }

    setConfirmOpen(true)
  }

  // Execute atomic receiving RPC
  const handleExecuteReceiving = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        purchaseId: purchase.id,
        deliveryNoteNumber: deliveryNote.trim() || null,
        notes: receivingNotes.trim() || null,
        items: receivingItems.map((it) => ({
          purchaseItemId: it.purchaseItemId,
          acceptedQuantity: parseFloat(it.acceptedQty) || 0,
          rejectedQuantity: parseFloat(it.rejectedQty) || 0,
          unitCost: parseFloat(it.unitCost) || 0,
          batchNumber: it.batchNumber.trim() || null,
          expiryDate: it.expiryDate || null,
          notes: it.notes.trim() || null,
        })),
      }

      const res = await receivePurchaseAction(payload)
      if (!res.success) {
        setError(res.error || 'Failed to complete receiving transaction')
        setConfirmOpen(false)
        return
      }

      router.push(`/admin/purchases/${purchase.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setConfirmOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href={`/admin/purchases/${purchase.id}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Purchase Workspace
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PO Overview Ribbon */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-foreground">
                {purchase.purchase_number}
              </span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                Receiving / GRN
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supplier: <strong className="text-foreground">{supplier.name}</strong> • Order Date:{' '}
              {purchase.purchase_date}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Total Ordered:</span>
              <p className="font-bold text-foreground font-mono">{summary.totalOrderedQty} units</p>
            </div>
            <div>
              <span className="text-muted-foreground">Previously Received:</span>
              <p className="font-bold text-emerald-600 font-mono">
                {summary.totalReceivedQty} units
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>
              <p className="font-bold text-amber-600 font-mono">{summary.remainingQty} units</p>
            </div>
          </div>
        </div>

        {/* Delivery Note & Receiving Notes Inputs */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Supplier Delivery Note / Waybill # (Optional)
            </label>
            <Input
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="e.g. DN-2026-99120"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Receiving Inspection Remarks</label>
            <Input
              value={receivingNotes}
              onChange={(e) => setReceivingNotes(e.target.value)}
              placeholder="e.g. Driver arrived at 10:30 AM, cold-chain temperature 3°C verified..."
            />
          </div>
        </div>
      </div>

      {/* Receiving Items Grid */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-emerald-600" /> Physical Stock Inspection & Intake
          </h3>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Intake Units: +{totalAcceptedInThisGRN}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-[11px] font-semibold uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-3 min-w-[180px]">Product</th>
                <th className="py-2.5 px-2 text-center w-16">Ordered</th>
                <th className="py-2.5 px-2 text-center w-16">Prev. Rec</th>
                <th className="py-2.5 px-2 text-center w-16">Remaining</th>
                <th className="py-2.5 px-3 text-center w-24">Accepted Qty *</th>
                <th className="py-2.5 px-3 text-center w-24">Rejected Qty</th>
                <th className="py-2.5 px-3 w-28">Unit Cost (AED) *</th>
                <th className="py-2.5 px-3 w-28">Batch #</th>
                <th className="py-2.5 px-3 w-32">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receivingItems.map((it, idx) => (
                <tr key={it.purchaseItemId} className="hover:bg-muted/20">
                  {/* Product */}
                  <td className="py-3 px-3">
                    <p className="font-semibold text-foreground">{it.productName}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      SKU: {it.sku || 'N/A'} • Unit: {it.unit}
                    </span>
                  </td>

                  {/* Ordered */}
                  <td className="py-3 px-2 text-center font-mono font-medium">{it.orderedQty}</td>

                  {/* Prev. Received */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-muted-foreground">
                    {it.previouslyReceivedQty}
                  </td>

                  {/* Remaining */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-amber-600">
                    {it.remainingQty}
                  </td>

                  {/* Accepted Quantity Input */}
                  <td className="py-3 px-3 text-center">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max={it.remainingQty}
                      value={it.acceptedQty}
                      onChange={(e) => handleFieldChange(idx, 'acceptedQty', e.target.value)}
                      className="h-8 text-xs font-mono font-bold text-emerald-600 border-emerald-300 dark:border-emerald-700 text-center"
                    />
                  </td>

                  {/* Rejected Quantity Input */}
                  <td className="py-3 px-3 text-center">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={it.rejectedQty}
                      onChange={(e) => handleFieldChange(idx, 'rejectedQty', e.target.value)}
                      className="h-8 text-xs font-mono text-center"
                    />
                  </td>

                  {/* Unit Acquisition Cost */}
                  <td className="py-3 px-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.unitCost}
                      onChange={(e) => handleFieldChange(idx, 'unitCost', e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </td>

                  {/* Batch Number */}
                  <td className="py-3 px-3">
                    <Input
                      value={it.batchNumber}
                      onChange={(e) => handleFieldChange(idx, 'batchNumber', e.target.value)}
                      placeholder="e.g. B-991"
                      className="h-8 text-xs"
                    />
                  </td>

                  {/* Expiry Date */}
                  <td className="py-3 px-3">
                    <Input
                      type="date"
                      value={it.expiryDate}
                      onChange={(e) => handleFieldChange(idx, 'expiryDate', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer & Submit Actions */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>
              Accepted items will trigger atomic inventory stock-in and immutable movement ledger entries.
            </span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <Link href={`/admin/purchases/${purchase.id}`}>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={handleValidateBeforeConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 px-5 shadow-xs inline-flex items-center gap-2"
            >
              <PackageCheck className="h-4 w-4" /> Review & Complete Receiving
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog with Consequence Transparency */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Confirm Physical Receiving?</h3>
                <p className="text-xs text-muted-foreground">Goods Received Note (GRN)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Units to Add:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  +{totalAcceptedInThisGRN} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Order:</span>
                <span className="font-mono font-medium text-foreground">
                  {purchase.purchase_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium text-foreground">{supplier.name}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Completing this receiving operation will execute an atomic database transaction:
              <br />
              <strong className="text-foreground">
                • {totalAcceptedInThisGRN} units will be added to products inventory
              </strong>
              <br />
              • Immutable inventory movement records (type: <code>purchase</code>) with previous_stock
              and resulting_stock snapshots will be written to the ledger
              <br />• Product purchase costs will be updated to reflect current acquisition costs
              <br />• An official Goods Received Note (GRN) document will be recorded
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Back & Edit
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteReceiving}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px]"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  'Confirm & Stock In'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
