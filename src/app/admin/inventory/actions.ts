'use server'

import { revalidatePath } from 'next/cache'
import {
  adjustStock,
  createInventoryCount,
  completeInventoryCount,
  cancelInventoryCount,
} from '@/lib/services/inventory'
import { formatProductDatabaseError } from '@/lib/services/products'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function adjustStockAction(params: {
  productId: string
  type: 'increase' | 'decrease'
  quantity: number
  reason: string
  notes?: string
}): Promise<ActionResponse<{ newStock: number }>> {
  try {
    if (!params.productId) {
      return { success: false, error: 'Product selection is required.' }
    }
    if (!params.quantity || params.quantity <= 0) {
      return { success: false, error: 'Quantity must be strictly greater than zero.' }
    }

    const diff = params.type === 'increase' ? Math.abs(params.quantity) : -Math.abs(params.quantity)
    const newStock = await adjustStock(
      params.productId,
      diff,
      params.reason,
      params.notes
    )

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')
    revalidatePath('/admin/dashboard')

    return { success: true, data: { newStock } }
  } catch (err: unknown) {
    console.error('Server action error in adjustStockAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function createInventoryCountAction(params: {
  reference?: string
  notes?: string
}): Promise<ActionResponse<{ id: string; reference: string }>> {
  try {
    const count = await createInventoryCount(params)
    revalidatePath('/admin/inventory')
    return { success: true, data: { id: count.id, reference: count.reference } }
  } catch (err: unknown) {
    console.error('Server action error in createInventoryCountAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function completeInventoryCountAction(
  countId: string,
  items: Array<{
    productId: string
    systemQuantity: number
    countedQuantity: number
    reason?: string
  }>
): Promise<ActionResponse> {
  try {
    await completeInventoryCount(countId, items)
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err: unknown) {
    console.error('Server action error in completeInventoryCountAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function cancelInventoryCountAction(countId: string): Promise<ActionResponse> {
  try {
    await cancelInventoryCount(countId)
    revalidatePath('/admin/inventory')
    return { success: true }
  } catch (err: unknown) {
    console.error('Server action error in cancelInventoryCountAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}
