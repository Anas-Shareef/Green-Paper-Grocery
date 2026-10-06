import { notFound, redirect } from 'next/navigation'
import { getPurchaseById } from '@/lib/services/purchases'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { PurchaseReceivingForm } from '@/components/admin/purchases/PurchaseReceivingForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PurchaseReceivePage({ params }: PageProps) {
  const { id } = await params
  const data = await getPurchaseById(id)

  if (!data) {
    notFound()
  }

  // Guard: Receiving is only permissible on ordered or partially_received POs
  if (data.purchase.status !== 'ordered' && data.purchase.status !== 'partially_received') {
    redirect(`/admin/purchases/${id}`)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Receive Goods (GRN) • ${data.purchase.purchase_number}`}
        description={`Physical stock intake inspection for ${data.supplier.name}. Quantities accepted will atomically increase warehouse inventory.`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Purchases', href: '/admin/purchases' },
          { label: data.purchase.purchase_number, href: `/admin/purchases/${id}` },
          { label: 'Receive Goods' },
        ]}
      />

      <PurchaseReceivingForm data={data} />
    </div>
  )
}
