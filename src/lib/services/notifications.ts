import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database.types'

function isPlaceholderConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return (
    !url ||
    !key ||
    url.includes('placeholder-project.supabase.co') ||
    key.includes('placeholder')
  )
}

export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
}): Promise<Notification[]> {
  if (isPlaceholderConfig()) {
    const demoNotifications: Notification[] = [
      {
        id: 'demo-notif-1',
        title: 'Zone 19 Order Received',
        message: 'Order #ORD-2026-0042 placed via Storefront (Cash on Delivery).',
        type: 'info',
        link: '/admin/orders',
        entity_type: 'order',
        entity_id: 'demo-ord-1',
        user_id: null,
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-notif-2',
        title: 'Low Stock Alert',
        message: 'Al Rawabi Fresh Milk 2L has reached reorder threshold (3 remaining).',
        type: 'warning',
        link: '/admin/inventory',
        entity_type: 'product',
        entity_id: 'demo-alert-1',
        user_id: null,
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
    return options?.unreadOnly ? demoNotifications.filter((n) => !n.is_read) : demoNotifications
  }

  const supabase = await createClient()
  const limit = options?.limit ?? 20

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return (data as Notification[]) ?? []
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (isPlaceholderConfig()) {
    return 1
  }

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }

  return count ?? 0
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

export async function createNotification(params: {
  title: string
  message: string
  type?: 'info' | 'warning' | 'success' | 'error'
  link?: string
  entityType?: string
  entityId?: string
  userId?: string | null
}): Promise<Notification | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title: params.title,
      message: params.message,
      type: params.type ?? 'info',
      link: params.link ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      user_id: params.userId ?? null,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return null
  }

  return data as Notification
}
