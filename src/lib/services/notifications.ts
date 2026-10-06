import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database.types'

export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
}): Promise<Notification[]> {
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
