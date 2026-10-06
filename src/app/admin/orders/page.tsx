import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { ShoppingBag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders Processing"
        description="Fulfillment queue for website, WhatsApp, phone, and walk-in sales in Zone 19."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Order (Phase 6)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Order Processing Module — Phase 6"
          description="The orders and order_items tables with snapshotted historical product costs are ready. Multi-channel order workflows, status pipelines (Pending ➔ Delivered), and delivery route dispatches will be activated in Phase 6."
          icon={ShoppingBag}
        />
      </div>
    </div>
  )
}
