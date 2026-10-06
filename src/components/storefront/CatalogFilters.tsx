'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter, X, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StorefrontCategoryWithCount } from '@/lib/services/storefront'

interface CatalogFiltersProps {
  categories: StorefrontCategoryWithCount[]
}

export function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Current filter values from URL
  const currentCategory = searchParams.get('category') || 'all'
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentInStock = searchParams.get('inStock') === 'true'

  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice)
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice)

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    // Reset page to 1 whenever filters change
    params.delete('page')

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all') {
        params.delete(key)
      } else {
        params.set(key, val)
      }
    })

    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({
      minPrice: minPriceInput ? minPriceInput : null,
      maxPrice: maxPriceInput ? maxPriceInput : null,
    })
  }

  const handleResetFilters = () => {
    setMinPriceInput('')
    setMaxPriceInput('')
    router.push('/shop')
  }

  const activeFiltersCount =
    (currentCategory !== 'all' ? 1 : 0) +
    (currentMinPrice ? 1 : 0) +
    (currentMaxPrice ? 1 : 0) +
    (currentInStock ? 1 : 0)

  const filterContent = (
    <div className="space-y-6">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-foreground">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-muted-foreground hover:text-emerald-600 flex items-center gap-1 font-medium transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Categories
        </label>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => updateFilters({ category: 'all' })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
              currentCategory === 'all'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters({ category: cat.slug })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {cat.product_count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-emerald-700 text-white' : 'text-muted-foreground bg-muted'
                    }`}
                  >
                    {cat.product_count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Range (AED) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Price Range (AED)
        </label>
        <form onSubmit={handlePriceFilterSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              min="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="h-8 text-xs px-2 rounded-lg bg-muted/40"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <Input
              type="number"
              placeholder="Max"
              min="0"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="h-8 text-xs px-2 rounded-lg bg-muted/40"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs font-semibold"
          >
            Apply Price
          </Button>
        </form>
      </div>

      {/* Availability Toggle */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Availability
        </label>
        <button
          type="button"
          onClick={() =>
            updateFilters({ inStock: currentInStock ? null : 'true' })
          }
          className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none"
        >
          <div
            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
              currentInStock
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-border bg-card'
            }`}
          >
            {currentInStock && <Check className="h-3 w-3" />}
          </div>
          <span>In Stock Only</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Filter Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 rounded-2xl border border-border bg-card p-5 shadow-xs h-fit sticky top-20">
        {filterContent}
      </aside>

      {/* Mobile Trigger Button */}
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMobileDrawerOpen(true)}
          className="h-9 gap-2 text-xs font-semibold rounded-xl border-border"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Mobile Slide-Over Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Slide-over panel */}
            <div className="relative ml-auto w-full max-w-xs bg-card p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <h3 className="font-bold text-base text-foreground">Filter Products</h3>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {filterContent}
              </div>

              <div className="pt-6 border-t border-border mt-6">
                <Button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  View Results
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
