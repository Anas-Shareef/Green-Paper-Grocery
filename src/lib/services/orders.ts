import { createClient } from '@/lib/supabase/server'
import type {
  Order,
  OrderItem,
  Customer,
  Profile,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderStatusHistory,
  OrderNote,
  Delivery,
} from '@/types/database.types'

export interface OrderListItem extends Order {
  customer: Pick<Customer, 'id' | 'name' | 'mobile'> | null
  order_items: Pick<OrderItem, 'id' | 'product_name' | 'quantity'>[]
  driver?: Pick<Profile, 'id' | 'full_name' | 'phone'> | null
}

export interface OrderDetailItem extends OrderItem {
  product?: {
    id: string
    name: string
    sku: string
    barcode: string | null
    image_url: string | null
    stock_quantity: number
  } | null
}

export interface AdminOrderDetail extends Order {
  customer: Customer | null
  order_items: OrderDetailItem[]
  driver?: Profile | null
  delivery?: Delivery | null
  status_history: (OrderStatusHistory & {
    author?: Pick<Profile, 'id' | 'full_name'> | null
  })[]
  notes: (OrderNote & {
    author?: Pick<Profile, 'id' | 'full_name'> | null
  })[]
}

export interface OrderFilterParams {
  status?: string
  paymentStatus?: string
  search?: string
  dateRange?: 'all' | 'today' | 'yesterday' | 'week' | 'month'
  page?: number
  pageSize?: number
}

export interface OrderKpis {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  preparingOrders: number
  readyOrders: number
  outForDeliveryOrders: number
  deliveredToday: number
  cancelledToday: number
  todayRevenue: number
}

/**
 * Fetches orders with server-side filters, search, and pagination for admin queue.
 */
export async function getAdminOrders(params: OrderFilterParams): Promise<{
  orders: OrderListItem[]
  totalCount: number
  kpis: OrderKpis
}> {
  const supabase = await createClient()
  const page = params.page || 1
  const pageSize = params.pageSize || 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 1. Calculate KPI Metrics across all relevant records
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayIso = todayStart.toISOString()

  const { data: allOrdersKpi } = await supabase
    .from('orders')
    .select('id, status, payment_status, total_amount, order_date')

  const kpis: OrderKpis = {
    totalOrders: allOrdersKpi?.length || 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    outForDeliveryOrders: 0,
    deliveredToday: 0,
    cancelledToday: 0,
    todayRevenue: 0,
  }

  if (allOrdersKpi) {
    for (const ord of allOrdersKpi) {
      if (ord.status === 'pending') kpis.pendingOrders++
      else if (ord.status === 'confirmed') kpis.confirmedOrders++
      else if (ord.status === 'preparing') kpis.preparingOrders++
      else if (ord.status === 'ready') kpis.readyOrders++
      else if (ord.status === 'out_for_delivery') kpis.outForDeliveryOrders++

      if (ord.order_date >= todayIso) {
        if (ord.status === 'delivered') {
          kpis.deliveredToday++
          kpis.todayRevenue += Number(ord.total_amount) || 0
        } else if (ord.status === 'cancelled') {
          kpis.cancelledToday++
        }
      }
    }
  }

  // 2. Build filtered query
  let query = supabase
    .from('orders')
    .select(
      `
      *,
      customer:customers(id, name, mobile),
      order_items(id, product_name, quantity),
      driver:profiles!orders_assigned_driver_id_fkey(id, full_name, phone)
    `,
      { count: 'exact' }
    )
    .order('order_date', { ascending: false })

  // Status Filter
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status as OrderStatus)
  }

  // Payment Status Filter
  if (params.paymentStatus && params.paymentStatus !== 'all') {
    query = query.eq('payment_status', params.paymentStatus as PaymentStatus)
  }

  // Search Filter (Order number, customer name, recipient name, phone, or address)
  if (params.search?.trim()) {
    const q = params.search.trim()
    query = query.or(
      `order_number.ilike.%${q}%,delivery_address.ilike.%${q}%,recipient_name.ilike.%${q}%,recipient_phone.ilike.%${q}%`
    )
  }

  // Date Range Filter
  if (params.dateRange && params.dateRange !== 'all') {
    if (params.dateRange === 'today') {
      query = query.gte('order_date', todayIso)
    } else if (params.dateRange === 'yesterday') {
      const yest = new Date(todayStart)
      yest.setDate(yest.getDate() - 1)
      query = query.gte('order_date', yest.toISOString()).lt('order_date', todayIso)
    } else if (params.dateRange === 'week') {
      const weekAgo = new Date(todayStart)
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('order_date', weekAgo.toISOString())
    } else if (params.dateRange === 'month') {
      const monthAgo = new Date(todayStart)
      monthAgo.setDate(monthAgo.getDate() - 30)
      query = query.gte('order_date', monthAgo.toISOString())
    }
  }

  // Pagination
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching admin orders:', error)
    return { orders: [], totalCount: 0, kpis }
  }

  return {
    orders: (data as unknown as OrderListItem[]) || [],
    totalCount: count || 0,
    kpis,
  }
}

