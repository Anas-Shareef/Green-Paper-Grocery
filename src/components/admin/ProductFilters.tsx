'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Category } from '@/types/database.types'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ProductFiltersProps {
  categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for debounced search
  const currentSearch = searchParams.get('search') || ''
  const [searchValue, setSearchValue] = useState(currentSearch)
  const [prevSearch, setPrevSearch] = useState(currentSearch)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // Current filter values from URL
  const currentCategory = searchParams.get('category') || 'all'
  const currentStatus = searchParams.get('status') || 'active'
  const currentStock = searchParams.get('stock') || 'all'
  const currentSortBy = searchParams.get('sortBy') || 'name'
  const currentSortOrder = searchParams.get('sortOrder') || 'asc'
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''

  // Sync search input if URL changes externally
  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch)
    setSearchValue(currentSearch)
  }

  // Update query params helper
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    // Reset to page 1 whenever any filter changes (except page itself)
    if (!('page' in updates)) {
      params.delete('page')
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        updateFilters({ search: searchValue.trim() || null })
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentCategory !== 'all' ||
    currentStatus !== 'active' ||
    currentStock !== 'all' ||
    Boolean(currentMinPrice) ||
    Boolean(currentMaxPrice)

  const handleClearFilters = () => {
    setSearchValue('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <div className="space-y-3">
      {/* Search and Primary Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, SKU, or barcode..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-8 text-sm h-10 rounded-xl"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Toggle & Sort Button */}
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={currentCategory}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="h-10 px-3 rounded-xl border border-input bg-card text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={currentStock}
            onChange={(e) => updateFilters({ stock: e.target.value })}
            className="h-10 px-3 rounded-xl border border-input bg-card text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤ Reorder)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Expand Advanced Filters */}
          <Button
            type="button"
            variant={isFilterExpanded ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="h-10 px-3 rounded-xl text-xs gap-1.5 shrink-0"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Filters</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`}
            />
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Collapsible Filter Tray */}
      {isFilterExpanded && (
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4 animate-in fade-in-50 slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status (Active / Archived) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Lifecycle Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active Products</option>
                <option value="archived">Archived Products</option>
                <option value="all">All (Active & Archived)</option>
              </select>
            </div>

            {/* Sort Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Sort By
              </label>
              <select
                value={currentSortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="name">Product Name</option>
                <option value="selling_price">Selling Price</option>
                <option value="stock_quantity">Current Stock</option>
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Order
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={currentSortOrder === 'asc' ? 'default' : 'outline'}
                  onClick={() => updateFilters({ sortOrder: 'asc' })}
                  className="h-8 text-xs"
                >
                  Ascending
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={currentSortOrder === 'desc' ? 'default' : 'outline'}
                  onClick={() => updateFilters({ sortOrder: 'desc' })}
                  className="h-8 text-xs"
                >
                  Descending
                </Button>
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Selling Price Range (AED)
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  placeholder="Min"
                  value={currentMinPrice}
                  onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                  className="h-8 text-xs font-mono"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={currentMaxPrice}
                  onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="h-0.5 w-full bg-primary/20 overflow-hidden">
          <div className="h-full bg-primary animate-indeterminate" />
        </div>
      )}
    </div>
  )
}
