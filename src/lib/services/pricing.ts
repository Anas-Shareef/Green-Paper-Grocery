import { createClient } from '@/lib/supabase/server'
import type { ProductPriceHistory } from '@/types/database.types'
import { logAuditEvent } from './audit'

export interface RecordPriceChangeParams {
  productId: string
  purchaseCost: number
  normalSellingPrice: number
  promoPrice?: number | null
  minimumSellingPrice: number
  reason?: string
  userId?: string
}

/**
 * Validates price rules before changing prices:
 * - normal selling price must be >= minimum selling price
 * - promo price must be >= minimum selling price
 * - purchase cost cannot be negative
 */
export function validatePriceRules(params: {
  normalSellingPrice: number
  minimumSellingPrice: number
  promoPrice?: number | null
  purchaseCost: number
}): void {
  if (params.purchaseCost < 0) {
    throw new Error('Purchase cost cannot be negative.')
  }
  if (params.minimumSellingPrice < 0) {
    throw new Error('Minimum selling price cannot be negative.')
  }
  if (params.normalSellingPrice < params.minimumSellingPrice) {
    throw new Error(
      `Normal selling price (${params.normalSellingPrice}) cannot be lower than minimum allowed price (${params.minimumSellingPrice}).`
    )
  }
  if (
    params.promoPrice !== undefined &&
    params.promoPrice !== null &&
    params.promoPrice < params.minimumSellingPrice
  ) {
    throw new Error(
      `Promotional price (${params.promoPrice}) cannot be lower than minimum allowed price (${params.minimumSellingPrice}).`
    )
  }
  if (
    params.promoPrice !== undefined &&
    params.promoPrice !== null &&
    params.promoPrice > params.normalSellingPrice
  ) {
    throw new Error(
      `Promotional price (${params.promoPrice}) cannot be greater than normal selling price (${params.normalSellingPrice}).`
    )
  }
}

/**
 * Records a price history record and closes the previous active price record
 */
export async function recordProductPriceHistory(
  params: RecordPriceChangeParams
): Promise<ProductPriceHistory> {
  validatePriceRules({
    purchaseCost: params.purchaseCost,
    normalSellingPrice: params.normalSellingPrice,
    promoPrice: params.promoPrice,
    minimumSellingPrice: params.minimumSellingPrice,
  })

  const supabase = await createClient()

  let userId = params.userId
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id
  }

  // 1. Try atomic PostgreSQL RPC function
  const { data: rpcResult, error: rpcError } = await supabase.rpc('record_product_price_change', {
    p_product_id: params.productId,
    p_purchase_cost: params.purchaseCost,
    p_normal_selling_price: params.normalSellingPrice,
    p_promo_price: params.promoPrice ?? null,
    p_minimum_selling_price: params.minimumSellingPrice,
    p_reason: params.reason ?? 'Price revision',
    p_user_id: userId ?? null,
  })

  if (!rpcError && rpcResult) {
    const { data: latest } = await supabase
      .from('product_price_history')
      .select('*')
      .eq('product_id', params.productId)
      .is('effective_until', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    if (latest) return latest as ProductPriceHistory
  }

  // 2. Direct fallback sequence if RPC is not present
  const now = new Date().toISOString()
  await supabase
    .from('product_price_history')
    .update({ effective_until: now })
    .eq('product_id', params.productId)
    .is('effective_until', null)

  const { data, error } = await supabase
    .from('product_price_history')
    .insert({
      product_id: params.productId,
      purchase_cost: params.purchaseCost,
      normal_selling_price: params.normalSellingPrice,
      promo_price: params.promoPrice ?? null,
      minimum_selling_price: params.minimumSellingPrice,
      effective_from: now,
      effective_until: null,
      changed_by: userId ?? null,
      reason: params.reason ?? 'Price revision',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to record product price history:', error)
    throw new Error(`Failed to record price history: ${error.message}`)
  }

  await logAuditEvent({
    action: 'product.price_changed',
    entityType: 'product',
    entityId: params.productId,
    newValues: {
      purchaseCost: params.purchaseCost,
      normalSellingPrice: params.normalSellingPrice,
      promoPrice: params.promoPrice,
      minimumSellingPrice: params.minimumSellingPrice,
      reason: params.reason,
    },
  })

  return data as ProductPriceHistory
}

/**
 * Retrieves historical price log for a product
 */
export async function getProductPriceHistory(
  productId: string
): Promise<ProductPriceHistory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_price_history')
    .select('*')
    .eq('product_id', productId)
    .order('effective_from', { ascending: false })

  if (error) {
    console.error('Error fetching product price history:', error)
    return []
  }

  return (data as ProductPriceHistory[]) ?? []
}
