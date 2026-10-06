'use server'

import { revalidatePath } from 'next/cache'
import { adjustLoyaltyPoints } from '@/lib/services/loyalty'
import { requirePermission } from '@/lib/auth/permissions'

export async function handleAdjustLoyaltyPoints(formData: FormData) {
  await requirePermission('loyalty.adjust')

  const customerId = formData.get('customer_id') as string
  const points = Number(formData.get('points'))
  const reason = (formData.get('reason') as string) || ''

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  if (points === 0) {
    throw new Error('Adjustment points cannot be zero')
  }

  if (!reason.trim()) {
    throw new Error('Reason is required for manual loyalty adjustment')
  }

  await adjustLoyaltyPoints({
    customerId,
    points,
    reason: reason.trim(),
  })

  revalidatePath('/admin/loyalty')
}
