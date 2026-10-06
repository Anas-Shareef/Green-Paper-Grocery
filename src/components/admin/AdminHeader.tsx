'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/lib/auth/actions'
import {
  Menu,
  Bell,
  LogOut,
  User,
  Shield,
} from 'lucide-react'
import type { Profile } from '@/types/database.types'

interface AdminHeaderProps {
  profile: Profile
  unreadNotificationsCount?: number
  onToggleSidebar?: () => void
}

export function AdminHeader({
  profile,
  unreadNotificationsCount = 0,
  onToggleSidebar,
}: AdminHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left side: Mobile Toggle & Store status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            Baqqala Abu Dhabi (Zone 19)
          </span>
        </div>
      </div>

      {/* Right side: Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Notifications Shortcut */}
        <Link
          href="/admin/notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
          )}
        </Link>

        {/* User Profile Popover / Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">
                {profile.full_name}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize mt-0.5 leading-none">
                {profile.role}
              </p>
            </div>
          </button>

          {isUserMenuOpen && (
            <>
              <div
                onClick={() => setIsUserMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {profile.full_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 capitalize">
                    <Shield className="h-3 w-3 text-emerald-600" />
                    Role: {profile.role}
                  </p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Store Settings
                </Link>

                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
