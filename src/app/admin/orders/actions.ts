'use server'

import { revalidatePath } from 'next/cache'
import {
  transitionOrderStatus,
  assignOrderDelivery,
  updateItemFulfillment,
  collectOrderPayment,
  cancelOrderStaff,
  addOrderNote,
} from '@/lib/services/orders'
import type { OrderStatus, PaymentMethod } from '@/types/database.types'

export async function transitionOrderStatusAction(params: {
  orderId: string
  nextStatus: OrderStatus
  reason?: string
  notes?: string
  driverId?: string
  failureReason?: string
}) {
  const result = await transitionOrderStatus(params)
  if (result.success) {
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${params.orderId}`)
    revalidatePath('/admin/deliveries')
    revalidatePath(`/account/orders/${params.orderId}`)
  }
  return result
}

export async function assignOrderDeliveryAction(params: {
  orderId: string
  driverId: string
  notes?: string
}) {
  const result = await assignOrderDelivery(params)
  if (result.success) {
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${params.orderId}`)
    revalidatePath('/admin/deliveries')
  }
  return result
}

export async function updateItemFulfillmentAction(params: {
  orderId: string
  itemId: string
  status: 'pending' | 'picked' | 'packed' | 'unavailable'
  preparedQty?: number
}) {
  const result = await updateItemFulfillment(params)
  if (result.success) {
    revalidatePath(`/admin/orders/${params.orderId}`)
  }
  return result
}

export async function collectOrderPaymentAction(params: {
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
}) {
  const result = await collectOrderPayment(params)
  if (result.success) {
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${params.orderId}`)
  }
  return result
}

export async function cancelOrderStaffAction(params: {
  orderId: string
  reason: string
  restock?: boolean
}) {
  const result = await cancelOrderStaff(params)
  if (result.success) {
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${params.orderId}`)
    revalidatePath('/admin/deliveries')
    revalidatePath(`/account/orders/${params.orderId}`)
  }
  return result
}

export async function addOrderNoteAction(params: {
  orderId: string
  note: string
  visibility?: 'internal' | 'customer'
}) {
  const result = await addOrderNote(params)
  if (result.success) {
    revalidatePath(`/admin/orders/${params.orderId}`)
  }
  return result
}
