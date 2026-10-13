import React from 'react'
import Link from 'next/link'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { CategoryCard } from '@/components/storefront/CategoryCard'
import { getStorefrontCategories } from '@/lib/services/storefront'

export const metadata = {
  title: 'Grocery Categories',
  description: 'Explore all fresh grocery categories in Baqqala Grocery, Zone 19, Abu Dhabi.',
}

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await getStorefrontCategories()

  return (
    <StoreLayout>
      <div className="store-container py-10 md:py-14 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-2 pb-6 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Categories</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Browse All Grocery Categories
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            From farm-fresh vegetables and local dairy to pantry staples and household goods, explore our organized grocery sections in Zone 19.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center text-xs text-muted-foreground">
            No active categories found.
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
