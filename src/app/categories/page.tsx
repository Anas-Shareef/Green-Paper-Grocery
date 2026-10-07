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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Categories</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Browse All Categories
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            From farm-fresh vegetables and dairy to pantry staples and household goods, browse our curated grocery sections.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
            No active categories found.
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
