import { createClient } from '@/lib/supabase/server'
import type {
  InventoryMovement,
  InventoryMovementType,
  InventoryCount,
  InventoryCountItem,
  Product,
} from '@/types/database.types'
import { logAuditEvent } from './audit'
import { requirePermission } from '@/lib/auth/permissions'

export interface MutateStockParams {
  productId: string
  quantityChange: number // positive for additions, negative for reductions
  movementType: InventoryMovementType
  referenceType?: string
  referenceId?: string
  unitCost?: number
  notes?: string
  userId?: string
  allowNegative?: boolean
}

export interface InventoryMetrics {
  totalProducts: number
  totalStockQuantity: number
  totalInventoryValue: number
  lowStockCount: number
  outOfStockCount: number
}

export interface InventoryMovementFilterParams {
  productId?: string
  movementType?: InventoryMovementType | 'all'
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface InventoryMovementWithProduct extends InventoryMovement {
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit' | 'purchase_cost'> | null
}

export interface InventoryMovementHistoryResult {
  movements: InventoryMovementWithProduct[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Validates stock movement type and asserts direction consistency
 */
export function validateMovementDirection(
  type: InventoryMovementType,
  quantityChange: number
): void {
  switch (type) {
    case 'purchase':
    case 'customer_return':
    case 'opening_stock':
      if (quantityChange <= 0) {
        throw new Error(`Movement type "${type}" requires a positive quantity change.`)
      }
      break
    case 'sale':
    case 'supplier_return':
    case 'damaged':
    case 'expired':
      if (quantityChange >= 0) {
        throw new Error(`Movement type "${type}" requires a negative quantity change.`)
      }
      break
    case 'adjustment':
      if (quantityChange === 0) {
        throw new Error('Stock adjustment quantity change cannot be zero.')
      }
      break
    default:
      break
  }
}

/**
 * Centralized stock status evaluation
 */
export function getStockStatus(stock: number, reorderLevel: number): 'out_of_stock' | 'low_stock' | 'in_stock' {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= reorderLevel) return 'low_stock'
  return 'in_stock'
}

/**
 * Atomic stock mutation using the PostgreSQL RPC function `mutate_stock_atomic`.
 * Guarantees that product stock, inventory movement audit row, and system audit log
 * are committed together or all rolled back atomically.
 */
export async function mutateStockAtomic(params: MutateStockParams): Promise<number> {
  validateMovementDirection(params.movementType, params.quantityChange)
  await requirePermission('inventory.adjust')

  const supabase = await createClient()

  let userId = params.userId
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id
  }

  const { data: newStock, error } = await supabase.rpc('mutate_stock_atomic', {
    p_product_id: params.productId,
    p_quantity_change: params.quantityChange,
    p_movement_type: params.movementType,
    p_reference_type: params.referenceType ?? null,
    p_reference_id: params.referenceId ?? null,
    p_unit_cost: params.unitCost ?? null,
    p_notes: params.notes ?? null,
    p_user_id: userId ?? null,
    p_allow_negative: params.allowNegative ?? false,
  })

  if (error) {
    console.error('Failed atomic stock mutation:', error)
    throw new Error(`Inventory mutation failed: ${error.message}`)
  }

