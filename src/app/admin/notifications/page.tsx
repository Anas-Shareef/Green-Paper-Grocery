import { getNotifications, markNotificationAsRead } from '@/lib/services/notifications'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { NotificationItem } from '@/components/admin/NotificationItem'
import { EmptyState } from '@/components/admin/EmptyState'
import { Bell } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function NotificationsPage() {
  const notifications = await getNotifications({ limit: 50 })
  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function handleMarkRead(id: string) {
    'use server'
    await markNotificationAsRead(id)
    revalidatePath('/admin/notifications')
    revalidatePath('/admin/dashboard')
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Internal Notifications"
        description="System notifications, stock replenishment warnings, and order status updates."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Notifications' }]}
        actions={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {unreadCount} unread
            </span>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-4xl">
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="Operational events such as stock alerts, large orders, and system updates will be logged here."
            icon={Bell}
          />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
