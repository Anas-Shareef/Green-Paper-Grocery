import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/roles'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import {
  LayoutDashboard,
  Package,
  MapPin,
  User,
  LogOut,
  Gift,
  Shield,
} from 'lucide-react'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()
  let userEmail: string | null = null
  let userName: string = 'Customer'

  if (profile) {
    userName = profile.full_name || 'Store User'
    userEmail = `${profile.role}@baqqala.ae`
  } else {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
        userEmail = user.email || null
      }
    } catch {
      // ignore
    }
  }

  if (!profile && !userEmail) {
    redirect('/login?next=/account')
  }

  const navItems = [
    { label: 'Overview', href: '/account', icon: LayoutDashboard },
    { label: 'My Orders', href: '/account/orders', icon: Package },
    { label: 'Loyalty & Rewards', href: '/account/loyalty', icon: Gift },
    { label: 'Delivery Addresses', href: '/account/addresses', icon: MapPin },
    { label: 'Profile Details', href: '/account/profile', icon: User },
  ]

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Account Header */}
        <div className="pb-6 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Customer Account
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your grocery orders, saved Zone 19 addresses, and contact details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="md:col-span-3 rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2 sticky top-24">
            <div className="p-3 mb-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block truncate">
                {userName}
              </span>
              <span className="text-[10px] text-muted-foreground block truncate">
                {userEmail}
              </span>
            </div>

            {profile && ['owner', 'admin', 'staff'].includes(profile.role) && (
              <div className="mb-3">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Admin Dashboard
                  </span>
                  <span>→</span>
                </Link>
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="h-4 w-4 text-emerald-600" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="pt-2 border-t border-border mt-3">
              <form action="/auth/signout" method="post">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Back to Store</span>
                </Link>
              </form>
            </div>
          </aside>

          {/* Main Content Workspace */}
          <main className="md:col-span-9 min-w-0">{children}</main>
        </div>
      </div>
    </StoreLayout>
  )
}
