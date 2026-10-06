import React from 'react'
import Link from 'next/link'
import { getOrCreateCurrentCustomer } from '@/lib/services/customerStore'
import {
  getCustomerLoyaltyAccount,
  getLoyaltyTransactions,
  LOYALTY_CONFIG,
} from '@/lib/services/loyalty'
import { Button } from '@/components/ui/button'
import {
  Gift,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export const metadata = {
  title: 'Baqqala Loyalty & Rewards | My Account',
  description: 'Track your loyalty points balance, rewards, and redemption history.',
}

export default async function CustomerLoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const customer = await getOrCreateCurrentCustomer()
  const resolvedParams = await searchParams
  const currentPage = Number(resolvedParams.page) || 1

  if (!customer) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-4">
        <p className="text-xs text-muted-foreground">
          Please sign in to view your loyalty points and rewards.
        </p>
      </div>
    )
  }

  const [account, transactionsRes] = await Promise.all([
    getCustomerLoyaltyAccount(customer.id),
    getLoyaltyTransactions(customer.id, { page: currentPage, limit: 15 }),
  ])

  const balance = account?.points_balance || 0
  const monetaryValue = Number((balance * LOYALTY_CONFIG.POINTS_REDEMPTION_RATE).toFixed(2))

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">
          Baqqala Loyalty & Rewards
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Earn 1 point for every 1 AED spent on grocery orders delivered in Zone 19.
        </p>
      </div>

      {/* Hero Points Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-teal-700 to-emerald-900 p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold text-emerald-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Zone 19 Grocery Rewards Program</span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                Available Points Balance
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  {balance.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-emerald-200">Points</span>
              </div>
            </div>

            <p className="text-xs text-emerald-100">
              ≈ <span className="font-bold text-white">AED {monetaryValue.toFixed(2)}</span> available to redeem at checkout
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 max-w-xs shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Gift className="h-4 w-4 text-amber-300" />
              <span>How It Works</span>
            </div>
            <ul className="text-[11px] text-emerald-100 space-y-1.5 leading-relaxed">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-300 shrink-0" />
                <span>AED 1 eligible spend = 1 Point earned upon delivery</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-300 shrink-0" />
                <span>100 Points = AED 5.00 discount on your order</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-300 shrink-0" />
                <span>Apply directly with a single click at checkout</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      </div>

      {/* Lifetime Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-emerald-600" />
            Lifetime Points Earned
          </span>
          <p className="text-xl font-extrabold text-foreground">
            {(account?.lifetime_points_earned || 0).toLocaleString()} pts
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-amber-600" />
            Lifetime Points Redeemed
          </span>
          <p className="text-xl font-extrabold text-foreground">
            {(account?.lifetime_points_redeemed || 0).toLocaleString()} pts
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            Lifetime Savings
          </span>
          <p className="text-xl font-extrabold text-emerald-600">
            AED {(((account?.lifetime_points_redeemed || 0) * 0.05)).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Points Activity History Ledger */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Points Ledger History</h3>
          <span className="text-xs text-muted-foreground">
            {transactionsRes.total} total activities
          </span>
        </div>

        {transactionsRes.transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">
              You haven&apos;t earned or redeemed loyalty points yet.
            </p>
            <Link href="/shop">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {transactionsRes.transactions.map((tx) => {
              const isEarn = tx.points > 0
              return (
                <div
                  key={tx.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isEarn
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {isEarn ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground capitalize">
                        {tx.transaction_type} • {tx.reason || 'Loyalty activity'}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-AE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black font-mono text-sm ${
                        isEarn ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {isEarn ? `+${tx.points}` : tx.points} pts
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-mono">
                      Balance: {tx.balance_after} pts
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