/**
 * Retrieves full order detail including items, delivery status, history and notes.
 */
export async function getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = await createClient()

  // 1. Fetch order header with customer and driver
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select(
      `
      *,
      customer:customers(*),
      driver:profiles!orders_assigned_driver_id_fkey(*)
    `
    )
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    console.error('Order not found:', orderErr)
    return null
  }

  // 2. Fetch order items with product details
  const { data: items } = await supabase
    .from('order_items')
    .select(
      `
      *,
      product:products(id, name, sku, barcode, image_url, stock_quantity)
    `
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  // 3. Fetch delivery tracking record
  const { data: delivery } = await supabase
    .from('deliveries')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  // 4. Fetch status history
  const { data: history } = await supabase
    .from('order_status_history')
    .select(
      `
      *,
      author:profiles!order_status_history_changed_by_fkey(id, full_name)
    `
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  // 5. Fetch internal and customer notes
  const { data: notes } = await supabase
    .from('order_notes')
    .select(
      `
      *,
      author:profiles!order_notes_author_id_fkey(id, full_name)
    `
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  return {
    ...(order as unknown as Order),
    customer: (order as unknown as { customer: Customer | null }).customer || null,
    driver: (order as unknown as { driver: Profile | null }).driver || null,
    order_items: (items as unknown as OrderDetailItem[]) || [],
    delivery: delivery as Delivery | null,
    status_history: (history as unknown as AdminOrderDetail['status_history']) || [],
    notes: (notes as unknown as AdminOrderDetail['notes']) || [],
  }
}

/**
 * Fetches active staff profiles available for delivery assignment,
 * along with their count of active deliveries.
 */
export async function getActiveDeliveryDrivers(): Promise<
  (Profile & { activeDeliveriesCount: number })[]
> {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['staff', 'admin', 'owner'])
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error || !profiles) {
    return []
  }

  // Fetch count of active deliveries per driver
  const { data: activeDeliveries } = await supabase
    .from('deliveries')
    .select('assigned_to')
    .in('status', ['assigned', 'out_for_delivery'])

  const countMap: Record<string, number> = {}
  if (activeDeliveries) {
    for (const d of activeDeliveries) {
      if (d.assigned_to) {
        countMap[d.assigned_to] = (countMap[d.assigned_to] || 0) + 1
      }
    }
  }

  return profiles.map((p) => ({
    ...p,
    activeDeliveriesCount: countMap[p.id] || 0,
  }))
}

/**
 * Transitions order status atomically via stored procedure.
 */
export async function transitionOrderStatus(params: {
  orderId: string
  nextStatus: OrderStatus
  reason?: string
  notes?: string
  driverId?: string
  failureReason?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('transition_order_status_atomic', {
    p_order_id: params.orderId,
    p_next_status: params.nextStatus,
    p_reason: params.reason ?? null,
    p_notes: params.notes ?? null,
    p_driver_id: params.driverId ?? null,
    p_failure_reason: params.failureReason ?? null,
  })

  if (error) {
    console.error('Failed to transition order status:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Assigns delivery driver to order atomically.
 */
export async function assignOrderDelivery(params: {
  orderId: string
  driverId: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('assign_order_delivery_atomic', {
    p_order_id: params.orderId,
    p_driver_id: params.driverId,
    p_notes: params.notes ?? null,
  })

  if (error) {
    console.error('Failed to assign driver:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Updates item fulfillment status in the packing checklist.
 */
export async function updateItemFulfillment(params: {
  orderId: string
  itemId: string
  status: 'pending' | 'picked' | 'packed' | 'unavailable'
  preparedQty?: number
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_item_fulfillment_atomic', {
    p_order_id: params.orderId,
    p_item_id: params.itemId,
    p_status: params.status,
    p_prepared_qty: params.preparedQty,
  })

  if (error) {
    console.error('Failed to update item fulfillment:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Records payment collection for COD orders.
 */
export async function collectOrderPayment(params: {
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('collect_order_payment_atomic', {
    p_order_id: params.orderId,
    p_amount: params.amount,
    p_payment_method: params.paymentMethod,
    p_reference: params.reference ?? null,
  })

  if (error) {
    console.error('Failed to collect order payment:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Cancels order administratively with atomic inventory restoration.
 */
export async function cancelOrderStaff(params: {
  orderId: string
  reason: string
  restock?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('cancel_order_staff_atomic', {
    p_order_id: params.orderId,
    p_reason: params.reason,
    p_restock: params.restock ?? true,
  })

  if (error) {
    console.error('Failed to cancel order:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Adds an internal or customer note to the order.
 */
export async function addOrderNote(params: {
  orderId: string
  note: string
  visibility?: 'internal' | 'customer'
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('add_order_note_atomic', {
    p_order_id: params.orderId,
    p_note: params.note,
    p_visibility: params.visibility ?? 'internal',
  })

  if (error) {
    console.error('Failed to add order note:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
