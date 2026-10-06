import Link from 'next/link'
import { getProductsList, getCategories } from '@/lib/services/products'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProductFilters } from '@/components/admin/ProductFilters'
import { ProductTable } from '@/components/admin/ProductTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { requirePermission } from '@/lib/auth/permissions'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: 'all' | 'active' | 'archived'
    stock?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
    sortBy?: 'name' | 'selling_price' | 'stock_quantity' | 'created_at' | 'updated_at'
    sortOrder?: 'asc' | 'desc'
    minPrice?: string
    maxPrice?: string
    page?: string
  }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requirePermission('products.view')
  const resolvedParams = await searchParams

  const page = parseInt(resolvedParams.page || '1', 10) || 1
  const minPrice = resolvedParams.minPrice ? parseFloat(resolvedParams.minPrice) : undefined
  const maxPrice = resolvedParams.maxPrice ? parseFloat(resolvedParams.maxPrice) : undefined

  const [productsResult, categories] = await Promise.all([
    getProductsList({
      search: resolvedParams.search,
      categoryId: resolvedParams.category,
      status: resolvedParams.status || 'active',
      stockStatus: resolvedParams.stock || 'all',
      sortBy: resolvedParams.sortBy || 'name',
      sortOrder: resolvedParams.sortOrder || 'asc',
      minPrice,
      maxPrice,
      page,
      limit: 15,
    }),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products Catalog"
        description="Comprehensive product catalog with SKU, barcode, unit, and multi-tier pricing guardrails."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Products' },
        ]}
        actions={
          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <ProductFilters categories={categories} />

      {/* Product Data Presentation */}
      <ProductTable
        products={productsResult.products}
        total={productsResult.total}
        page={productsResult.page}
        limit={productsResult.limit}
        totalPages={productsResult.totalPages}
      />
    </div>
  )
}
