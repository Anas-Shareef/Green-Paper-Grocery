'use client'

import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import type { Profile } from '@/types/database.types'

interface AdminLayoutShellProps {
  profile: Profile
  unreadNotificationsCount?: number
  children: React.ReactNode
}

export function AdminLayoutShell({
  profile,
  unreadNotificationsCount = 0,
  children,
}: AdminLayoutShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader
          profile={profile}
          unreadNotificationsCount={unreadNotificationsCount}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
