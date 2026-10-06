'use server'

import { revalidatePath } from 'next/cache'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  createCategory,
  type CreateProductInput,
  type UpdateProductInput,
  formatProductDatabaseError,
} from '@/lib/services/products'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createProductAction(
  input: CreateProductInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const product = await createProduct(input)
    revalidatePath('/admin/products')
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/dashboard')
    return { success: true, data: { id: product.id } }
  } catch (err: unknown) {
    console.error('Server action error in createProductAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function updateProductAction(
  id: string,
  input: UpdateProductInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const product = await updateProduct(id, input)
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}/edit`)
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/dashboard')
    return { success: true, data: { id: product.id } }
  } catch (err: unknown) {
    console.error('Server action error in updateProductAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function archiveProductAction(
  productId: string
): Promise<ActionResponse> {
  try {
    const success = await archiveProduct(productId)
    revalidatePath('/admin/products')
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/dashboard')
    return { success }
  } catch (err: unknown) {
    console.error('Server action error in archiveProductAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function restoreProductAction(
  productId: string
): Promise<ActionResponse> {
  try {
    const success = await restoreProduct(productId)
    revalidatePath('/admin/products')
    revalidatePath('/admin/inventory')
    revalidatePath('/admin/dashboard')
    return { success }
  } catch (err: unknown) {
    console.error('Server action error in restoreProductAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}

export async function createCategoryAction(
  name: string,
  description?: string
): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const cat = await createCategory(name, description)
    revalidatePath('/admin/products')
    revalidatePath('/admin/products/new')
    return { success: true, data: { id: cat.id, name: cat.name } }
  } catch (err: unknown) {
    console.error('Server action error in createCategoryAction:', err)
    return { success: false, error: formatProductDatabaseError(err) }
  }
}
