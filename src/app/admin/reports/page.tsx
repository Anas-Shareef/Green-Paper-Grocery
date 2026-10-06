import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { BarChart3, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Financial & Inventory Analytics"
        description="Comprehensive daily sales, product profitability, slow-moving items, and expense reports."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reports' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Report (Phase 9)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Advanced Analytics & Reports — Phase 9"
          description="Detailed financial reports, margin breakdowns, customer lifetime value analytics, and slow-moving inventory reports will be activated in Phase 9."
          icon={BarChart3}
        />
      </div>
    </div>
  )
}
