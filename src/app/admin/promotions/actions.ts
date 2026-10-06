'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createPromotion,
  updatePromotion,
} from '@/lib/services/promotions'
import { requirePermission } from '@/lib/auth/permissions'
import type {
  PromotionType,
  DiscountType,
  PromotionStatus,
} from '@/types/database.types'

export async function handleCreatePromotion(formData: FormData) {
  await requirePermission('promotions.create')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const promotion_type = formData.get('promotion_type') as PromotionType
  const discount_type = formData.get('discount_type') as DiscountType
  const discount_value = Number(formData.get('discount_value'))
  const minimum_order_amount = Number(formData.get('minimum_order_amount') || 0)
  const maximum_discount_amount = formData.get('maximum_discount_amount')
    ? Number(formData.get('maximum_discount_amount'))
    : null
  const buy_quantity = formData.get('buy_quantity')
    ? Number(formData.get('buy_quantity'))
    : null
  const get_quantity = formData.get('get_quantity')
    ? Number(formData.get('get_quantity'))
    : null
  const start_at = formData.get('start_at') as string || new Date().toISOString()
  const end_at = (formData.get('end_at') as string) || null
  const status = (formData.get('status') as PromotionStatus) || 'active'
  const usage_limit = formData.get('usage_limit')
    ? Number(formData.get('usage_limit'))
    : null
  const per_customer_limit = formData.get('per_customer_limit')
    ? Number(formData.get('per_customer_limit'))
    : null
  const is_exclusive = formData.get('is_exclusive') === 'on'
  const banner_text = (formData.get('banner_text') as string) || null

  // Multiple product / category selection
  const product_ids = formData.getAll('product_ids') as string[]
  const category_ids = formData.getAll('category_ids') as string[]

  const promo = await createPromotion({
    name,
    description,
    promotion_type,
    discount_type,
    discount_value,
    minimum_order_amount,
    maximum_discount_amount,
    buy_quantity,
    get_quantity,
    start_at,
    end_at: end_at ? new Date(end_at).toISOString() : null,
    status,
    usage_limit,
    per_customer_limit,
    is_exclusive,
    banner_text,
    product_ids: product_ids.filter(Boolean),
    category_ids: category_ids.filter(Boolean),
  })

  revalidatePath('/admin/promotions')
  redirect(`/admin/promotions/${promo.id}`)
}

export async function handleUpdatePromotionStatus(
  id: string,
  status: PromotionStatus
) {
  await requirePermission('promotions.update')
  await updatePromotion(id, { status })
  revalidatePath('/admin/promotions')
  revalidatePath(`/admin/promotions/${id}`)
}
