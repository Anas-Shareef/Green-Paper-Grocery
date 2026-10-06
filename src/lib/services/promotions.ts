import { createClient } from '@/lib/supabase/server'
import type {
  Promotion,
  PromotionType,
  DiscountType,
  PromotionStatus,
} from '@/types/database.types'
import { logAuditEvent } from './audit'

export interface PromotionWithRelations extends Promotion {
  product_ids?: string[]
  category_ids?: string[]
  products?: Array<{ id: string; name: string; selling_price: number }>
  categories?: Array<{ id: string; name: string }>
}

export interface PromotionFilterParams {
  query?: string
  status?: PromotionStatus | 'all'
  promotion_type?: PromotionType | 'all'
  page?: number
  limit?: number
}

/**
 * Retrieves promotions list for staff/admin with search and pagination.
 */
export async function getPromotions(params: PromotionFilterParams = {}): Promise<{
  promotions: Promotion[]
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

  let query = supabase.from('promotions').select('*', { count: 'exact' })

  if (params.query?.trim()) {
    query = query.ilike('name', `%${params.query.trim()}%`)
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.promotion_type && params.promotion_type !== 'all') {
    query = query.eq('promotion_type', params.promotion_type)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching promotions:', error)
    return { promotions: [], total: 0, page, limit, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    promotions: (data as Promotion[]) || [],
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Retrieves single promotion with linked products and categories.
 */
export async function getPromotionById(id: string): Promise<PromotionWithRelations | null> {
  const supabase = await createClient()

  const { data: promo, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !promo) {
    console.error('Error fetching promotion:', error)
    return null
  }

  // Fetch linked products
  const { data: promoProds } = await supabase
    .from('promotion_products')
    .select('product_id, products(id, name, selling_price)')
    .eq('promotion_id', id)

  // Fetch linked categories
  const { data: promoCats } = await supabase
    .from('promotion_categories')
    .select('category_id, categories(id, name)')
    .eq('promotion_id', id)

  const products = (promoProds || [])
    .map((p) => p.products)
    .filter(Boolean) as unknown as Array<{ id: string; name: string; selling_price: number }>

  const categories = (promoCats || [])
    .map((c) => c.categories)
    .filter(Boolean) as unknown as Array<{ id: string; name: string }>

  return {
    ...(promo as Promotion),
    product_ids: (promoProds || []).map((p) => p.product_id),
    category_ids: (promoCats || []).map((c) => c.category_id),
    products,
    categories,
  }
}

/**
 * Creates a new promotional rule with validations and audit logging.
 */
export async function createPromotion(data: {
  name: string
  description?: string
  promotion_type: PromotionType
  discount_type: DiscountType
  discount_value: number
  minimum_order_amount?: number
  maximum_discount_amount?: number | null
  buy_quantity?: number | null
  get_quantity?: number | null
  start_at: string
  end_at?: string | null
  status?: PromotionStatus
  usage_limit?: number | null
  per_customer_limit?: number | null
  is_exclusive?: boolean
  banner_text?: string | null
  product_ids?: string[]
  category_ids?: string[]
}): Promise<Promotion> {
  const supabase = await createClient()

  // Validate commercial parameters
  if (!data.name.trim()) {
    throw new Error('Promotion name is required')
  }

  if (data.discount_value <= 0) {
    throw new Error('Discount value must be greater than zero')
  }

  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    throw new Error('Percentage discount cannot exceed 100%')
  }

  if (data.end_at && new Date(data.end_at) <= new Date(data.start_at)) {
    throw new Error('End date must be after start date')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: promo, error } = await supabase
    .from('promotions')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      promotion_type: data.promotion_type,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      minimum_order_amount: data.minimum_order_amount || 0,
      maximum_discount_amount: data.maximum_discount_amount ?? null,
      buy_quantity: data.buy_quantity ?? null,
      get_quantity: data.get_quantity ?? null,
      start_at: data.start_at,
      end_at: data.end_at || null,
      status: data.status || 'active',
      usage_limit: data.usage_limit ?? null,
      usage_count: 0,
      per_customer_limit: data.per_customer_limit ?? null,
      is_exclusive: data.is_exclusive ?? false,
      banner_text: data.banner_text?.trim() || null,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error || !promo) {
    console.error('Failed to create promotion:', error)
    throw new Error(error?.message || 'Failed to create promotion')
  }

  // Link products if applicable
  if (data.product_ids && data.product_ids.length > 0) {
    const prodInserts = data.product_ids.map((productId) => ({
      promotion_id: promo.id,
      product_id: productId,
    }))
    await supabase.from('promotion_products').insert(prodInserts)
  }

  // Link categories if applicable
  if (data.category_ids && data.category_ids.length > 0) {
    const catInserts = data.category_ids.map((categoryId) => ({
      promotion_id: promo.id,
      category_id: categoryId,
    }))
    await supabase.from('promotion_categories').insert(catInserts)
  }

  await logAuditEvent({
    action: 'promotion.created',
    entityType: 'promotion',
    entityId: promo.id,
    newValues: {
      name: promo.name,
      promotion_type: promo.promotion_type,
      discount_value: promo.discount_value,
    },
  })

  return promo as Promotion
}

/**
 * Updates an existing promotion (status, date scheduling, limits).
 */
export async function updatePromotion(
  id: string,
  data: Partial<{
    name: string
    description: string | null
    status: PromotionStatus
    start_at: string
    end_at: string | null
    usage_limit: number | null
    per_customer_limit: number | null
    minimum_order_amount: number
    maximum_discount_amount: number | null
    banner_text: string | null
    is_exclusive: boolean
  }>
): Promise<Promotion> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('promotions')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !updated) {
    console.error('Failed to update promotion:', error)
    throw new Error(error?.message || 'Failed to update promotion')
  }

  await logAuditEvent({
    action: 'promotion.updated',
    entityType: 'promotion',
    entityId: id,
    newValues: data,
  })

  return updated as Promotion
}

