'use server'

import { placeStorefrontOrder } from '@/lib/services/customerStore'
import type { PaymentMethod } from '@/types/database.types'

export interface CheckoutResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  error?: string
}

export async function processCustomerCheckout(params: {
  items: Array<{ product_id: string; quantity: number }>
  deliveryAddress: string
  deliveryNotes?: string
  paymentMethod: PaymentMethod
  guestName?: string
  guestPhone?: string
  guestEmail?: string
}): Promise<CheckoutResult> {
  if (!params.items || params.items.length === 0) {
    return { success: false, error: 'Your cart is empty. Please add items before placing an order.' }
  }

  if (!params.deliveryAddress || params.deliveryAddress.trim().length === 0) {
    return { success: false, error: 'Please provide a valid delivery address in Zone 19.' }
  }

  try {
    const result = await placeStorefrontOrder({
      items: params.items,
      deliveryAddress: params.deliveryAddress,
      deliveryNotes: params.deliveryNotes,
      paymentMethod: params.paymentMethod,
      guestName: params.guestName,
      guestPhone: params.guestPhone,
      guestEmail: params.guestEmail,
    })

    return {
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'An error occurred during checkout. Please try again.'
    return {
      success: false,
      error: errorMessage,
    }
  }
}
