import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminSuppliersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Suppliers & Wholesalers"
        description="Vendor directory, contact persons, wholesale payment terms, and delivery history."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Suppliers' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Supplier (Phase 5)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Supplier Directory — Phase 5"
          description="The suppliers table and purchase invoice relationships are created in PostgreSQL. Supplier profiles, WhatsApp contact links, and order records will be activated in Phase 5."
          icon={Building2}
        />
      </div>
    </div>
  )
}
