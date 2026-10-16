import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

const DEFAULT_SUPABASE_URL = 'https://lgzqryxdwgmzuesjeukq.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenFyeXhkd2dtenVlc2pldWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzcyOTEsImV4cCI6MjEwNjg1MzI5MX0.rYlbT-csQSRJJziLQ33_QoYsBJx5VSb081pk8aTom18'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }

  return createBrowserClient<Database>(supabaseUrl || DEFAULT_SUPABASE_URL, supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY)
}
