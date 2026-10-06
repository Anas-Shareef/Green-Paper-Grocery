'use client'

import React, { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateItemFulfillmentAction } from '@/app/admin/orders/actions'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Check, Package, AlertCircle, ShoppingBag } from 'lucide-react'
import type { OrderDetailItem } from '@/lib/services/orders'

interface FulfillmentChecklistProps {
  orderId: string
  items: OrderDetailItem[]
  readOnly?: boolean
}

export function FulfillmentChecklist({
  orderId,
  items,
  readOnly = false,
}: FulfillmentChecklistProps) {
  const [isPending, startTransition] = useTransition()
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  // Calculate fulfillment progress
  const totalItems = items.length
  const packedCount = items.filter((i) => i.fulfillment_status === 'packed').length
  const unavailableCount = items.filter((i) => i.fulfillment_status === 'unavailable').length
  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0

  const handleStatusChange = (
    itemId: string,
    newStatus: 'pending' | 'picked' | 'packed' | 'unavailable'
  ) => {
    if (readOnly) return
    setActiveItemId(itemId)
    startTransition(async () => {
      await updateItemFulfillmentAction({
        orderId,
        itemId,
        status: newStatus,
      })
      setActiveItemId(null)
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
      {/* Header with Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            Fulfillment & Packing Checklist
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verify each ordered grocery product before marking the order ready.
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="w-32 bg-muted rounded-full h-2 overflow-hidden border border-border">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            {packedCount}/{totalItems} Packed ({progressPercent}%)
          </span>
        </div>
      </div>

      {unavailableCount > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Attention:</strong> {unavailableCount} item(s) marked unavailable. Please
            contact customer for replacement approval before dispatching.
          </span>
        </div>
      )}

      {/* Items List */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          const isItemLoading = isPending && activeItemId === item.id
          const currentStatus = item.fulfillment_status || 'pending'

          return (
            <div
              key={item.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-muted border border-border overflow-hidden relative shrink-0 flex items-center justify-center">
                  {item.product?.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {item.product_name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    {item.product?.sku && (
                      <span className="font-mono">SKU: {item.product.sku}</span>
                    )}
                    <span>•</span>
                    <span className="font-bold text-foreground font-mono">
                      Qty: {item.quantity}
                    </span>
                    <span>•</span>
                    <span>
                      <CurrencyDisplay amount={item.selling_price} /> each
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Fulfillment Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                <div className="text-right font-mono font-bold text-xs text-foreground pr-2">
                  <CurrencyDisplay amount={item.total_amount} />
                </div>

                {!readOnly ? (
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => handleStatusChange(item.id, 'picked')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        currentStatus === 'picked'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Picked
                    </button>

                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => handleStatusChange(item.id, 'packed')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        currentStatus === 'packed'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      Packed
                    </button>

                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => handleStatusChange(item.id, 'unavailable')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        currentStatus === 'unavailable'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-rose-600'
                      }`}
                    >
                      Out of Stock
                    </button>
                  </div>
                ) : (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                      currentStatus === 'packed'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : currentStatus === 'unavailable'
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStatus}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
