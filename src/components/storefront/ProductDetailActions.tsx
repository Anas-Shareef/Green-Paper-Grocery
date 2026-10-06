'use client'

import React, { useState } from 'react'
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/CartContext'
import type { StorefrontProduct } from '@/lib/services/storefront'

interface ProductDetailActionsProps {
  product: StorefrontProduct
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { addItem, items } = useCart()

  const currentCartItem = items.find((i) => i.id === product.id)
  const cartQty = currentCartItem?.quantity || 0

  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const stock = Number(product.stock_quantity) || 0
  const isOutOfStock = stock <= 0

  const normalPrice = Number(product.selling_price) || 0
  const promoPrice = product.promo_price ? Number(product.promo_price) : null
  const hasPromo = promoPrice !== null && promoPrice > 0 && promoPrice < normalPrice
  const effectivePrice = hasPromo ? promoPrice : normalPrice

  const handleAddToCart = () => {
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
      quantity
    )

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity((q) => q + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1)
    }
  }

  if (isOutOfStock) {
    return (
      <div className="space-y-3 pt-4 border-t border-border">
        <Button
          disabled
          className="w-full h-12 rounded-xl text-sm font-semibold opacity-60 cursor-not-allowed bg-muted"
        >
          Out of Stock
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          This item is temporarily out of stock. We restock daily from Abu Dhabi suppliers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      {cartQty > 0 && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 text-xs flex items-center justify-between">
          <span>Currently in your cart:</span>
          <span className="font-bold font-mono">{cartQty} in cart</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Quantity Controller */}
        <div className="flex items-center h-12 rounded-xl border border-border bg-card px-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="h-8 w-8 rounded-lg bg-muted/60 text-foreground flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-bold text-sm text-foreground font-mono">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= stock}
            className="h-8 w-8 rounded-lg bg-muted/60 text-foreground flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <Button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs transition-all active:scale-[0.98]"
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" /> Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
