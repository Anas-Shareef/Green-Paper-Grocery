import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { ProductCard } from '@/components/storefront/ProductCard'
import { ProductDetailActions } from '@/components/storefront/ProductDetailActions'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import {
  getStorefrontProductBySlug,
  getStorefrontRelatedProducts,
} from '@/lib/services/storefront'
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getStorefrontProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found | Baqqala Grocery',
    }
  }

  return {
    title: `${product.name} | Baqqala Grocery Zone 19`,
    description:
      product.description ||
      `Buy ${product.name} at Baqqala Grocery with fast express delivery in Zone 19, Abu Dhabi.`,
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getStorefrontProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getStorefrontRelatedProducts(
    product.category_id,
    product.id,
    4
  )

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

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="hover:text-foreground"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-[200px]">
            {product.name}
          </span>
        </div>

        {/* Product Showcase Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Product Image Box */}
          <div className="relative aspect-square w-full rounded-3xl border border-border bg-card p-8 flex items-center justify-center shadow-xs overflow-hidden">
            {hasPromo && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm">
                {discountPercent}% OFF
              </div>
            )}

            {product.image_url ? (
              <div className="relative h-full w-full">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-4"
                  priority
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-8 text-center">
                <ShoppingBag className="h-20 w-20 mb-3 opacity-30" />
                <span className="text-xs font-semibold">Baqqala Fresh Produce</span>
              </div>
            )}
          </div>

          {/* Right: Product Details and Actions */}
          <div className="space-y-6">
            <div>
              {/* Category & Brand */}
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">
                {product.category && (
                  <Link
                    href={`/shop?category=${product.category.slug}`}
                    className="hover:underline"
                  >
                    {product.category.name}
                  </Link>
                )}
                {product.brand && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{product.brand}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Unit Tag */}
              <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                <span>Unit:</span>
                <strong className="text-foreground font-mono">{product.unit}</strong>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex items-baseline gap-3 flex-wrap">
              <CurrencyDisplay
                amount={effectivePrice}
                className="text-3xl font-black text-foreground"
              />
              {hasPromo && (
                <div className="flex items-baseline gap-2">
                  <CurrencyDisplay
                    amount={normalPrice}
                    className="text-base line-through text-muted-foreground font-normal"
                  />
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                    Save AED {(normalPrice - promoPrice).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Stock Availability Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {isOutOfStock ? (
                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200/40">
                  <XCircle className="h-4 w-4" />
                  <span>Currently Out of Stock</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200/40">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Low Stock — Only {stock} units available</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/40">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>In Stock — Ready for Zone 19 delivery</span>
                </div>
              )}
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Product Description
                </h4>
                <p>{product.description}</p>
              </div>
            )}

            {/* Action Bar (Quantity + Add to Cart) */}
            <ProductDetailActions product={product} />

            {/* Trust Assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zone 19 Express Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Fast 30-min fulfillment</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>100% Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Related Grocery Items
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customers also bought these items from {product.category?.name || 'this category'}
                </p>
              </div>
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  View More →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
