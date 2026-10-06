import React from 'react'
import Link from 'next/link'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { ProductCard } from '@/components/storefront/ProductCard'
import { CategoryCard } from '@/components/storefront/CategoryCard'
import { Button } from '@/components/ui/button'
import {
  getStorefrontCategories,
  getStorefrontFeaturedProducts,
} from '@/lib/services/storefront'
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  MapPin,
} from 'lucide-react'

export const revalidate = 60 // Revalidate home page every minute

export default async function StorefrontHomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontFeaturedProducts(8),
  ])

  return (
    <StoreLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/20 py-10 md:py-16 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zone 19, Abu Dhabi Local Fulfillment</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                Fresh Groceries, <br />
                <span className="text-emerald-600">Delivered Fast</span> in Zone 19
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Farm-fresh vegetables, dairy, rice, bakery, and daily pantry staples delivered direct to your door. Authentic quality, fair AED pricing, and fast local delivery.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/shop">
                  <Button
                    size="lg"
                    className="h-12 px-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-600/30"
                  >
                    <ShoppingBag className="h-4 w-4" /> Shop Fresh Products
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 rounded-xl font-bold text-sm border-border hover:bg-muted"
                  >
                    Browse Categories
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span>Free delivery over AED 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span>Cash & Card on Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span>30-min express fulfillment</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-emerald-600/20 bg-gradient-to-br from-emerald-600/10 via-emerald-600/5 to-transparent p-6 sm:p-8 shadow-lg space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Baqqala Quick Basket
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    Live Stock
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                        🥛
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-foreground">Fresh Dairy & Milk</h4>
                        <p className="text-[11px] text-muted-foreground">Cold-chain restocked daily</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Fresh</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                        🥬
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-foreground">Vegetables & Greens</h4>
                        <p className="text-[11px] text-muted-foreground">Crisp farm harvests</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Organic</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                        🍞
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-foreground">Bakery & Pantry</h4>
                        <p className="text-[11px] text-muted-foreground">Basmati rice, tea, oils & bread</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Staples</span>
                  </div>
                </div>

                <Link href="/shop" className="block pt-2">
                  <Button variant="outline" className="w-full rounded-xl text-xs font-bold justify-between group">
                    <span>Explore All Items in Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Section */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 block mb-1">
              Organized Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            All Categories <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
            Categories currently updating. Check back shortly.
          </div>
        )}
      </section>

      {/* 3. Popular & Featured Products Section */}
      <section className="py-12 md:py-16 bg-muted/20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> Best Picks for You
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Popular in Zone 19
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              View Full Catalog <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground text-xs">
              No products found. Please check back later.
            </div>
          )}
        </div>
      </section>

      {/* 4. Local Community Banner */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-emerald-200 border border-white/20">
              Direct to Your Villa or Apartment
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Order Your Daily Grocery in Seconds
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              No long queues or traffic. Baqqala delivers milk, bread, vegetables, and pantry staples straight to your doorstep across Zone 19 with trusted neighborhood service.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/shop">
                <Button size="lg" className="rounded-xl font-bold text-xs bg-white text-emerald-900 hover:bg-emerald-50">
                  Start Shopping Now
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" className="rounded-xl font-bold text-xs border-white/30 text-white hover:bg-white/10">
                  Browse All Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  )
}
