'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Boxes,
  Truck,
  Building2,
  Receipt,
  Tag,
  Gift,
  BarChart3,
  Bell,
  Settings,
  Store,
  X,
} from 'lucide-react'
import type { Profile } from '@/types/database.types'

interface NavItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingBag,
      },
      {
        title: 'Deliveries',
        href: '/admin/deliveries',
        icon: Truck,
        badge: 'Phase 7',
      },
      {
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
      },
      {
        title: 'Products',
        href: '/admin/products',
        icon: Package,
        badge: 'Phase 4',
      },
      {
        title: 'Inventory',
        href: '/admin/inventory',
        icon: Boxes,
        badge: 'Phase 4',
      },
    ],
  },
  {
    title: 'Purchasing',
    items: [
      {
        title: 'Purchases',
        href: '/admin/purchases',
        icon: Truck,
      },
      {
        title: 'Suppliers',
        href: '/admin/suppliers',
        icon: Building2,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        title: 'Expenses',
        href: '/admin/expenses',
        icon: Receipt,
        badge: 'Phase 5',
      },
    ],
  },
  {
    title: 'Growth',
    items: [
      {
        title: 'Promotions',
        href: '/admin/promotions',
        icon: Tag,
        badge: 'Phase 8',
      },
      {
        title: 'Loyalty & Points',
        href: '/admin/loyalty',
        icon: Gift,
        badge: 'Phase 8',
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        title: 'Reports',
        href: '/admin/reports',
        icon: BarChart3,
        badge: 'Phase 9',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
      },
      {
        title: 'Store Settings',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
  },
]

interface AdminSidebarProps {
  profile: Profile
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({
  profile,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 font-bold text-foreground"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Store className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight leading-none">
                Baqqala Ops
              </span>
              <span className="text-[10px] text-muted-foreground font-medium mt-1">
                Zone 19, Abu Dhabi
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                          )}
                        />
                        <span>{item.title}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom profile snapshot */}
        <div className="p-4 border-t border-border bg-card/60">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {profile.full_name}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                Role: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{profile.role}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
