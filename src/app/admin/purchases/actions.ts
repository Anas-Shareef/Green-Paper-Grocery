'use server'

import { revalidatePath } from 'next/cache'
import {
  createPurchase,
  updatePurchase,
  orderPurchase,
  cancelPurchase,
  receivePurchaseOrder,
  createSupplierInvoice,
  recordSupplierPayment,
  createSupplierReturn,
  completeSupplierReturn,
  type CreatePurchaseInput,
  type UpdatePurchaseInput,
  type ReceivePurchaseInput,
  type CreateInvoiceInput,
  type RecordPaymentInput,
  type CreateReturnInput,
} from '@/lib/services/purchases'

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

export async function createPurchaseAction(input: CreatePurchaseInput) {
  try {
    const purchase = await createPurchase(input)
    revalidatePath('/admin/purchases')
    revalidatePath('/admin/dashboard')
    return { success: true, data: purchase }
  } catch (err: unknown) {
    console.error('Error in createPurchaseAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to create purchase order') }
  }
}

export async function updatePurchaseAction(id: string, input: UpdatePurchaseInput) {
  try {
    const purchase = await updatePurchase(id, input)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${id}`)
    return { success: true, data: purchase }
  } catch (err: unknown) {
    console.error('Error in updatePurchaseAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to update purchase order') }
  }
}

export async function orderPurchaseAction(id: string) {
  try {
    const purchase = await orderPurchase(id)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${id}`)
    revalidatePath('/admin/dashboard')
    return { success: true, data: purchase }
  } catch (err: unknown) {
    console.error('Error in orderPurchaseAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to place purchase order') }
  }
}

export async function cancelPurchaseAction(id: string, reason?: string) {
  try {
    const purchase = await cancelPurchase(id, reason)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${id}`)
    revalidatePath('/admin/dashboard')
    return { success: true, data: purchase }
  } catch (err: unknown) {
    console.error('Error in cancelPurchaseAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to cancel purchase order') }
  }
}

export async function receivePurchaseAction(input: ReceivePurchaseInput) {
  try {
    const result = await receivePurchaseOrder(input)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${input.purchaseId}`)
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')
    revalidatePath('/admin/dashboard')
    return { success: true, data: result }
  } catch (err: unknown) {
    console.error('Error in receivePurchaseAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to receive goods') }
  }
}

export async function createInvoiceAction(input: CreateInvoiceInput) {
  try {
    const invoice = await createSupplierInvoice(input)
    revalidatePath('/admin/purchases')
    if (input.purchaseId) {
      revalidatePath(`/admin/purchases/${input.purchaseId}`)
    }
    revalidatePath(`/admin/suppliers/${input.supplierId}`)
    revalidatePath('/admin/dashboard')
    return { success: true, data: invoice }
  } catch (err: unknown) {
    console.error('Error in createInvoiceAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to record invoice') }
  }
}

export async function recordPaymentAction(input: RecordPaymentInput) {
  try {
    const payment = await recordSupplierPayment(input)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/suppliers/${input.supplierId}`)
    revalidatePath('/admin/dashboard')
    return { success: true, data: payment }
  } catch (err: unknown) {
    console.error('Error in recordPaymentAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to record payment') }
  }
}

export async function createReturnAction(input: CreateReturnInput) {
  try {
    const ret = await createSupplierReturn(input)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${input.purchaseId}`)
    return { success: true, data: ret }
  } catch (err: unknown) {
    console.error('Error in createReturnAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to create return request') }
  }
}

export async function completeReturnAction(returnId: string, purchaseId: string) {
  try {
    const result = await completeSupplierReturn(returnId)
    revalidatePath('/admin/purchases')
    revalidatePath(`/admin/purchases/${purchaseId}`)
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')
    revalidatePath('/admin/dashboard')
    return { success: true, data: result }
  } catch (err: unknown) {
    console.error('Error in completeReturnAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to complete supplier return') }
  }
}
