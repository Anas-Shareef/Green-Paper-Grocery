import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { PurchaseOrderForm } from '@/components/admin/purchases/PurchaseOrderForm'
import type { Supplier, Product } from '@/types/database.types'

interface PageProps {
  searchParams: Promise<{ supplierId?: string }>
}

export default async function NewPurchasePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  // Fetch active suppliers
  const { data: rawSuppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Fetch active products
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .is('archived_at', null)
    .order('name', { ascending: true })

  const suppliers = (rawSuppliers as Supplier[]) || []
  const products = (rawProducts as Product[]) || []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Create Purchase Order"
        description="Draft a wholesale replenishment order with calculated line pricing and supplier terms."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Purchases', href: '/admin/purchases' },
          { label: 'New Purchase Order' },
        ]}
      />

      <PurchaseOrderForm
        suppliers={suppliers}
        products={products}
        initialSupplierId={resolvedParams.supplierId}
      />
    </div>
  )
}
