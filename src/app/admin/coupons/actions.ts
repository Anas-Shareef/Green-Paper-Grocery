'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createCoupon, updateCoupon } from '@/lib/services/coupons'
import { requirePermission } from '@/lib/auth/permissions'

export async function handleCreateCoupon(formData: FormData) {
  await requirePermission('coupons.create')

  const code = formData.get('code') as string
  const promotion_id = formData.get('promotion_id') as string
  const usage_limit = formData.get('usage_limit')
    ? Number(formData.get('usage_limit'))
    : null
  const per_customer_limit = Number(formData.get('per_customer_limit') || 1)
  const minimum_order_amount = formData.get('minimum_order_amount')
    ? Number(formData.get('minimum_order_amount'))
    : null
  const maximum_discount_amount = formData.get('maximum_discount_amount')
    ? Number(formData.get('maximum_discount_amount'))
    : null
  const start_at = (formData.get('start_at') as string) || new Date().toISOString()
  const end_at = (formData.get('end_at') as string) || null

  const coupon = await createCoupon({
    code,
    promotion_id,
    usage_limit,
    per_customer_limit,
    minimum_order_amount,
    maximum_discount_amount,
    start_at,
    end_at: end_at ? new Date(end_at).toISOString() : null,
    is_active: true,
  })

  revalidatePath('/admin/coupons')
  redirect(`/admin/coupons/${coupon.id}`)
}

export async function handleToggleCouponStatus(id: string, is_active: boolean) {
  await requirePermission('coupons.update')
  await updateCoupon(id, { is_active })
  revalidatePath('/admin/coupons')
  revalidatePath(`/admin/coupons/${id}`)
}
