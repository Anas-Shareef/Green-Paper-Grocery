import { createClient } from '@/lib/supabase/server'
import type { Customer, CustomerAddress, Order } from '@/types/database.types'
import { logAuditEvent } from './audit'

export interface CustomerListParams {
  search?: string
  segment?: string
  zone?: string
  page?: number
  limit?: number
}

export interface CustomerDetailWithRelations extends Customer {
  addresses: CustomerAddress[]
  orders: Pick<Order, 'id' | 'order_number' | 'status' | 'total_amount' | 'order_date' | 'created_at'>[]
}

export async function getAdminCustomers(params: CustomerListParams = {}): Promise<{
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const supabase = await createClient()
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, Math.min(params.limit || 20, 100))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('customers').select('*', { count: 'exact' })

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`
    query = query.or(`name.ilike.${term},mobile.ilike.${term},email.ilike.${term}`)
  }

  if (params.segment && params.segment !== 'all') {
    query = query.eq('customer_segment', params.segment as import('@/types/database.types').CustomerSegment)
  }

  if (params.zone && params.zone !== 'all') {
    query = query.eq('zone', params.zone)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching admin customers:', error)
    return { customers: [], total: 0, page, limit, totalPages: 0 }
  }

  const customers = (data as Customer[]) || []
  const total = count || 0

  return {
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getAdminCustomerById(id: string): Promise<CustomerDetailWithRelations | null> {
  const supabase = await createClient()

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (custErr || !customer) {
    return null
  }

  const [addrRes, ordersRes] = await Promise.all([
    supabase.from('customer_addresses').select('*').eq('customer_id', id).order('is_default', { ascending: false }),
    supabase.from('orders').select('id, order_number, status, total_amount, order_date, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(20)
  ])

  return {
    ...(customer as Customer),
    addresses: (addrRes.data as CustomerAddress[]) || [],
    orders: (ordersRes.data as any[]) || []
  }
}

export async function createAdminCustomer(input: {
  name: string
  mobile: string
  email?: string
  address?: string
  villa_or_building?: string
  area?: string
  zone?: string
  notes?: string
}): Promise<Customer> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    name: input.name.trim(),
    mobile: input.mobile.trim(),
    email: input.email?.trim() || null,
    address: input.address?.trim() || 'Zone 19, Abu Dhabi',
    villa_or_building: input.villa_or_building?.trim() || null,
    area: input.area?.trim() || 'Abu Dhabi',
    zone: input.zone?.trim() || 'Zone 19',
    notes: input.notes?.trim() || null,
    customer_segment: 'new' as const,
    total_orders: 0,
    total_spend: 0,
    is_active: true,
  }

  const { data, error } = await supabase.from('customers').insert(payload as any).select().single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create customer')
  }

  await logAuditEvent({
    action: 'customer.create',
    entityType: 'customer',
    entityId: data.id,
    newValues: payload as unknown as import('@/types/database.types').Json,
  })

  return data as Customer
}

export async function updateAdminCustomer(id: string, input: {
  name?: string
  mobile?: string
  email?: string
  address?: string
  villa_or_building?: string
  area?: string
  zone?: string
  notes?: string
  is_active?: boolean
}): Promise<Customer> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.mobile !== undefined) updates.mobile = input.mobile.trim()
  if (input.email !== undefined) updates.email = input.email?.trim() || null
  if (input.address !== undefined) updates.address = input.address?.trim() || null
  if (input.villa_or_building !== undefined) updates.villa_or_building = input.villa_or_building?.trim() || null
  if (input.area !== undefined) updates.area = input.area?.trim() || null
  if (input.zone !== undefined) updates.zone = input.zone?.trim() || null
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null
  if (input.is_active !== undefined) updates.is_active = input.is_active

  const { data, error } = await supabase
    .from('customers')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update customer')
  }

  await logAuditEvent({
    action: 'customer.update',
    entityType: 'customer',
    entityId: id,
    newValues: updates as unknown as import('@/types/database.types').Json,
  })

  return data as Customer
}
