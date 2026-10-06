import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import type { StorefrontCategoryWithCount } from '@/lib/services/storefront'

interface CategoryCardProps {
  category: StorefrontCategoryWithCount
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group relative flex flex-col items-center justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 text-center shadow-xs hover:border-emerald-600/40 hover:shadow-md transition-all overflow-hidden"
    >
      {/* Category Image or Icon */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            sizes="96px"
            className="object-contain p-2"
          />
        ) : (
          <ShoppingBag className="h-9 w-9 text-emerald-600 dark:text-emerald-400 opacity-80" />
        )}
      </div>

      <div className="space-y-1 w-full">
        <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-emerald-600 transition-colors truncate">
          {category.name}
        </h3>
        <p className="text-xs text-muted-foreground font-medium">
          {category.product_count !== undefined ? `${category.product_count} items` : 'Explore'}
        </p>
      </div>
    </Link>
  )
}
