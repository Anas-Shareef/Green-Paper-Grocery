import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Truck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminPurchasesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Purchases & Vendor Invoices"
        description="Supplier purchases, wholesale offers, and automated inventory stock-in transactions."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Purchases' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Purchase (Phase 5)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Purchases Module — Phase 5"
          description="The purchases and purchase_items database architecture is established with weighted-average costing support. Invoice entry and automatic stock increase workflows will be activated in Phase 5."
          icon={Truck}
        />
      </div>
    </div>
  )
}
