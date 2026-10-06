import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Tag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions & Discounts"
        description="Controlled promotional campaigns with minimum selling price guardrails."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Promotions' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Promotion (Phase 8)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Promotions Engine — Phase 8"
          description="Promotional pricing safeguards and category discount structures will be activated in Phase 8, strictly preventing negative-margin selling."
          icon={Tag}
        />
      </div>
    </div>
  )
}
