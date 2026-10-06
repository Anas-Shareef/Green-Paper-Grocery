'use server'

import { revalidatePath } from 'next/cache'
import {
  createSupplier,
  updateSupplier,
  archiveSupplier,
  restoreSupplier,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from '@/lib/services/suppliers'

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

export async function createSupplierAction(input: CreateSupplierInput) {
  try {
    const supplier = await createSupplier(input)
    revalidatePath('/admin/suppliers')
    return { success: true, data: supplier }
  } catch (err: unknown) {
    console.error('Error in createSupplierAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to create supplier') }
  }
}

export async function updateSupplierAction(id: string, input: UpdateSupplierInput) {
  try {
    const supplier = await updateSupplier(id, input)
    revalidatePath('/admin/suppliers')
    revalidatePath(`/admin/suppliers/${id}`)
    return { success: true, data: supplier }
  } catch (err: unknown) {
    console.error('Error in updateSupplierAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to update supplier') }
  }
}

export async function archiveSupplierAction(id: string) {
  try {
    await archiveSupplier(id)
    revalidatePath('/admin/suppliers')
    revalidatePath(`/admin/suppliers/${id}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('Error in archiveSupplierAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to archive supplier') }
  }
}

export async function restoreSupplierAction(id: string) {
  try {
    await restoreSupplier(id)
    revalidatePath('/admin/suppliers')
    revalidatePath(`/admin/suppliers/${id}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('Error in restoreSupplierAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to restore supplier') }
  }
}

export async function recordSupplierPaymentAction(input: import('@/lib/services/purchases').RecordPaymentInput) {
  try {
    const { recordSupplierPayment } = await import('@/lib/services/purchases')
    const result = await recordSupplierPayment(input)
    revalidatePath('/admin/suppliers')
    revalidatePath(`/admin/suppliers/${input.supplierId}`)
    revalidatePath('/admin/purchases')
    return { success: true, data: result }
  } catch (err: unknown) {
    console.error('Error in recordSupplierPaymentAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to record supplier payment') }
  }
}

export async function createSupplierInvoiceAction(input: import('@/lib/services/purchases').CreateInvoiceInput) {
  try {
    const { createSupplierInvoice } = await import('@/lib/services/purchases')
    const invoice = await createSupplierInvoice(input)
    revalidatePath('/admin/suppliers')
    revalidatePath(`/admin/suppliers/${input.supplierId}`)
    if (input.purchaseId) {
      revalidatePath(`/admin/purchases/${input.purchaseId}`)
    }
    revalidatePath('/admin/purchases')
    return { success: true, data: invoice }
  } catch (err: unknown) {
    console.error('Error in createSupplierInvoiceAction:', err)
    return { success: false, error: getErrorMessage(err, 'Failed to create supplier invoice') }
  }
}
