import { notFound } from 'next/navigation'
import { getPurchaseById } from '@/lib/services/purchases'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { PurchaseDetailWorkspace } from '@/components/admin/purchases/PurchaseDetailWorkspace'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getPurchaseById(id)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.purchase.purchase_number}
        description={`Procurement Workspace • Vendor: ${data.supplier.name} (${data.supplier.supplier_code || 'SUP'})`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Purchases', href: '/admin/purchases' },
          { label: data.purchase.purchase_number },
        ]}
      />

      <PurchaseDetailWorkspace data={data} />
    </div>
  )
}
