import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Receipt, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminExpensesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operating Expenses"
        description="Delivery, fuel, salary, packaging, and store overhead tracking protected by Admin/Owner RLS."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Expenses' }]}
        actions={
          <Button disabled className="opacity-60 cursor-not-allowed inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Record Expense (Phase 5)
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          title="Expense Management — Phase 5"
          description="The expenses table with strict role security (restricted to Admin and Owner) is active. Expense logging, receipt attachment storage, and category reporting will be activated in Phase 5."
          icon={Receipt}
        />
      </div>
    </div>
  )
}