  return Number(newStock)
}

/**
 * Convenience helper: Increase stock (purchases, returns, adjustments)
 */
export async function increaseStock(
  productId: string,
  quantity: number,
  movementType: 'purchase' | 'customer_return' | 'opening_stock' | 'adjustment',
  options?: {
    referenceType?: string
    referenceId?: string
    unitCost?: number
    notes?: string
    userId?: string
  }
): Promise<number> {
  if (quantity <= 0) {
    throw new Error('Quantity to increase must be strictly greater than zero.')
  }
  return mutateStockAtomic({
    productId,
    quantityChange: Math.abs(quantity),
    movementType,
    ...options,
  })
}

/**
 * Convenience helper: Decrease stock (sales, damages, supplier returns)
 */
export async function decreaseStock(
  productId: string,
  quantity: number,
  movementType: 'sale' | 'supplier_return' | 'damaged' | 'expired' | 'adjustment',
  options?: {
    referenceType?: string
    referenceId?: string
    unitCost?: number
    notes?: string
    userId?: string
    allowNegative?: boolean
  }
): Promise<number> {
  if (quantity <= 0) {
    throw new Error('Quantity to decrease must be strictly greater than zero.')
  }
  return mutateStockAtomic({
    productId,
    quantityChange: -Math.abs(quantity),
    movementType,
    ...options,
  })
}

/**
 * Explicit stock adjustment
 */
export async function adjustStock(
  productId: string,
  difference: number,
  reason: string,
  notes?: string,
  userId?: string
): Promise<number> {
  if (difference === 0) {
    throw new Error('Adjustment difference cannot be zero.')
  }
  const combinedNotes = notes ? `${reason}: ${notes}` : reason
  return mutateStockAtomic({
    productId,
    quantityChange: difference,
    movementType: 'adjustment',
    referenceType: 'manual_adjustment',
    notes: combinedNotes,
    userId,
    allowNegative: false,
  })
}

/**
 * Server-side stock query: Gets available real-time stock
 */
export async function getAvailableStock(productId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()

  if (error || !data) {
    throw new Error(`Product not found: ${productId}`)
  }

  return Number(data.stock_quantity || 0)
}

/**
 * Aggregates real inventory metrics directly on the server without loading
 * thousands of products into browser memory.
 */
export async function getInventoryMetrics(): Promise<InventoryMetrics> {
  await requirePermission('inventory.view')
  const supabase = await createClient()

  // 1. Try server RPC function
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_inventory_metrics')

  if (!rpcError && rpcData && rpcData.length > 0) {
    const row = rpcData[0]
    return {
      totalProducts: Number(row.total_products || 0),
      totalStockQuantity: Number(row.total_stock_quantity || 0),
      totalInventoryValue: Number(row.total_inventory_value || 0),
      lowStockCount: Number(row.low_stock_count || 0),
      outOfStockCount: Number(row.out_of_stock_count || 0),
    }
  }

  // 2. Direct database query fallback
  const { data: products, error } = await supabase
    .from('products')
    .select('stock_quantity, purchase_cost, reorder_level')
    .eq('is_active', true)
    .is('archived_at', null)

  if (error || !products) {
    console.error('Error fetching inventory valuation metrics:', error)
    return {
      totalProducts: 0,
      totalStockQuantity: 0,
      totalInventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    }
  }

  let totalStockQuantity = 0
  let totalInventoryValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  for (const p of products) {
    const stock = Number(p.stock_quantity || 0)
    const cost = Number(p.purchase_cost || 0)
    const reorder = Number(p.reorder_level || 0)

    totalStockQuantity += stock
    totalInventoryValue += stock * cost

    if (stock <= 0) {
      outOfStockCount++
    } else if (stock <= reorder) {
      lowStockCount++
    }
  }

  return {
    totalProducts: products.length,
    totalStockQuantity,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount,
  }
}

/**
 * Retrieves movement history with server-side pagination, filters, and product details
 */
export async function getInventoryHistory(
  params: InventoryMovementFilterParams = {}
): Promise<InventoryMovementHistoryResult> {
  await requirePermission('inventory.view')
  const supabase = await createClient()

  const {
    productId,
    movementType,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = params

  const offset = (Math.max(1, page) - 1) * limit

  let query = supabase
    .from('inventory_movements')
    .select('*, product:products(id, name, sku, unit, purchase_cost)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (productId) {
    query = query.eq('product_id', productId)
  }

  if (movementType && movementType !== 'all') {
    query = query.eq('movement_type', movementType)
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching inventory history:', error)
    return {
      movements: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    }
  }

  const movements = (data as unknown as InventoryMovementWithProduct[]) ?? []
  const total = count ?? movements.length
  const totalPages = Math.ceil(total / limit) || 1

  return {
    movements,
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Retrieves list of inventory count (stocktake) sessions
 */
export async function getInventoryCounts(): Promise<InventoryCount[]> {
  await requirePermission('inventory.count')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_counts')
    .select('*')
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventory counts:', error)
    return []
  }

  return (data as InventoryCount[]) ?? []
}

/**
 * Retrieves an inventory count session by ID with its counted line items
 */
export async function getInventoryCountById(countId: string): Promise<{
  count: InventoryCount | null
  items: (InventoryCountItem & { product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null })[]
}> {
  await requirePermission('inventory.count')
  const supabase = await createClient()

  const { data: count, error: countError } = await supabase
    .from('inventory_counts')
    .select('*')
    .eq('id', countId)
    .single()

  if (countError || !count) {
    return { count: null, items: [] }
  }

  const { data: items, error: itemsError } = await supabase
    .from('inventory_count_items')
    .select('*, product:products(id, name, sku, unit)')
    .eq('inventory_count_id', countId)
    .order('created_at', { ascending: true })

  if (itemsError) {
    console.error('Error fetching count items:', itemsError)
  }

  return {
    count: count as InventoryCount,
    items: (items as unknown as (InventoryCountItem & { product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null })[]) ?? [],
  }
}

/**
 * Creates an inventory count session (Stocktake)
 */
export async function createInventoryCount(params: {
  reference?: string
  notes?: string
  userId?: string
}): Promise<InventoryCount> {
  await requirePermission('inventory.count')
  const supabase = await createClient()

  let countedBy = params.userId
  if (!countedBy) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    countedBy = user?.id
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const reference = params.reference?.trim() || `STK-${dateStr}-${randomSuffix}`

  const { data, error } = await supabase
    .from('inventory_counts')
    .insert({
      reference,
      notes: params.notes ?? null,
      counted_by: countedBy ?? null,
      status: 'draft',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create inventory count:', error)
    throw new Error(`Failed to create inventory count: ${error.message}`)
  }

  await logAuditEvent({
    action: 'inventory.count_created',
    entityType: 'inventory_count',
    entityId: data.id,
    newValues: { reference, notes: params.notes },
  })

  return data as InventoryCount
}

/**
 * Completes an inventory count session and applies atomic reconciliation adjustments.
 * Enforces count immutability once completed.
 */
export async function completeInventoryCount(
  countId: string,
  items: Array<{
    productId: string
    systemQuantity: number
    countedQuantity: number
    reason?: string
  }>,
  userId?: string
): Promise<void> {
  await requirePermission('inventory.count')
  const supabase = await createClient()

  let actorId = userId
  if (!actorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    actorId = user?.id
  }

  // 1. Primary path: Complete stocktake atomically with row-locking concurrency protection
  const { error: rpcError } = await supabase.rpc('complete_inventory_count_atomic', {
    p_count_id: countId,
    p_items: items.map((item) => ({
      productId: item.productId,
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
      reason: item.reason ?? (item.countedQuantity !== item.systemQuantity ? 'Stocktake variance reconciliation' : 'Stock verified'),
    })),
    p_user_id: actorId ?? null,
  })

  if (!rpcError) {
    return
  }

  // If error is a business constraint violation from the RPC, throw immediately
  if (
    rpcError.message &&
    !rpcError.message.includes('function') &&
    !rpcError.message.includes('not found') &&
    !rpcError.message.includes('schema cache')
  ) {
    throw new Error(rpcError.message)
  }

  console.warn('complete_inventory_count_atomic RPC unavailable, falling back to sequential execution:', rpcError.message)

  // 2. Sequential fallback if RPC is not deployed in local/test environment
  const { data: count, error: fetchError } = await supabase
    .from('inventory_counts')
    .select('id, status, reference')
    .eq('id', countId)
    .single()

  if (fetchError || !count) {
    throw new Error(`Inventory count ${countId} not found`)
  }

  if (count.status === 'completed') {
    throw new Error('This inventory count has already been completed and cannot be modified.')
  }
  if (count.status === 'cancelled') {
    throw new Error('This inventory count was cancelled and cannot be completed.')
  }

  // Insert line items and mutate discrepancies atomically using corrected reconciliation math:
  // interim_movement_quantity = system_quantity_at_completion - snapshot_quantity
  // actual_reconciliation_difference = counted_quantity - system_quantity_at_completion
  // final_stock = counted_quantity
  const completionTime = new Date().toISOString()
  for (const item of items) {
    const snapshotQty = item.systemQuantity
    const { data: prod } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.productId)
      .single()

    const currentStock = Number(prod?.stock_quantity ?? snapshotQty)
    const interimMovement = Number((currentStock - snapshotQty).toFixed(3))
    const actualDiff = Number((item.countedQuantity - currentStock).toFixed(3))
    const observedDiff = Number((item.countedQuantity - snapshotQty).toFixed(3))

    const { error: itemError } = await supabase.from('inventory_count_items').insert({
      inventory_count_id: countId,
      product_id: item.productId,
      system_quantity: snapshotQty,
      counted_quantity: item.countedQuantity,
      difference: observedDiff,
      system_quantity_at_completion: currentStock,
      interim_movement_quantity: interimMovement,
      actual_reconciliation_difference: actualDiff,
      resulting_stock: item.countedQuantity,
      completed_at: completionTime,
      reason: item.reason ?? (actualDiff !== 0 ? 'Stocktake variance reconciliation' : 'Stock verified'),
    })

    if (itemError) {
      console.error('Failed to insert inventory count item:', itemError)
      throw new Error(`Failed to record line item: ${itemError.message}`)
    }

    // Atomically mutate stock to reconcile physical count against CURRENT stock
    if (actualDiff !== 0) {
      await mutateStockAtomic({
        productId: item.productId,
        quantityChange: actualDiff,
        movementType: 'adjustment',
        referenceType: 'inventory_count',
        referenceId: countId,
        notes: `Physical Stocktake Reconciliation (${count.reference}) - Variance: ${actualDiff > 0 ? '+' : ''}${actualDiff} against current stock (Interim movement: ${interimMovement}). Reason: ${item.reason || 'Variance correction'}`,
        userId: actorId,
      })
    }
  }

  // Mark count session as immutable completed
  const { error: completeError } = await supabase
    .from('inventory_counts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', countId)

  if (completeError) {
    console.error('Failed to mark inventory count as completed:', completeError)
    throw new Error(`Failed to complete count: ${completeError.message}`)
  }

  await logAuditEvent({
    action: 'inventory.count_completed',
    entityType: 'inventory_count',
    entityId: countId,
    newValues: {
      reference: count.reference,
      totalItemsReconciled: items.length,
      variancesDetected: items.filter((i) => i.countedQuantity !== i.systemQuantity).length,
    },
  })
}

/**
 * Cancels an inventory count session without altering stock levels
 */
export async function cancelInventoryCount(countId: string): Promise<void> {
  await requirePermission('inventory.count')
  const supabase = await createClient()

  const { data: count, error: fetchError } = await supabase
    .from('inventory_counts')
    .select('id, status, reference')
    .eq('id', countId)
    .single()

  if (fetchError || !count) {
    throw new Error(`Inventory count ${countId} not found`)
  }

  if (count.status === 'completed') {
    throw new Error('Completed inventory counts cannot be cancelled.')
  }

  const { error } = await supabase
    .from('inventory_counts')
    .update({ status: 'cancelled' })
    .eq('id', countId)

  if (error) {
    throw new Error(`Failed to cancel inventory count: ${error.message}`)
  }

  await logAuditEvent({
    action: 'inventory.count_cancelled',
    entityType: 'inventory_count',
    entityId: countId,
    newValues: { reference: count.reference },
  })
}
