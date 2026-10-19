import { createClient } from '@/lib/supabase/server'

export interface ReportFilterParams {
  range?: 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all'
  startDate?: string
  endDate?: string
}

export interface ReportsData {
  rangeLabel: string
  startDate: string
  endDate: string
  salesSummary: {
    grossSales: number
    netSales: number
    totalOrders: number
    averageOrderValue: number
    deliveredOrders: number
    cancelledOrders: number
    discountsGiven: number
    taxCollected: number
  }
  statusBreakdown: Record<string, number>
  topProducts: Array<{
    productId: string
    name: string
    unitsSold: number
    totalRevenue: number
  }>
  expensesByCategory: Array<{
    category: string
    amount: number
  }>
  totalExpenses: number
  inventorySummary: {
    totalSkus: number
    totalUnits: number
    valuation: number
    lowStockCount: number
    outOfStockCount: number
  }
}

export async function getReportsData(params: ReportFilterParams = {}): Promise<ReportsData> {
  const supabase = await createClient()

  // Calculate dates
  const now = new Date()
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
  let rangeLabel = 'This Month'

  if (params.range === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate = today.toISOString()
    rangeLabel = 'Today'
  } else if (params.range === 'last_7_days') {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
    startDate = d.toISOString()
    rangeLabel = 'Last 7 Days'
  } else if (params.range === 'last_30_days') {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    d.setHours(0, 0, 0, 0)
    startDate = d.toISOString()
    rangeLabel = 'Last 30 Days'
  } else if (params.range === 'all') {
    startDate = '2020-01-01T00:00:00.000Z'
    rangeLabel = 'All Time'
  }

  // 1. Fetch Orders in range
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, subtotal, discount_amount, total_amount, tax_amount, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const statusBreakdown: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  }

  let grossSales = 0
  let discountsGiven = 0
  let taxCollected = 0
  let deliveredOrders = 0
  let cancelledOrders = 0

  for (const o of orders || []) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1

    if (o.status === 'delivered') {
      deliveredOrders += 1
      grossSales += Number(o.total_amount) || 0
      discountsGiven += Number(o.discount_amount) || 0
      taxCollected += Number(o.tax_amount) || 0
    } else if (o.status === 'cancelled') {
      cancelledOrders += 1
    }
  }

  const totalOrders = orders?.length || 0
  const netSales = Math.round((grossSales - discountsGiven) * 100) / 100
  const averageOrderValue = deliveredOrders > 0 ? Math.round((grossSales / deliveredOrders) * 100) / 100 : 0

  // 2. Fetch Top Selling Products in range
  const deliveredOrderIds = (orders || []).filter((o) => o.status === 'delivered').map((o) => o.id)
  let topProducts: ReportsData['topProducts'] = []

  if (deliveredOrderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, total_amount')
      .in('order_id', deliveredOrderIds)

    const prodAgg = new Map<string, { name: string; units: number; rev: number }>()
    for (const it of orderItems || []) {
      const pid = it.product_id || 'unknown'
      const curr = prodAgg.get(pid) || { name: it.product_name || 'Product', units: 0, rev: 0 }
      curr.units += Number(it.quantity) || 0
      curr.rev += Number(it.total_amount) || 0
      prodAgg.set(pid, curr)
    }

    topProducts = Array.from(prodAgg.entries())
      .map(([id, val]) => ({
        productId: id,
        name: val.name,
        unitsSold: val.units,
        totalRevenue: Math.round(val.rev * 100) / 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
  }

  // 3. Fetch Operating Expenses in range
  const { data: expenses } = await supabase
    .from('expenses')
    .select('category, amount, expense_date')
    .gte('expense_date', startDate.slice(0, 10))
    .lte('expense_date', endDate.slice(0, 10))

  const catMap = new Map<string, number>()
  let totalExpenses = 0
  for (const exp of expenses || []) {
    const amt = Number(exp.amount) || 0
    totalExpenses += amt
    catMap.set(exp.category, (catMap.get(exp.category) || 0) + amt)
  }

  const expensesByCategory = Array.from(catMap.entries()).map(([cat, amt]) => ({
    category: cat,
    amount: Math.round(amt * 100) / 100,
  }))

  // 4. Fetch Inventory Summary
  const { data: products } = await supabase
    .from('products')
    .select('stock_quantity, purchase_cost, reorder_level, is_active')
    .eq('is_active', true)

  let totalUnits = 0
  let valuation = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  for (const p of products || []) {
    const stock = Number(p.stock_quantity) || 0
    const cost = Number(p.purchase_cost) || 0
    const reorder = Number(p.reorder_level) || 5

    totalUnits += stock
    valuation += stock * cost

    if (stock <= 0) outOfStockCount += 1
    else if (stock <= reorder) lowStockCount += 1
  }

  return {
    rangeLabel,
    startDate,
    endDate,
    salesSummary: {
      grossSales: Math.round(grossSales * 100) / 100,
      netSales,
      totalOrders,
      averageOrderValue,
      deliveredOrders,
      cancelledOrders,
      discountsGiven: Math.round(discountsGiven * 100) / 100,
      taxCollected: Math.round(taxCollected * 100) / 100,
    },
    statusBreakdown,
    topProducts,
    expensesByCategory,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    inventorySummary: {
      totalSkus: products?.length || 0,
      totalUnits,
      valuation: Math.round(valuation * 100) / 100,
      lowStockCount,
      outOfStockCount,
    },
  }
}
