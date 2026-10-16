import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Supabase Admin Client
 * WARNING: Never import or use this client in client-side code!
 * This uses the SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS)
 * strictly for background system tasks, administrative scripts, or webhooks.
 */
const DEFAULT_SUPABASE_URL = 'https://lgzqryxdwgmzuesjeukq.supabase.co'
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenFyeXhkd2dtenVlc2pldWtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI3NzI5MSwiZXhwIjoyMTA2ODUzMjkxfQ.llQFOuUxAZxTxcby23Xklv0ezi1oLgyuBqTasRyQJp0'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
