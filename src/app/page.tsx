import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { ProductCard } from '@/components/storefront/ProductCard'
import { CategoryCard } from '@/components/storefront/CategoryCard'
import { Button } from '@/components/ui/button'
import {
  getStorefrontCategories,
  getStorefrontFeaturedProducts,
} from '@/lib/services/storefront'
import { getActiveStorefrontPromotions } from '@/lib/services/promotions'
import {
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Clock,
  Truck,
  HeartHandshake,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StorefrontHomePage() {
  const [categories, featuredProducts, activePromotions] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontFeaturedProducts(12),
    getActiveStorefrontPromotions(),
  ])

  // Top Saver products (first 6 items for the 3-column grid)
  const topSaverProducts = featuredProducts.slice(0, 6)
  // General catalog featured products (next 4-8 items)
  const regularFeatured = featuredProducts.slice(4, 12)

  return (
    <StoreLayout>
      <div className="space-y-12 md:space-y-16 pb-16">
        {/* ========================================================================= */}
        {/* 1. FreshMart-Style Main Hero Banner                                      */}
        {/* ========================================================================= */}
        <section className="pt-6 sm:pt-8">
          <div className="store-container">
            <div className="relative overflow-hidden rounded-3xl lg:rounded-[2.5rem] bg-[#eaf5eb] dark:bg-emerald-950/25 border border-emerald-100/70 dark:border-emerald-900/40 p-8 sm:p-12 lg:p-16 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Column: Typography, Subtitle & Action */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5 z-10">
                  {/* Category / Badge Label */}
                  <span className="inline-block text-[11px] sm:text-xs font-black uppercase tracking-widest text-neutral-800 dark:text-neutral-200">
                    ALL NATURAL PRODUCTS
                  </span>

                  {/* Confident FreshMart Heading */}
                  <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-foreground leading-[1.06]">
                    Fresh and Healthy <br />
                    <span className="text-emerald-700 dark:text-emerald-400">Veggies Organic</span> <br />
                    Market
                  </h1>

                  {/* Supporting Copy */}
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md pt-1">
                    Organic food is food produced by methods that comply with the standard of farming. Fast delivery direct to your home across Zone 19, Abu Dhabi.
                  </p>

                  {/* Solid Green SHOP NOW Button */}
                  <div className="pt-4 sm:pt-6 flex items-center gap-4">
                    <Link href="/shop">
                      <Button
                        size="lg"
                        className="h-12 px-9 rounded-xl font-black text-xs uppercase tracking-wider bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all"
                      >
                        SHOP NOW
                      </Button>
                    </Link>
                    <Link href="/categories">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-7 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/80 dark:bg-card/80 border-emerald-200/60 dark:border-emerald-800/60 text-foreground hover:bg-white active:scale-[0.98] transition-all"
                      >
                        All Categories
                      </Button>
                    </Link>
                  </div>

                  {/* Carousel Pagination Dots */}
                  <div className="flex items-center gap-2 pt-6 sm:pt-8">
                    <span className="h-2 w-7 rounded-full bg-[#16a34a] transition-all" />
                    <span className="h-2 w-2 rounded-full bg-emerald-200/90 dark:bg-emerald-800" />
                    <span className="h-2 w-2 rounded-full bg-emerald-200/90 dark:bg-emerald-800" />
                    <span className="h-2 w-2 rounded-full bg-emerald-200/90 dark:bg-emerald-800" />
                  </div>
                </div>

                {/* Right Column: Fresh Grocery Basket Showcase */}
                <div className="lg:col-span-5 relative flex items-center justify-center">
                  <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm">
                    <Image
                      src="/images/hero-grocery-basket.jpg"
                      alt="Fresh and Healthy Veggies Organic Market - Baqqala Grocery"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover object-center hover:scale-103 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. "Top Saver Today" Flash Deals Section (Matches Reference Image 2)      */}
        {/* ========================================================================= */}
        <section className="store-container">
          {/* Top Saver Header Row with Countdown Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Top Saver Today
              </h2>
              <div className="h-0.5 w-14 bg-emerald-600 mt-1.5 rounded-full" />
            </div>

            {/* Countdown Timer Badges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="h-7 w-7 rounded-full bg-[#ef4444] text-white font-mono font-black flex items-center justify-center shadow-2xs">
                  15
                </span>
                <span className="text-[#ef4444] font-black">:</span>
                <span className="h-7 w-7 rounded-full bg-[#ef4444] text-white font-mono font-black flex items-center justify-center shadow-2xs">
                  43
                </span>
                <span className="text-[#ef4444] font-black">:</span>
                <span className="h-7 w-7 rounded-full bg-[#ef4444] text-white font-mono font-black flex items-center justify-center shadow-2xs">
                  10
                </span>
                <span className="text-[#ef4444] font-black">:</span>
                <span className="h-7 w-7 rounded-full bg-[#ef4444] text-white font-mono font-black flex items-center justify-center shadow-2xs">
                  21
                </span>
              </div>

              <Link
                href="/shop"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
              >
                View All
              </Link>
            </div>
          </div>

          {/* 3-Column Split Horizontal Cards Grid (Exact FreshMart Layout) */}
          {topSaverProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {topSaverProducts.map((product) => (
                <ProductCard key={product.id} product={product} variant="saver" />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
              No saver items available right now. Check back shortly.
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. Shop by Category Section                                              */}
        {/* ========================================================================= */}
        <section className="store-container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                Organized Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
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

        {/* ========================================================================= */}
        {/* 4. Active Commercial Promotions Banner (Phase 8)                         */}
        {/* ========================================================================= */}
        {activePromotions.length > 0 && (
          <section className="py-8 bg-emerald-50/50 dark:bg-emerald-950/20 border-y border-border/60">
            <div className="store-container">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Special Offers & Active Campaigns
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activePromotions.slice(0, 3).map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 bg-card p-4 shadow-2xs flex items-center justify-between gap-3 hover:shadow-xs transition-shadow"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-foreground block">
                        {promo.name}
                      </span>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {promo.description || promo.banner_text || 'Save on your fresh grocery basket'}
                      </p>
                      {promo.minimum_order_amount > 0 && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          Min. Spend AED {promo.minimum_order_amount}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-2xs block">
                        {promo.discount_type === 'percentage'
                          ? `${promo.discount_value}% OFF`
                          : `AED ${promo.discount_value} OFF`}
                      </span>
                      <Link
                        href="/shop"
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline mt-1 inline-block"
                      >
                        Shop Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. Popular Essentials in Zone 19                                          */}
        {/* ========================================================================= */}
        {regularFeatured.length > 0 && (
          <section className="store-container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
                  <Sparkles className="h-3.5 w-3.5" /> Best Picks for You
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
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

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
              {regularFeatured.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. Four Benefit Cards (Pill Strip)                                       */}
        {/* ========================================================================= */}
        <section className="store-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Express Delivery</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Fast neighborhood dispatch direct to your villa or flat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Daily Fresh Restock</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Farm produce, dairy & bakery refreshed every morning.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Transparent Pricing</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  100% genuine retail prices in AED with standard 5% VAT.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Community Trust</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Rooted in Zone 19, Abu Dhabi neighborhood community.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StoreLayout>
  )
}
