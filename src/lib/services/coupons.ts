import { createClient } from '@/lib/supabase/server'
import type { Coupon, Promotion } from '@/types/database.types'
import { logAuditEvent } from './audit'

export interface CouponWithPromotion extends Coupon {
  promotion?: Promotion | null
}

export interface CouponValidationResult {
  valid: boolean
  code: string
  couponId?: string
  discountAmount: number
  discountType?: 'percentage' | 'fixed_amount'
  discountValue?: number
  message: string
}

/**
 * Retrieves coupons with pagination, search, and status filtering for admin.
 */
export async function getCoupons(params: {
  query?: string
  isActive?: boolean | 'all'
  page?: number
  limit?: number
} = {}): Promise<{
  coupons: CouponWithPromotion[]
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

  let query = supabase.from('coupons').select('*, promotion:promotions(*)', { count: 'exact' })

  if (params.query?.trim()) {
    query = query.ilike('code', `%${params.query.trim().toUpperCase()}%`)
  }

  if (params.isActive !== undefined && params.isActive !== 'all') {
    query = query.eq('is_active', params.isActive)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching coupons:', error)
    return { coupons: [], total: 0, page, limit, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    coupons: (data as unknown as CouponWithPromotion[]) || [],
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Retrieves a single coupon with linked promotion and redemptions.
 */
export async function getCouponById(id: string): Promise<CouponWithPromotion | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coupons')
    .select('*, promotion:promotions(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Error fetching coupon:', error)
    return null
  }

  return data as unknown as CouponWithPromotion
}

/**
 * Creates a new coupon code tied to an underlying promotion.
 * Code is normalized to uppercase and verified for uniqueness.
 */
export async function createCoupon(data: {
  code: string
  promotion_id: string
  usage_limit?: number | null
  per_customer_limit?: number
  minimum_order_amount?: number | null
  maximum_discount_amount?: number | null
  start_at: string
  end_at?: string | null
  is_active?: boolean
}): Promise<Coupon> {
  const supabase = await createClient()
  const normalizedCode = data.code.trim().toUpperCase()

  if (!normalizedCode) {
    throw new Error('Coupon code is required')
  }

  // Enforce uppercase alphanumeric / hyphen standard
  if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
    throw new Error('Coupon code can only contain letters, numbers, and dashes')
  }

  // Check unique code
  const { data: existing } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (existing) {
    throw new Error(`Coupon code "${normalizedCode}" already exists`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      code: normalizedCode,
      promotion_id: data.promotion_id,
      usage_limit: data.usage_limit ?? null,
      usage_count: 0,
      per_customer_limit: Math.max(1, data.per_customer_limit || 1),
      minimum_order_amount: data.minimum_order_amount ?? null,
      maximum_discount_amount: data.maximum_discount_amount ?? null,
      start_at: data.start_at,
      end_at: data.end_at || null,
      is_active: data.is_active ?? true,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error || !coupon) {
    console.error('Failed to create coupon:', error)
    throw new Error(error?.message || 'Failed to create coupon')
  }

  await logAuditEvent({
    action: 'coupon.created',
    entityType: 'coupon',
    entityId: coupon.id,
    newValues: {
      code: coupon.code,
      promotion_id: coupon.promotion_id,
    },
  })

  return coupon as Coupon
}

/**
 * Updates coupon settings or active status.
 */
export async function updateCoupon(
  id: string,
  data: Partial<{
    is_active: boolean
    usage_limit: number | null
    per_customer_limit: number
    minimum_order_amount: number | null
    maximum_discount_amount: number | null
    end_at: string | null
  }>
): Promise<Coupon> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('coupons')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !updated) {
    console.error('Failed to update coupon:', error)
    throw new Error(error?.message || 'Failed to update coupon')
  }

  await logAuditEvent({
    action: 'coupon.updated',
    entityType: 'coupon',
    entityId: id,
    newValues: data,
  })

  return updated as Coupon
}

/**
 * Server-authoritative preview validation for customer checkout.
 * Evaluates validity, limits, dates, minimum spend, and calculates estimated discount.
 */
export async function validateCouponPreview(
  rawCode: string,
  currentSubtotal: number,
  customerId?: string | null
): Promise<CouponValidationResult> {
  const normalizedCode = (rawCode || '').trim().toUpperCase()

  if (!normalizedCode) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: 'Please enter a coupon code.',
    }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select(`
      *,
      promotion:promotions(
        id, name, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, status
      )
    `)
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error || !coupon) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: `Coupon "${normalizedCode}" is invalid.`,
    }
  }

  if (!coupon.is_active) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: `Coupon "${normalizedCode}" is no longer active.`,
    }
  }

  if (coupon.start_at > now) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: `Coupon "${normalizedCode}" is not valid yet.`,
    }
  }

  if (coupon.end_at && coupon.end_at <= now) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: `Coupon "${normalizedCode}" has expired.`,
    }
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: `Coupon "${normalizedCode}" has reached its maximum usage limit.`,
    }
  }

  // Check minimum order amount
  const minRequired = coupon.minimum_order_amount ?? coupon.promotion?.minimum_order_amount ?? 0
  if (currentSubtotal < minRequired) {
    const diff = (minRequired - currentSubtotal).toFixed(2)
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: `Add AED ${diff} more to use coupon "${normalizedCode}" (minimum spend AED ${minRequired}).`,
    }
  }

  // Check customer usage limit if customerId is provided
  if (customerId) {
    const { count } = await supabase
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('customer_id', customerId)

    if (count !== null && count >= coupon.per_customer_limit) {
      return {
        valid: false,
        code: normalizedCode,
        discountAmount: 0,
        message: `You have already used coupon "${normalizedCode}" the maximum allowed times.`,
      }
    }
  }

  const promo = coupon.promotion
  if (!promo) {
    return {
      valid: false,
      code: normalizedCode,
      discountAmount: 0,
      message: 'Linked promotion not found for this coupon.',
    }
  }

  // Calculate discount preview
  let calculatedDiscount = 0
  if (promo.discount_type === 'percentage') {
    calculatedDiscount = Number(((currentSubtotal * promo.discount_value) / 100).toFixed(2))
    const maxDiscount = coupon.maximum_discount_amount ?? promo.maximum_discount_amount
    if (maxDiscount !== null && maxDiscount !== undefined) {
      calculatedDiscount = Math.min(calculatedDiscount, maxDiscount)
    }
  } else if (promo.discount_type === 'fixed_amount') {
    calculatedDiscount = Math.min(currentSubtotal, promo.discount_value)
  }

  return {
    valid: true,
    code: normalizedCode,
    couponId: coupon.id,
    discountAmount: calculatedDiscount,
    discountType: promo.discount_type as 'percentage' | 'fixed_amount',
    discountValue: promo.discount_value,
    message: `Coupon "${normalizedCode}" applied! You save AED ${calculatedDiscount.toFixed(2)}.`,
  }
}
