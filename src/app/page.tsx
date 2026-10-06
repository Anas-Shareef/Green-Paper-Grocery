import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Store,
  ArrowRight,
  Package,
  Boxes,
  LayoutDashboard,
  ShieldCheck,
  DollarSign,
  Layers,
  History,
} from 'lucide-react'

export default function HomePage() {
  const activeModules = [
    {
      title: 'Products Management',
      href: '/admin/products',
      badge: 'Phase 4 Live',
      desc: 'Catalog products with SKU, barcode camera scanning, category hierarchies, and multi-tier pricing guardrails.',
      icon: Package,
      features: ['Barcode Scanner', 'Pricing Guardrails', 'Soft Archive/Restore'],
    },
    {
      title: 'Inventory & Stocktake',
      href: '/admin/inventory',
      badge: 'Phase 4 Live',
      desc: 'Real-time inventory valuation, atomic stock mutations, movement audit trail, and physical count reconciliation.',
      icon: Boxes,
      features: ['Server Valuation', 'Stock Adjustments', 'Physical Stocktake'],
    },
    {
      title: 'Operations Dashboard',
      href: '/admin/dashboard',
      badge: 'Phase 3 Live',
      desc: 'Real-time financial performance, gross profit, sales summaries, and inventory restocking alerts.',
      icon: LayoutDashboard,
      features: ['Date Range Filters', 'Revenue & Gross Profit', 'Restock Triggers'],
    },
  ]

  const architectureHighlights = [
    {
      name: 'Atomic Stock Mutations',
      desc: 'Enforced via PostgreSQL `mutate_stock_atomic` RPC to prevent silent updates, race conditions, and negative stock.',
      icon: Layers,
    },
    {
      name: 'Financial Price Guardrails',
      desc: 'Server-enforced checks ensuring normal & promo prices never drop below the minimum selling price floor.',
      icon: DollarSign,
    },
    {
      name: 'Audit Trail & Price History',
      desc: 'Immutable historical logs tracking every price change, stock movement, count reconciliation, and user action.',
      icon: History,
    },
    {
      name: 'Role-Based Security & RLS',
      desc: 'Centralized permissions for Owner, Admin, and Staff roles with PostgreSQL Row-Level Security policies.',
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-600/30">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground block leading-tight">
                Baqqala Grocery
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Zone 19, Abu Dhabi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Phase 4: Products & Inventory Live
            </span>

            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Sign In
              </Button>
            </Link>

            <Link href="/admin/dashboard">
              <Button size="sm" className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                Admin Portal <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
        {/* Hero Section */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span>Operating System for Zone 19 Physical Grocery</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Baqqala Grocery Management & Customer Platform
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Enterprise grocery operations platform built with Next.js 16 App Router, Turbopack,
            Tailwind CSS v4, shadcn/ui, and Supabase PostgreSQL with atomic inventory reconciliation.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link href="/admin/products">
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <Package className="h-4 w-4" /> Products Catalog
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button size="lg" variant="outline" className="gap-2 font-semibold">
                <Boxes className="h-4 w-4" /> Inventory Control
              </Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button size="lg" variant="secondary" className="gap-2 font-semibold">
                <LayoutDashboard className="h-4 w-4" /> Operations Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Modules Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Operational Management Modules
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              Phase 1 → Phase 4 Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeModules.map((mod) => {
              const Icon = mod.icon
              return (
                <div
                  key={mod.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between hover:border-emerald-600/40 hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex flex-wrap gap-1.5">
                      {mod.features.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link href={mod.href} className="pt-6 block">
                    <Button variant="outline" className="w-full justify-between text-xs font-semibold group">
                      Open Module
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Technical Architecture Highlights */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">
              Production Architecture Highlights
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Robust data integrity mechanisms enforcing financial and stock accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {architectureHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Baqqala Grocery. Zone 19, Abu Dhabi.</p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Next.js 16 App Router</span>
            <span>•</span>
            <span>Supabase PostgreSQL</span>
            <span>•</span>
            <span>Tailwind v4</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
