import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getLoyaltyOverview } from '@/lib/services/loyalty'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { LoyaltyAdjustmentDialog } from '@/components/admin/loyalty/LoyaltyAdjustmentDialog'
import {
  Gift,
  Coins,
  Users,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'

export const metadata = {
  title: 'Customer Loyalty & Rewards | Baqqala Admin',
}

export default async function AdminLoyaltyPage() {
  const [overview, supabase] = await Promise.all([
    getLoyaltyOverview(),
    createClient(),
  ])

  // Fetch customers for adjustment dropdown and member list
  const { data: customerAccounts } = await supabase
    .from('customer_loyalty_accounts')
    .select(`
      id,
      points_balance,
      lifetime_points_earned,
      lifetime_points_redeemed,
      customer:customers(id, name, mobile, email)
    `)
    .order('points_balance', { ascending: false })
    .limit(30)

  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, name, mobile')
    .order('name', { ascending: true })
    .limit(100)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Loyalty & Rewards"
        description="Monitor customer points balances, transaction ledgers, and perform auditable adjustments."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Loyalty' }]}
        actions={
          <LoyaltyAdjustmentDialog
            customers={(allCustomers || []).map((c) => ({
              id: c.id,
              name: c.name,
              mobile: c.mobile,
            }))}
          />
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Active Members
          </span>
          <p className="text-2xl font-black text-foreground">
            {overview.totalMembers.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-amber-600" />
            Points Outstanding
          </span>
          <p className="text-2xl font-black text-amber-600">
            {overview.pointsOutstanding.toLocaleString()} pts
          </p>
          <span className="text-[11px] text-muted-foreground">
            ≈ AED {overview.estimatedOutstandingValueAed.toFixed(2)} value
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Lifetime Issued
          </span>
          <p className="text-2xl font-black text-emerald-600">
            {overview.pointsLifetimeEarned.toLocaleString()} pts
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-purple-600" />
            Lifetime Redeemed
          </span>
          <p className="text-2xl font-black text-purple-600">
            {overview.pointsLifetimeRedeemed.toLocaleString()} pts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Top Member Balances */}
        <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Member Balances
            </h3>
            <span className="text-xs text-muted-foreground">Top accounts</span>
          </div>

          {!customerAccounts || customerAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No customer loyalty accounts recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-1">
              {customerAccounts.map((acct) => {
                const cust = acct.customer as unknown as {
                  id: string
                  name: string
                  mobile: string
                  email?: string
                } | null
                return (
                  <div
                    key={acct.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">{cust?.name || 'Customer'}</p>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {cust?.mobile || ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black font-mono text-sm text-foreground">
                        {acct.points_balance.toLocaleString()} pts
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        ≈ AED {(acct.points_balance * 0.05).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Ledger Transactions */}
        <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Recent Immutable Ledger Activities
            </h3>
            <span className="text-xs text-muted-foreground">Audit log</span>
          </div>

          {overview.recentTransactions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No loyalty activities recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-1">
              {overview.recentTransactions.map((tx) => {
                const isPositive = tx.points > 0
                return (
                  <div
                    key={tx.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {tx.customer?.name || 'Member'} •{' '}
                          <span className="capitalize">{tx.transaction_type}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {tx.reason || 'Loyalty transaction'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-black font-mono text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {isPositive ? `+${tx.points}` : tx.points} pts
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-mono">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
