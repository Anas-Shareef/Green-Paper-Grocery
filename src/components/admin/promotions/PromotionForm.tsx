'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { handleCreatePromotion } from '@/app/admin/promotions/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tag,
  Percent,
  Calendar,
  Layers,
  ArrowLeft,
} from 'lucide-react'
import type { PromotionType, DiscountType } from '@/types/database.types'

interface PromotionFormProps {
  products: Array<{ id: string; name: string; selling_price: number }>
  categories: Array<{ id: string; name: string }>
}

export function PromotionForm({ products, categories }: PromotionFormProps) {
  const [promoType, setPromoType] = useState<PromotionType>('product')
  const [discountType, setDiscountType] = useState<DiscountType>('percentage')
  const [discountValue, setDiscountValue] = useState<string>('10')
  const [minOrder, setMinOrder] = useState<string>('0')
  const [maxDiscount, setMaxDiscount] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  )
  const [endDate, setEndDate] = useState<string>('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  return (
    <form action={handleCreatePromotion} className="space-y-8 max-w-4xl">
      {/* 1. Basic Information */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Tag className="h-4 w-4 text-emerald-600" />
          <h2 className="font-bold text-base text-foreground">1. Basic Campaign Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-semibold text-foreground">Promotion Name *</label>
            <Input
              required
              name="name"
              placeholder="e.g. Fresh Veggies Weekend 15% OFF"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-semibold text-foreground">Description / Terms</label>
            <Input
              name="description"
              placeholder="e.g. 15% discount on all fresh produce categories during the weekend"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Promotion Target Type *</label>
            <select
              name="promotion_type"
              value={promoType}
              onChange={(e) => setPromoType(e.target.value as PromotionType)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="product">Selected Products</option>
              <option value="category">Category-wide</option>
              <option value="cart">Entire Cart</option>
              <option value="minimum_spend">Minimum Spend Threshold</option>
              <option value="first_order">First-Order Only</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Initial Status</label>
            <select
              name="status"
              defaultValue="active"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active (Immediate)</option>
              <option value="scheduled">Scheduled</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Discount & Monetary Rules */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Percent className="h-4 w-4 text-emerald-600" />
          <h2 className="font-bold text-base text-foreground">2. Discount & Monetary Safeguards</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Discount Type *</label>
            <select
              name="discount_type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed_amount">Fixed Amount (AED)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Discount Value {discountType === 'percentage' ? '(%)' : '(AED)'} *
            </label>
            <Input
              required
              type="number"
              step="0.01"
              min="0.01"
              max={discountType === 'percentage' ? '100' : undefined}
              name="discount_value"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Maximum Discount Cap (AED)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="maximum_discount_amount"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="e.g. 50 (leave empty for none)"
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Minimum Qualifying Order (AED)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="minimum_order_amount"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="0.00"
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-semibold text-foreground">Storefront Banner / Badge Headline</label>
            <Input
              name="banner_text"
              placeholder="e.g. WEEKEND SPECIAL • SAVE 15%"
              className="h-10 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Target Scope (Products / Categories) */}
      {promoType === 'product' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-base text-foreground">3. Applicable Products</h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Select the specific grocery items eligible for this promotion:
          </p>

          <div className="max-h-60 overflow-y-auto divide-y divide-border border rounded-2xl p-2 bg-muted/20">
            {products.map((p) => {
              const checked = selectedProductIds.includes(p.id)
              return (
                <label
                  key={p.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-xl cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="product_ids"
                      value={p.id}
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      className="h-4 w-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-foreground">{p.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">AED {p.selling_price}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {promoType === 'category' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-base text-foreground">3. Applicable Categories</h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Select entire categories whose items will receive the promotion:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => {
              const checked = selectedCategoryIds.includes(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                    checked
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                      : 'border-border bg-card text-foreground hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="category_ids"
                    value={c.id}
                    checked={checked}
                    onChange={() => toggleCategory(c.id)}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  <span>{c.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Scheduling & Usage Limits */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <h2 className="font-bold text-base text-foreground">4. Schedule & Usage Limits</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Start Time (UTC) *</label>
            <Input
              required
              type="datetime-local"
              name="start_at"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">End Time (Optional)</label>
            <Input
              type="datetime-local"
              name="end_at"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Total Usage Limit (Overall)</label>
            <Input
              type="number"
              min="1"
              name="usage_limit"
              placeholder="e.g. 500 (leave empty for unlimited)"
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Per-Customer Usage Limit</label>
            <Input
              type="number"
              min="1"
              name="per_customer_limit"
              placeholder="e.g. 1 (leave empty for unlimited)"
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="is_exclusive"
                className="h-4 w-4 text-emerald-600 rounded"
              />
              <span className="font-semibold text-foreground">
                Exclusive Campaign (Cannot be combined with any coupons)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Link href="/admin/promotions">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Promotions
          </Button>
        </Link>

        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-xs"
        >
          Create & Activate Promotion
        </Button>
      </div>
    </form>
  )
}
