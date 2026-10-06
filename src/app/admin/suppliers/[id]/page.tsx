import { notFound } from 'next/navigation'
import { getSupplierById } from '@/lib/services/suppliers'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SupplierDetailWorkspace } from '@/components/admin/suppliers/SupplierDetailWorkspace'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getSupplierById(id)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.supplier.name}
        description={`Supplier Profile & Financial Ledger (${data.supplier.supplier_code || 'SUP'})`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Suppliers', href: '/admin/suppliers' },
          { label: data.supplier.name },
        ]}
      />

      <SupplierDetailWorkspace data={data} />
    </div>
  )
}
