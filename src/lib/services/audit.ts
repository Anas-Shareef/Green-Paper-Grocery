import { createClient } from '@/lib/supabase/server'
import type { AuditLog, Json } from '@/types/database.types'

export interface LogAuditParams {
  action: string
  entityType: string
  entityId?: string
  oldValues?: Json
  newValues?: Json
}

export async function logAuditEvent(params: LogAuditParams): Promise<boolean> {
  try {
    const supabase = await createClient()

    // 1. Primary path: Invoke trusted atomic RPC deriving actor from auth.uid()
    const { error: rpcError } = await supabase.rpc('log_audit_event_atomic', {
      p_action: params.action,
      p_entity_type: params.entityType,
      p_entity_id: params.entityId ?? null,
      p_old_values: params.oldValues ?? null,
      p_new_values: params.newValues ?? null,
    })

    if (!rpcError) {
      return true
    }

    // 2. Fallback path for service_role or unmigrated environments
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user?.id ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null,
    })

    if (error) {
      console.error('Failed to log audit event:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Exception during audit logging:', err)
    return false
  }
}

export async function getRecentAuditLogs(limit: number = 25): Promise<AuditLog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }

  return (data as AuditLog[]) ?? []
}
