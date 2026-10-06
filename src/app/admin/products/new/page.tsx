import { getCategories } from '@/lib/services/products'
import { createProductAction } from '@/app/admin/products/actions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProductForm } from '@/components/admin/ProductForm'
import { requirePermission } from '@/lib/auth/permissions'

export default async function NewProductPage() {
  await requirePermission('products.create')
  const categories = await getCategories()

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <AdminPageHeader
        title="Add New Product"
        description="Catalog a new grocery product with multi-tier pricing guardrails, barcode scanning, and initial stock."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Products', href: '/admin/products' },
          { label: 'New Product' },
        ]}
      />

      <ProductForm
        categories={categories}
        onSubmit={async (data) => {
          'use server'
          return createProductAction(data)
        }}
      />
    </div>
  )
}
