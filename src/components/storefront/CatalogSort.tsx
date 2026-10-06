'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

export function CatalogSort() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort') || 'featured'

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block" />
      <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-emerald-600 cursor-pointer"
      >
        <option value="featured">Featured / Best Picks</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="name_asc">Name: A to Z</option>
        <option value="newest">Newest Arrivals</option>
      </select>
    </div>
  )
}
