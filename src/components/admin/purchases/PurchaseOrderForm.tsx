'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
  DollarSign,
  FileText,
  Send,
  Save,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { createPurchaseAction, orderPurchaseAction } from '@/app/admin/purchases/actions'
import type { Supplier, Product } from '@/types/database.types'

interface PurchaseItemState {
  id: string
  productId: string
  quantity: string
  purchasePrice: string
  discountAmount: string
  taxAmount: string
  notes: string
}

interface PurchaseOrderFormProps {
  suppliers: Supplier[]
  products: Product[]
  initialSupplierId?: string
}

export function PurchaseOrderForm({
  suppliers,
  products,
  initialSupplierId,
}: PurchaseOrderFormProps) {
  const router = useRouter()

  const [supplierId, setSupplierId] = useState(initialSupplierId || suppliers[0]?.id || '')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [additionalCharges, setAdditionalCharges] = useState('0')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<PurchaseItemState[]>([
    {
      id: '1',
      productId: products[0]?.id || '',
      quantity: '10',
      purchasePrice: products[0]?.purchase_cost?.toString() || '0',
      discountAmount: '0',
      taxAmount: '0',
      notes: '',
    },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  // Handle product selection change
  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId)
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      purchasePrice: prod?.purchase_cost?.toString() || '0',
    }
    setItems(updated)
  }

  // Handle item field change
  const handleItemFieldChange = (index: number, field: keyof PurchaseItemState, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  // Add line item
  const handleAddItem = () => {
    const defaultProd = products[0]
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        productId: defaultProd?.id || '',
        quantity: '1',
        purchasePrice: defaultProd?.purchase_cost?.toString() || '0',
        discountAmount: '0',
        taxAmount: '0',
        notes: '',
      },
    ])
  }

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  // Calculate live financial preview
  let previewSubtotal = 0
  let previewDiscounts = 0
  let previewTaxes = 0

  items.forEach((it) => {
    const qty = parseFloat(it.quantity) || 0
    const price = parseFloat(it.purchasePrice) || 0
    const disc = parseFloat(it.discountAmount) || 0
    const tax = parseFloat(it.taxAmount) || 0

    previewSubtotal += qty * price
    previewDiscounts += disc
    previewTaxes += tax
  })

  const previewCharges = parseFloat(additionalCharges) || 0
  const previewGrandTotal = Math.max(
    0,
    previewSubtotal - previewDiscounts + previewTaxes + previewCharges
  )

  const handleSubmit = async (placeOrderImmediately: boolean = false) => {
    setError(null)

    if (!supplierId) {
      setError('Please select a supplier')
      return
    }

    if (!purchaseDate) {
      setError('Purchase date is required')
      return
    }

    if (items.length === 0) {
      setError('At least one product item is required')
      return
    }

    // Validate item rows
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const qty = parseFloat(it.quantity)
      const price = parseFloat(it.purchasePrice)
      if (!it.productId) {
        setError(`Row #${i + 1}: Please select a product`)
        return
      }
      if (isNaN(qty) || qty <= 0) {
        setError(`Row #${i + 1}: Quantity must be greater than zero`)
        return
      }
      if (isNaN(price) || price < 0) {
        setError(`Row #${i + 1}: Unit price must be a valid non-negative number`)
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        supplierId,
        purchaseDate,
        expectedDeliveryDate: expectedDeliveryDate || null,
        invoiceNumber: invoiceNumber.trim() || null,
        additionalCharges: previewCharges,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: parseFloat(it.quantity) || 0,
          purchasePrice: parseFloat(it.purchasePrice) || 0,
          discountAmount: parseFloat(it.discountAmount) || 0,
          taxAmount: parseFloat(it.taxAmount) || 0,
          notes: it.notes.trim() || null,
        })),
      }

      const res = await createPurchaseAction(payload)
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to create purchase order')
        setLoading(false)
        return
      }

      const newPoId = res.data.id

      // If requested to place order immediately
      if (placeOrderImmediately) {
        const orderRes = await orderPurchaseAction(newPoId)
        if (!orderRes.success) {
          setError(`PO created as draft, but ordering failed: ${orderRes.error}`)
          router.push(`/admin/purchases/${newPoId}`)
          return
        }
      }

      router.push(`/admin/purchases/${newPoId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/purchases"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Purchase Orders
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form + Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): PO Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Dates Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" /> Vendor & Order Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Supplier / Wholesaler <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplier_code || 'SUP'}) • {s.payment_terms}
                    </option>
                  ))}
                </select>
                {selectedSupplier && (
                  <p className="text-[11px] text-muted-foreground">
                    Terms: {selectedSupplier.payment_terms} • Credit Limit:{' '}
                    <CurrencyDisplay amount={selectedSupplier.credit_limit} />
                  </p>
                )}
              </div>

              {/* Purchase Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Purchase Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>

              {/* Expected Delivery Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Expected Delivery Date (Optional)
                </label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>

              {/* Vendor Quotation / Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Quotation / Vendor Ref (Optional)
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. QUOTE-2026-881"
                />
              </div>

              {/* Operational Notes */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Order Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special delivery instructions, contact driver, unload at bay 2..."
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Purchase Items
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-8 text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Product Row
              </Button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-[11px] font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Product</th>
                    <th className="py-2.5 px-3 w-24">Quantity</th>
                    <th className="py-2.5 px-3 w-28">Unit Cost</th>
                    <th className="py-2.5 px-3 w-24">Discount</th>
                    <th className="py-2.5 px-3 w-24">Tax</th>
                    <th className="py-2.5 px-3 text-right w-28">Line Total</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((it, idx) => {
                    const selectedProd = products.find((p) => p.id === it.productId)
                    const qty = parseFloat(it.quantity) || 0
                    const price = parseFloat(it.purchasePrice) || 0
                    const disc = parseFloat(it.discountAmount) || 0
                    const tax = parseFloat(it.taxAmount) || 0
                    const lineTotal = Math.max(0, qty * price - disc + tax)

                    return (
                      <tr key={it.id} className="hover:bg-muted/20">
                        {/* Product Select */}
                        <td className="py-2.5 px-3">
                          <select
                            value={it.productId}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''} • Stock: {p.stock_quantity}{' '}
                                {p.unit}
                              </option>
                            ))}
                          </select>
                          {selectedProd && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              Unit: {selectedProd.unit} • Curr. Cost: AED{' '}
                              {Number(selectedProd.purchase_cost).toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-3">
                          <Input
                            type="number"
                            step="any"
                            min="0.001"
                            value={it.quantity}
                            onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="py-2.5 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.purchasePrice}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'purchasePrice', e.target.value)
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </td>

                        {/* Discount */}
                        <td className="py-2.5 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.discountAmount}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'discountAmount', e.target.value)
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </td>

                        {/* Tax */}
                        <td className="py-2.5 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.taxAmount}
                            onChange={(e) => handleItemFieldChange(idx, 'taxAmount', e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                          AED {lineTotal.toFixed(2)}
                        </td>

                        {/* Remove */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Additional Charges Input */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Additional Charges (Freight, Delivery, Handling):
              </span>
              <div className="w-36">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  className="h-8 text-xs font-mono text-right"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Order Summary & Submission */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5 sticky top-20">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" /> Financial Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Gross Items Subtotal:</span>
                <span className="font-mono font-medium text-foreground">
                  <CurrencyDisplay amount={previewSubtotal} />
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Line Discounts:</span>
                <span className="font-mono font-medium text-rose-600">
                  - <CurrencyDisplay amount={previewDiscounts} />
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>VAT / Tax (5%):</span>
                <span className="font-mono font-medium text-foreground">
                  <CurrencyDisplay amount={previewTaxes} />
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Shipping / Freight:</span>
                <span className="font-mono font-medium text-foreground">
                  <CurrencyDisplay amount={previewCharges} />
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center text-sm">
                <span className="font-bold text-foreground">Total PO Commitment:</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400 font-mono">
                  <CurrencyDisplay amount={previewGrandTotal} />
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Integrity Policy:</p>
              <p>
                Draft purchases do not alter inventory stock. Goods are atomically added to inventory
                only upon completing a Goods Received Note (GRN).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(false)}
                variant="outline"
                className="w-full h-10 text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save as Draft
                  </>
                )}
              </Button>

              <Button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(true)}
                className="w-full h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Save & Place Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