/**
 * Retrieves active storefront banners and campaigns for display.
 */
export async function getActiveStorefrontPromotions(): Promise<Promotion[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.includes('placeholder-project.supabase.co')) {
    return []
  }

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_at', now)
      .or(`end_at.is.null,end_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.warn(
        '[Promotions] Could not fetch active promotions from Supabase:',
        error.message || error.code || 'database unavailable'
      )
      return []
    }

    return (data as Promotion[]) || []
  } catch (err) {
    console.warn(
      '[Promotions] Error connecting to Supabase for promotions:',
      err instanceof Error ? err.message : String(err)
    )
    return []
  }
}

/**
 * Given a list of product IDs, resolves any active product-specific promotions.
 */
export async function getActivePromotionsForProducts(
  productIds: string[]
): Promise<Record<string, { discount_type: DiscountType; discount_value: number; promo_name: string }>> {
  if (!productIds || productIds.length === 0) return {}

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('promotion_products')
    .select(`
      product_id,
      promotions:promotion_id (
        id, name, discount_type, discount_value, status, start_at, end_at
      )
    `)
    .in('product_id', productIds)

  const promoMap: Record<string, { discount_type: DiscountType; discount_value: number; promo_name: string }> = {}

  data?.forEach((row) => {
    const p = row.promotions as unknown as Promotion | null
    if (
      p &&
      p.status === 'active' &&
      p.start_at <= now &&
      (!p.end_at || p.end_at > now)
    ) {
      // Pick best discount if multiple exist
      const existing = promoMap[row.product_id]
      if (!existing || p.discount_value > existing.discount_value) {
        promoMap[row.product_id] = {
          discount_type: p.discount_type,
          discount_value: p.discount_value,
          promo_name: p.name,
        }
      }
    }
  })

  return promoMap
}
