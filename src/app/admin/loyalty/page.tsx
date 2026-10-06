import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Gift } from 'lucide-react'

export default function AdminLoyaltyPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Loyalty & Rewards"
        description="Points accumulation, repeat order incentives, and controlled reward redemption."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Loyalty' }]}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Loyalty System — Phase 8"
          description="Configurable loyalty points per AED spent and redemption caps will be activated in Phase 8 to turn one-time shoppers into repeat customers."
          icon={Gift}
        />
      </div>
    </div>
  )
}
