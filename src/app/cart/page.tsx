'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { useCart } from '@/lib/context/CartContext'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react'

export default function CartPage() {
  return (
    <StoreLayout>
      <CartContent />
    </StoreLayout>
  )
}

function CartContent() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, isLoaded } = useCart()

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-muted-foreground">
        Loading your cart...
      </div>
    )
  }

  // Calculate pricing breakdown
  const taxRate = 0.05 // 5% UAE standard VAT
  const taxAmount = Number((subtotal * taxRate).toFixed(2))
  const freeDeliveryThreshold = 100
  const deliveryFee = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : 10
  const grandTotal = Number((subtotal + taxAmount + deliveryFee).toFixed(2))

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Title */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Shopping Cart
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review your items and proceed to checkout for Zone 19 delivery
            </p>
          </div>
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear Cart
            </Button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free delivery progress banner */}
              {subtotal < freeDeliveryThreshold && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span>
                      Add <strong>AED {amountNeededForFreeDelivery.toFixed(2)}</strong> more to get <strong>FREE delivery</strong>!
                    </span>
                  </div>
                  <Link href="/shop" className="font-bold underline text-emerald-700 hover:text-emerald-800">
                    Add Items
                  </Link>
                </div>
              )}

              {/* Items Table / Cards */}
              <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
                {items.map((item) => {
                  const lineTotal = item.price * item.quantity
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted/40 shrink-0 overflow-hidden border border-border/50"
                        >
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-contain p-1.5"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/60">
                              <ShoppingBag className="h-6 w-6 opacity-40" />
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 space-y-1">
                          <Link href={`/product/${item.slug}`} className="block">
                            <h3 className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors truncate">
                              {item.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Unit: {item.unit}</span>
                            <span>•</span>
                            <CurrencyDisplay amount={item.price} className="font-semibold text-foreground" />
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controller & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        {/* Quantity Counter */}
                        <div className="flex items-center h-9 rounded-xl border border-border bg-card px-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 rounded-lg bg-card text-foreground flex items-center justify-center hover:bg-muted"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-9 text-center font-bold text-xs text-foreground font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="h-7 w-7 rounded-lg bg-card text-foreground flex items-center justify-center hover:bg-muted disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[80px]">
                          <CurrencyDisplay
                            amount={lineTotal}
                            className="font-bold text-sm text-foreground"
                          />
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Continue Shopping Button */}
              <div className="pt-2">
                <Link href="/shop">
                  <Button variant="outline" className="text-xs font-semibold rounded-xl">
                    ← Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="font-extrabold text-lg text-foreground">Order Summary</h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <CurrencyDisplay amount={subtotal} className="text-foreground font-semibold" />
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Estimated 5% UAE VAT</span>
                  <CurrencyDisplay amount={taxAmount} className="text-foreground font-semibold" />
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Delivery Fee</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded font-mono">
                      Zone 19
                    </span>
                  </div>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    <CurrencyDisplay amount={deliveryFee} className="text-foreground font-semibold" />
                  )}
                </div>

                <div className="h-px bg-border my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-bold text-sm text-foreground">Grand Total</span>
                  <CurrencyDisplay
                    amount={grandTotal}
                    className="text-xl font-black text-emerald-600"
                  />
                </div>
              </div>

              {/* Checkout CTA */}
              <Link href="/checkout" className="block">
                <Button className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs transition-all active:scale-[0.98]">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              {/* Security & Guarantees */}
              <div className="pt-4 border-t border-border space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Secure checkout with atomic stock reservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery or Card on Delivery</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-16 text-center space-y-5 max-w-lg mx-auto">
            <div className="h-16 w-16 rounded-3xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-foreground">Your Cart is Empty</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You haven&apos;t added any grocery items yet. Explore fresh vegetables, dairy, rice, and daily necessities.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/shop">
                <Button className="h-11 px-6 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <ShoppingBag className="h-4 w-4" /> Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
  )
}
