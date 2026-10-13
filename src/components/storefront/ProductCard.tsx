'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { useCart } from '@/lib/context/CartContext'
import type { StorefrontProduct } from '@/lib/services/storefront'

interface ProductCardProps {
  product: StorefrontProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart()

  const currentCartItem = items.find((i) => i.id === product.id)
  const cartQty = currentCartItem?.quantity || 0

  const normalPrice = Number(product.selling_price) || 0
  const promoPrice = product.promo_price ? Number(product.promo_price) : null
  const hasPromo = promoPrice !== null && promoPrice > 0 && promoPrice < normalPrice
  const effectivePrice = hasPromo ? promoPrice : normalPrice

  const stock = Number(product.stock_quantity) || 0
  const isOutOfStock = stock <= 0
  const isLowStock = stock > 0 && stock <= 5

  const discountPercent = hasPromo
    ? Math.round(((normalPrice - promoPrice) / normalPrice) * 100)
    : 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return

    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        originalPrice: hasPromo ? normalPrice : undefined,
        unit: product.unit,
        imageUrl: product.image_url,
        maxStock: stock,
      },
      1
    )
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (cartQty >= stock) return
    updateQuantity(product.id, cartQty + 1)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, cartQty - 1)
  }

  return (
    <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-2xs hover:shadow-md hover:border-emerald-600/40 hover:-translate-y-0.5 transition-all duration-200">
      {/* Discount Badge */}
      {hasPromo && (
        <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs tracking-tight">
          {discountPercent}% OFF
        </div>
      )}

      {/* Stock Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        {isOutOfStock ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50">
            Only {stock} left
          </span>
        ) : null}
      </div>

      {/* Product Image */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-50 dark:bg-muted/30 mb-3"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/60 p-4 text-center">
            <ShoppingBag className="h-10 w-10 mb-1 opacity-30 text-emerald-600" />
            <span className="text-[10px] font-semibold text-muted-foreground">Baqqala Fresh</span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category & Unit */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span className="truncate max-w-[120px] font-medium text-emerald-700 dark:text-emerald-400">
              {product.category?.name || 'Grocery'}
            </span>
            <span className="font-mono bg-muted/70 px-1.5 py-0.5 rounded text-[10px] text-foreground font-medium">
              {product.unit}
            </span>
          </div>

          {/* Product Name with Stable Height */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-sm text-foreground line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Add to Cart Container */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-baseline justify-between mb-2 min-h-[1.75rem]">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <CurrencyDisplay
                amount={effectivePrice}
                className="text-base sm:text-lg font-black text-foreground tracking-tight"
              />
              {hasPromo && (
                <CurrencyDisplay
                  amount={normalPrice}
                  className="text-xs line-through text-muted-foreground font-normal"
                />
              )}
            </div>
            {hasPromo && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                Save AED {(normalPrice - promoPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Action Button */}
          {isOutOfStock ? (
            <Button
              disabled
              size="sm"
              variant="outline"
              className="w-full text-xs font-semibold h-9 opacity-60 cursor-not-allowed bg-muted/40 rounded-xl"
            >
              Unavailable
            </Button>
          ) : cartQty > 0 ? (
            <div className="flex items-center justify-between h-9 rounded-xl border border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/40 px-1 shadow-2xs">
              <button
                type="button"
                onClick={handleDecrement}
                className="h-7 w-7 rounded-lg bg-card text-foreground flex items-center justify-center hover:bg-muted shadow-2xs transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-black text-xs text-emerald-800 dark:text-emerald-200 px-2 font-mono">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={cartQty >= stock}
                className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-2xs transition-colors disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleAdd}
              size="sm"
              className="w-full h-9 text-xs font-bold gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
