import { createClient } from '@/lib/supabase/server'
import {
  getDateRangeBounds,
  type DashboardDateRange,
} from '@/lib/utils/date-range'
import { getSettingByKey, type BusinessRulesSettings } from '@/lib/services/settings'

export { type DashboardDateRange }

export interface DashboardMetrics {
  dateRange: DashboardDateRange
  rangeLabel: string
  startDate: string
  endExclusive: string
  overview: {
    totalSales: number
    orderCount: number
    averageOrderValue: number
    grossProfit: number
    operatingExpenses: number
    estimatedOperatingProfit: number
  }
  orderStatuses: {
    pending: number
    confirmed: number
    preparing: number
    ready: number
    out_for_delivery: number
    delivered: number
    cancelled: number
  }
  inventoryAlerts: {
    lowStockCount: number
    outOfStockCount: number
    items: Array<{
      id: string
      name: string
      sku: string | null
      stockQuantity: number
      reorderLevel: number
      unit: string
    }>
  }
  customers: {
    totalCustomers: number
    newCustomersInRange: number
    returningCustomersCount: number
    inactiveCustomersCount: number
  }
}

/**
 * Server-side service to aggregate dashboard metrics directly from PostgreSQL
 * Adheres strictly to:
 * - timestamp >= start AND timestamp < endExclusive
 * - Revenue - COGS = Gross Profit
 * - Returning customer: >= 2 completed/delivered orders
 * - Inactive customer: last completed order older than configured inactivity threshold
 */
export async function getDashboardSummary(
  range: DashboardDateRange = 'today',
  customStart?: string,
  customEnd?: string
): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const { startDate, endExclusive, label } = getDateRangeBounds(range, customStart, customEnd)

  // 1. Fetch Orders within strictly bounded date range: [startDate, endExclusive)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, total_amount, status, order_date')
    .gte('order_date', startDate)
    .lt('order_date', endExclusive)

  if (ordersError) {
    console.error('Error fetching orders for dashboard:', ordersError)
  }

  const activeOrders = orders?.filter((o) => o.status !== 'cancelled') ?? []
  const totalSales = activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const orderCount = activeOrders.length
  const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0

  // Order status counts
  const orderStatuses = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  }

  orders?.forEach((o) => {
    if (o.status in orderStatuses) {
      orderStatuses[o.status as keyof typeof orderStatuses]++
    }
  })

  // 2. Fetch Gross Profit via Order Items with historical purchase cost snapshot
  let grossProfit = 0
  if (activeOrders.length > 0) {
    const activeOrderIds = activeOrders.map((o) => o.id)
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('selling_price, purchase_cost_at_sale, quantity, discount_amount')
      .in('order_id', activeOrderIds)

    if (!itemsError && items) {
      grossProfit = items.reduce((sum, item) => {
        const itemSelling = Number(item.selling_price || 0)
        const itemCost = Number(item.purchase_cost_at_sale || 0)
        const qty = Number(item.quantity || 0)
        const discount = Number(item.discount_amount || 0)
        return sum + (itemSelling - itemCost) * qty - discount
      }, 0)
    }
  }

  // 3. Fetch Expenses in Date Range: [startDay, endDayExclusive)
  const startDay = startDate.split('T')[0]
  const endDayExclusive = endExclusive.split('T')[0]

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', startDay)
    .lt('expense_date', endDayExclusive)

  if (expensesError) {
    console.error('Error fetching expenses for dashboard:', expensesError)
  }

  const operatingExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) ?? 0
  const estimatedOperatingProfit = grossProfit - operatingExpenses

  // 4. Fetch Inventory Alerts (Excluding archived products)
  const { data: allProducts, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, stock_quantity, reorder_level, unit, is_active, archived_at')
    .eq('is_active', true)
    .is('archived_at', null)

  if (productsError) {
    console.error('Error fetching products for inventory alerts:', productsError)
  }

  const lowStockItems: DashboardMetrics['inventoryAlerts']['items'] = []
  let outOfStockCount = 0
  let lowStockCount = 0

  allProducts?.forEach((p) => {
    const stock = Number(p.stock_quantity || 0)
    const reorder = Number(p.reorder_level || 0)

    if (stock <= 0) {
      outOfStockCount++
      lowStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: stock,
        reorderLevel: reorder,
        unit: p.unit,
      })
    } else if (stock <= reorder) {
      lowStockCount++
      lowStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: stock,
        reorderLevel: reorder,
        unit: p.unit,
      })
    }
  })

  // 5. Customer Metrics (Centralized Definitions from Settings)
  const businessRules = await getSettingByKey<BusinessRulesSettings>('business_rules', {
    enforce_minimum_price: true,
    require_discount_approval: true,
    inactive_customer_days: 45,
    default_reorder_level: 5,
  })

  // Inactivity threshold timestamp: older than inactive_customer_days
  const inactiveDays = businessRules?.inactive_customer_days || 45
  const inactiveCutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000).toISOString()

  // A. Total customers
  const { count: totalCustomersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  // B. New customers in chosen date range
  const { count: newCustomersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', endExclusive)

  // C. Returning customers: customer with >= 2 completed/delivered orders
  const { count: returningCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('total_orders', 2)

  // D. Inactive customers: last completed order older than configured inactivity threshold
  const { count: inactiveCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .or(`last_order_at.lt.${inactiveCutoff},and(last_order_at.is.null,created_at.lt.${inactiveCutoff})`)

  return {
    dateRange: range,
    rangeLabel: label,
    startDate,
    endExclusive,
    overview: {
      totalSales,
      orderCount,
      averageOrderValue,
      grossProfit,
      operatingExpenses,
      estimatedOperatingProfit,
    },
    orderStatuses,
    inventoryAlerts: {
      lowStockCount,
      outOfStockCount,
      items: lowStockItems.slice(0, 5), // top 5 critical alerts
    },
    customers: {
      totalCustomers: totalCustomersCount ?? 0,
      newCustomersInRange: newCustomersCount ?? 0,
      returningCustomersCount: returningCount ?? 0,
      inactiveCustomersCount: inactiveCount ?? 0,
    },
  }
}
