import { requireRole } from '@/lib/auth/roles'
import { getUnreadNotificationCount } from '@/lib/services/notifications'
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell'

export const metadata = {
  title: 'Baqqala Admin & Operations',
  description: 'Operating shell for Baqqala Grocery, Zone 19 Abu Dhabi.',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication & role guard: enforces active staff, admin, or owner
  const profile = await requireRole(['staff', 'admin', 'owner'], '/login')
  const unreadCount = await getUnreadNotificationCount()

  return (
    <AdminLayoutShell
      profile={profile}
      unreadNotificationsCount={unreadCount}
    >
      {children}
    </AdminLayoutShell>
  )
}
