'use server'

import { revalidatePath } from 'next/cache'
import { createAdminCustomer, updateAdminCustomer } from '@/lib/services/customers'

export async function createCustomerAction(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const mobile = formData.get('mobile') as string
    const email = (formData.get('email') as string) || undefined
    const address = (formData.get('address') as string) || undefined
    const villa_or_building = (formData.get('villa_or_building') as string) || undefined
    const area = (formData.get('area') as string) || undefined
    const zone = (formData.get('zone') as string) || 'Zone 19'
    const notes = (formData.get('notes') as string) || undefined

    if (!name || !mobile) {
      return { success: false, error: 'Customer name and mobile number are required.' }
    }

    const customer = await createAdminCustomer({
      name,
      mobile,
      email,
      address,
      villa_or_building,
      area,
      zone,
      notes,
    })

    revalidatePath('/admin/customers')
    return { success: true, customerId: customer.id }
  } catch (err: any) {
    console.error('Error creating customer:', err)
    return { success: false, error: err.message || 'Failed to create customer.' }
  }
}

export async function updateCustomerAction(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string
    const mobile = formData.get('mobile') as string
    const email = (formData.get('email') as string) || undefined
    const address = (formData.get('address') as string) || undefined
    const villa_or_building = (formData.get('villa_or_building') as string) || undefined
    const area = (formData.get('area') as string) || undefined
    const zone = (formData.get('zone') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined

    await updateAdminCustomer(id, {
      name,
      mobile,
      email,
      address,
      villa_or_building,
      area,
      zone,
      notes,
    })

    revalidatePath('/admin/customers')
    return { success: true }
  } catch (err: any) {
    console.error('Error updating customer:', err)
    return { success: false, error: err.message || 'Failed to update customer.' }
  }
}
