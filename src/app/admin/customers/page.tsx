import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Management & Segments"
        description="Customer directory with Zone 19 delivery addresses, WhatsApp integration, and lifetime value tracking."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Customers' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Customer (Phase 6)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Customer CRM Module — Phase 6"
          description="The customers table with automated segment tracking (new, regular, high-value, inactive, VIP) is established. Customer search, address management, and order history views will be activated in Phase 6."
          icon={Users}
        />
      </div>
    </div>
  )
}
