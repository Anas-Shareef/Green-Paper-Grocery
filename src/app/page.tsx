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
import { getActiveStorefrontPromotions } from '@/lib/services/promotions'
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  MapPin,
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
    getStorefrontFeaturedProducts(8),
    getActiveStorefrontPromotions(),
  ])

  return (
    <StoreLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/20 py-12 md:py-20 border-b border-border/50">
        <div className="store-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/70 shadow-2xs">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zone 19, Abu Dhabi • Local Grocery Hub</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
                Fresh Groceries, <br />
                <span className="text-emerald-600">Delivered Fast</span> to Your Door
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Farm-fresh vegetables, dairy, rice, bakery, and daily pantry staples delivered direct to your villa or apartment in Zone 19. Authentic quality and fair AED pricing.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href="/shop">
                  <Button
                    size="lg"
                    className="h-12 px-7 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all"
                  >
                    <ShoppingBag className="h-4 w-4" /> Shop Fresh Groceries
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 rounded-2xl font-bold text-sm border-border hover:bg-muted active:scale-[0.98] transition-all"
                  >
                    Browse Categories
                  </Button>
                </Link>
              </div>

              {/* Hero Trust Micro-Row */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-semibold">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                    ✓
                  </div>
                  <span>Zone 19 Express Fulfillment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                    ✓
                  </div>
                  <span>Cash & Card on Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                    ✓
                  </div>
                  <span>100% Genuine Retail Prices in AED</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Grocery Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card p-6 sm:p-8 shadow-xl shadow-emerald-900/5 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Baqqala Quick Basket
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                    In Stock Now
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between shadow-2xs hover:border-emerald-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-2xs">
                        🥛
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground">Fresh Dairy & Laban</h4>
                        <p className="text-[11px] text-muted-foreground">Cold-chain restocked daily</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                      Fresh
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between shadow-2xs hover:border-emerald-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-2xs">
                        🥬
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground">Vegetables & Herbs</h4>
                        <p className="text-[11px] text-muted-foreground">Crisp farm harvests</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                      Crisp
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between shadow-2xs hover:border-emerald-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-2xs">
                        🍞
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground">Bakery & Basmati Rice</h4>
                        <p className="text-[11px] text-muted-foreground">Essential pantry staples</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                      Staples
                    </span>
                  </div>
                </div>

                <Link href="/shop" className="block pt-2">
                  <Button variant="outline" className="w-full h-11 rounded-xl text-xs font-bold justify-between group hover:border-emerald-500 hover:text-emerald-700 transition-colors">
                    <span>Explore All Items in Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Convenience 4-Card Strip (PRD Section F) */}
      <section className="border-b border-border bg-card/60 py-8">
        <div className="store-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Zone 19 Express</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Fast neighborhood delivery direct to your villa or building.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Daily Fresh Restock</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Farm produce, dairy & pantry staples restocked every morning.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Transparent AED Pricing</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  100% genuine retail prices in AED with standard 5% UAE VAT.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-foreground">Local Community Trust</h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  Dedicated customer service rooted in Zone 19, Abu Dhabi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Active Commercial Promotions (Phase 8 - PRD Section C) */}
      {activePromotions.length > 0 && (
        <section className="py-8 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-border/60">
          <div className="store-container">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-emerald-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
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

      {/* 2. Categories Section (PRD Section B) */}
      <section className="py-12 md:py-16 store-container">
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

      {/* 3. Popular & Featured Products Section (PRD Section D) */}
      <section className="py-12 md:py-16 bg-muted/20 border-y border-border/50">
        <div className="store-container">
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

      {/* 4. Local Community Banner (PRD Section G) */}
      <section className="py-12 md:py-16 store-container">
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
