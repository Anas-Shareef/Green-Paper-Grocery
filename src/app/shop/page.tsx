import React from 'react'
import Link from 'next/link'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { ProductCard } from '@/components/storefront/ProductCard'
import { CatalogFilters } from '@/components/storefront/CatalogFilters'
import { CatalogSort } from '@/components/storefront/CatalogSort'
import { Button } from '@/components/ui/button'
import {
  getStorefrontCategories,
  getStorefrontCatalog,
  type CatalogFilterParams,
} from '@/lib/services/storefront'
import { ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    inStock?: string
    page?: string
  }>
}

export const metadata = {
  title: 'Shop Fresh Groceries',
  description: 'Browse fresh vegetables, dairy, pantry essentials, and beverages in Zone 19, Abu Dhabi.',
}

export default async function ShopCatalogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams

  const page = parseInt(resolvedParams.page || '1', 10)
  const minPrice = resolvedParams.minPrice ? parseFloat(resolvedParams.minPrice) : undefined
  const maxPrice = resolvedParams.maxPrice ? parseFloat(resolvedParams.maxPrice) : undefined
  const inStockOnly = resolvedParams.inStock === 'true'

  const catalogParams: CatalogFilterParams = {
    query: resolvedParams.q,
    categorySlug: resolvedParams.category,
    minPrice,
    maxPrice,
    sortBy: resolvedParams.sort as CatalogFilterParams['sortBy'],
    inStockOnly,
    page,
    limit: 16,
  }

  const [categories, catalogResult] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontCatalog(catalogParams),
  ])

  const { products, total, totalPages } = catalogResult

  const activeCategory = categories.find((c) => c.slug === resolvedParams.category)

  return (
    <StoreLayout>
      <div className="store-container py-8 md:py-10">
        {/* Header Breadcrumb & Title */}
        <div className="mb-6 space-y-2 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Shop</span>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-emerald-600 font-bold">{activeCategory.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {activeCategory ? activeCategory.name : 'All Grocery Products'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {products.length} of {total} available items in Zone 19
              </p>
            </div>

            {/* Mobile Filters Trigger & Sorting */}
            <div className="flex items-center gap-3">
              <CatalogFilters categories={categories} mode="mobile" />
              <CatalogSort />
            </div>
          </div>
        </div>

        {/* Active Query Badge */}
        {resolvedParams.q && (
          <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 text-xs">
            <span>
              Search results for: <strong>&ldquo;{resolvedParams.q}&rdquo;</strong>
            </span>
            <Link href="/shop" className="hover:text-emerald-950 dark:hover:text-white" aria-label="Clear query">
              <X className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex items-start gap-8">
          {/* Desktop Left Filter Sidebar */}
          <CatalogFilters categories={categories} mode="desktop" />

          {/* Right Product Grid */}
          <div className="flex-1 min-w-0">
            {products.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-8 border-t border-border">
                    {page > 1 ? (
                      <Link
                        href={`/shop?${new URLSearchParams({
                          ...resolvedParams,
                          page: String(page - 1),
                        }).toString()}`}
                      >
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold rounded-xl">
                          <ChevronLeft className="h-3.5 w-3.5" /> Previous
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="h-9 gap-1.5 text-xs opacity-50 rounded-xl">
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </Button>
                    )}

                    <span className="text-xs font-semibold text-muted-foreground px-3">
                      Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong>
                    </span>

                    {page < totalPages ? (
                      <Link
                        href={`/shop?${new URLSearchParams({
                          ...resolvedParams,
                          page: String(page + 1),
                        }).toString()}`}
                      >
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold rounded-xl">
                          Next <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="h-9 gap-1.5 text-xs opacity-50 rounded-xl">
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 sm:p-16 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-7 w-7 text-emerald-600 opacity-60" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base text-foreground">No Products Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    We couldn&apos;t find any grocery products matching your current filters. Try resetting the filters or searching for another grocery item.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/shop">
                    <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl h-9 px-4">
                      Clear All Filters
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
