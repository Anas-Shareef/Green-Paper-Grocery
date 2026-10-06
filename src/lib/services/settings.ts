import { createClient } from '@/lib/supabase/server'
import type { Setting, Json } from '@/types/database.types'

export interface StoreProfileSettings {
  name: string
  phone: string
  whatsapp: string
  address: string
  city: string
  zone: string
  country: string
}

export interface LocalizationSettings {
  currency: string
  currency_symbol: string
  locale: string
  timezone: string
  vat_percentage: number
}

export interface DeliveryRulesSettings {
  free_delivery: boolean
  default_zone: string
  avg_delivery_time_mins: number
  min_order_amount: number
}

export interface BusinessRulesSettings {
  enforce_minimum_price: boolean
  require_discount_approval: boolean
  inactive_customer_days: number
  default_reorder_level: number
}

export async function getAllSettings(): Promise<Record<string, Json>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('*')

  if (error) {
    console.error('Error fetching settings:', error)
    return {}
  }

  const result: Record<string, Json> = {}
  data?.forEach((row: Setting) => {
    result[row.key] = row.value
  })

  return result
}

export async function getSettingByKey<T = Json>(key: string, fallback: T): Promise<T> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data) {
    return fallback
  }

  return (data.value as T) ?? fallback
}

export async function updateSetting(
  key: string,
  value: Json,
  description?: string
): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error(`Error updating setting ${key}:`, error)
    return false
  }

  return true
}
