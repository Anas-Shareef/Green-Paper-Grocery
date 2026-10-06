import { createClient } from '@/lib/supabase/server'
import type { Customer, CustomerAddress, Order, OrderItem, PaymentMethod } from '@/types/database.types'

export interface OrderWithItems extends Order {
  items: OrderItem[]
  customer?: Pick<Customer, 'id' | 'name' | 'mobile'> | null
}

/**
 * Retrieves the customer record linked to the authenticated user.
 * If user exists but customer row does not exist yet, creates one automatically.
 */
export async function getOrCreateCurrentCustomer(): Promise<Customer | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 1. Look up existing customer by auth_user_id
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (customer) {
    return customer as Customer
  }

  // 2. Also look up by email match to link previously offline registered customers
  if (user.email) {
    const { data: matchByEmail } = await supabase
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()

    if (matchByEmail) {
      const { data: updated } = await supabase
        .from('customers')
        .update({ auth_user_id: user.id })
        .eq('id', matchByEmail.id)
        .select()
        .single()
      return (updated as Customer) || (matchByEmail as Customer)
    }
  }

  // 3. Auto-provision customer record for authenticated customer
  const fullName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'Customer'

  const phone = (user.user_metadata?.phone as string) || '0500000000'

  const { data: newCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      auth_user_id: user.id,
      name: fullName,
      email: user.email || null,
      mobile: phone,
      address: 'Zone 19, Abu Dhabi',
      zone: 'Zone 19',
      customer_segment: 'new',
      is_active: true,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error auto-creating customer record:', insertError)
    return null
  }

  return newCustomer as Customer
}

/**
 * Updates customer profile details.
 */
export async function updateCustomerProfile(data: {
  name: string
  mobile: string
  whatsapp?: string
  address?: string
  villa_or_building?: string
  area?: string
}): Promise<Customer> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    throw new Error('Customer authentication required to update profile')
  }

  const { data: updated, error } = await supabase
    .from('customers')
    .update({
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      whatsapp: data.whatsapp?.trim() || null,
      address: data.address?.trim() || customer.address,
      villa_or_building: data.villa_or_building?.trim() || null,
      area: data.area?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customer.id)
    .select()
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to update profile')
  }

  return updated as Customer
}

/**
 * Retrieves all saved addresses for the current customer.
 */
export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    return []
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customer.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customer addresses:', error)
    return []
  }

  return (data as CustomerAddress[]) || []
}

/**
 * Adds a new address for the current customer.
 */
export async function addCustomerAddress(params: {
  label: string
  recipient_name: string
  phone: string
  building_or_villa: string
  street: string
  area: string
  city?: string
  emirate?: string
  zone?: string
  delivery_instructions?: string
  is_default?: boolean
}): Promise<CustomerAddress> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    throw new Error('Authentication required to save delivery address')
  }

  // If this address is set as default, unset other defaults
  if (params.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customer.id)
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      customer_id: customer.id,
      label: params.label.trim() || 'Home',
      recipient_name: params.recipient_name.trim(),
      phone: params.phone.trim(),
      building_or_villa: params.building_or_villa.trim(),
      street: params.street.trim(),
      area: params.area.trim(),
      city: params.city?.trim() || 'Abu Dhabi',
      emirate: params.emirate?.trim() || 'Abu Dhabi',
      zone: params.zone?.trim() || 'Zone 19',
      delivery_instructions: params.delivery_instructions?.trim() || null,
      is_default: !!params.is_default,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save address')
  }

  return data as CustomerAddress
}

/**
 * Updates an existing address.
 */
export async function updateCustomerAddress(
  addressId: string,
  params: Partial<CustomerAddress>
): Promise<CustomerAddress> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    throw new Error('Authentication required')
  }

  if (params.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customer.id)
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq('id', addressId)
    .eq('customer_id', customer.id)
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update address')
  }

  return data as CustomerAddress
}

/**
 * Deletes an address.
 */
export async function deleteCustomerAddress(addressId: string): Promise<boolean> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    throw new Error('Authentication required')
  }

  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', addressId)
    .eq('customer_id', customer.id)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

/**
 * Sets an address as default.
 */
export async function setDefaultCustomerAddress(addressId: string): Promise<boolean> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    throw new Error('Authentication required')
  }

  // Unset all
  await supabase
    .from('customer_addresses')
    .update({ is_default: false })
    .eq('customer_id', customer.id)

  // Set selected
  const { error } = await supabase
    .from('customer_addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('customer_id', customer.id)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

/**
 * Places an order atomically via PostgreSQL `create_customer_order_atomic`.
 * Revalidates stock, calculates server-authoritative pricing and 5% UAE VAT,
 * and appends to the immutable inventory ledger.
 */
export async function placeStorefrontOrder(params: {
  items: Array<{ product_id: string; quantity: number }>
  deliveryAddress: string
  deliveryNotes?: string
  paymentMethod?: PaymentMethod
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  couponCode?: string
  loyaltyPointsToRedeem?: number
}): Promise<{
  success: boolean
  orderId: string
  orderNumber: string
  subtotal: number
  discountAmount: number
  promotionDiscount: number
  couponDiscount: number
  loyaltyDiscount: number
  taxAmount: number
  deliveryFee: number
  totalAmount: number
}> {
  const supabase = await createClient()
  let customer = await getOrCreateCurrentCustomer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If unauthenticated guest checkout, create or find customer record by phone/email
  if (!customer && params.guestPhone) {
    const { data: existingGuest } = await supabase
      .from('customers')
      .select('*')
      .eq('mobile', params.guestPhone.trim())
      .maybeSingle()

    if (existingGuest) {
      customer = existingGuest as Customer
    } else {
      const { data: newGuest } = await supabase
        .from('customers')
        .insert({
          name: params.guestName?.trim() || 'Guest Customer',
          mobile: params.guestPhone.trim(),
          email: params.guestEmail?.trim() || null,
          address: params.deliveryAddress.trim(),
          zone: 'Zone 19',
          customer_segment: 'new',
          is_active: true,
        })
        .select()
        .single()

      if (newGuest) {
        customer = newGuest as Customer
      }
    }
  }

  // Call Atomic Database RPC with Phase 8 commercial parameters
  const { data, error } = await supabase.rpc('create_customer_order_atomic', {
    p_customer_id: customer?.id || null,
    p_items: params.items,
    p_delivery_address: params.deliveryAddress,
    p_delivery_notes: params.deliveryNotes || null,
    p_payment_method: params.paymentMethod || 'cash',
    p_order_source: 'website',
    p_user_id: user?.id || null,
    p_coupon_code: params.couponCode?.trim() || null,
    p_loyalty_points_to_redeem: params.loyaltyPointsToRedeem || 0,
  })

  if (error) {
    console.error('Error in create_customer_order_atomic RPC:', error)
    throw new Error(error.message)
  }

  const result = data as unknown as {
    success: boolean
    order_id: string
    order_number: string
    items_count: number
    subtotal: number
    discount_amount: number
    product_promo_discount: number
    cart_promo_discount: number
    coupon_discount: number
    loyalty_discount: number
    tax_amount: number
    delivery_fee: number
    total_amount: number
    error?: string
  } | null

  if (!result || !result.success) {
    throw new Error(result?.error || 'Failed to place order')
  }

  return {
    success: true,
    orderId: result.order_id,
    orderNumber: result.order_number,
    subtotal: result.subtotal,
    discountAmount: result.discount_amount || 0,
    promotionDiscount: (result.product_promo_discount || 0) + (result.cart_promo_discount || 0),
    couponDiscount: result.coupon_discount || 0,
    loyaltyDiscount: result.loyalty_discount || 0,
    taxAmount: result.tax_amount,
    deliveryFee: result.delivery_fee,
    totalAmount: result.total_amount,
  }
}

/**
 * Fetches order history for current authenticated customer.
 */
export async function getCustomerOrders(): Promise<OrderWithItems[]> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    return []
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('customer_id', customer.id)
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }

  return (orders as unknown as OrderWithItems[]) || []
}

/**
 * Fetches single order details by ID for current customer.
 */
export async function getCustomerOrderById(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient()
  const customer = await getOrCreateCurrentCustomer()

  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*),
      customer:customers(id, name, mobile)
    `)
    .eq('id', orderId)

  // Enforce customer isolation if not staff
  if (customer) {
    query = query.eq('customer_id', customer.id)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  return data as unknown as OrderWithItems
}

/**
 * Customer cancel order action (atomic stock return).
 */
export async function cancelCustomerOrder(orderId: string, reason?: string): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('cancel_customer_order_atomic', {
    p_order_id: orderId,
    p_reason: reason || 'Cancelled by customer',
    p_user_id: user?.id || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const result = data as unknown as { success: boolean; error?: string } | null
  if (!result || !result.success) {
    throw new Error(result?.error || 'Failed to cancel order')
  }

  return true
}

/**
 * Server-authoritative preview calculation for Cart & Checkout.
 * Evaluates real-time product base prices, promotional discounts, coupon validation,
 * loyalty point redemption, tax, and delivery fee.
 */
export async function calculateOrderPricingPreview(params: {
  items: Array<{ product_id: string; quantity: number }>
  couponCode?: string
  loyaltyPointsToRedeem?: number
}): Promise<{
  subtotal: number
  promotionDiscount: number
  couponDiscount: number
  loyaltyDiscount: number
  totalDiscount: number
  taxAmount: number
  deliveryFee: number
  grandTotal: number
  couponResult?: {
    valid: boolean
    message: string
    code: string
  }
  loyaltyResult?: {
    pointsRedeemed: number
    discountAmount: number
    balanceAfter: number
  }
}> {
  if (!params.items || params.items.length === 0) {
    return {
      subtotal: 0,
      promotionDiscount: 0,
      couponDiscount: 0,
      loyaltyDiscount: 0,
      totalDiscount: 0,
      taxAmount: 0,
      deliveryFee: 10,
      grandTotal: 10,
    }
  }

  const supabase = await createClient()
  const productIds = params.items.map((i) => i.product_id)

  const { data: products } = await supabase
    .from('products')
    .select('id, name, selling_price, promo_price, category_id, is_active, stock_quantity')
    .in('id', productIds)

  const prodMap = new Map((products || []).map((p) => [p.id, p]))

  let subtotal = 0
  let productPromoDiscount = 0

  params.items.forEach((item) => {
    const prod = prodMap.get(item.product_id)
    if (!prod) return

    const basePrice = Number(prod.selling_price)
    let unitPrice = basePrice

    if (prod.promo_price !== null && prod.promo_price > 0 && prod.promo_price < basePrice) {
      unitPrice = Number(prod.promo_price)
    }

    const lineBase = basePrice * item.quantity
    const lineEffective = unitPrice * item.quantity
    subtotal += lineBase
    productPromoDiscount += (lineBase - lineEffective)
  })

  let qualifyingSubtotal = Math.max(0, subtotal - productPromoDiscount)
  let couponDiscount = 0
  let couponResult: { valid: boolean; message: string; code: string } | undefined

  // Validate coupon preview if provided
  if (params.couponCode?.trim()) {
    const { validateCouponPreview } = await import('./coupons')
    const customer = await getOrCreateCurrentCustomer()
    const cRes = await validateCouponPreview(
      params.couponCode.trim(),
      qualifyingSubtotal,
      customer?.id
    )

    couponResult = {
      valid: cRes.valid,
      message: cRes.message,
      code: cRes.code,
    }

    if (cRes.valid) {
      couponDiscount = Math.min(qualifyingSubtotal, cRes.discountAmount)
      qualifyingSubtotal = Math.max(0, qualifyingSubtotal - couponDiscount)
    }
  }

  // Validate loyalty redemption preview if requested
  let loyaltyDiscount = 0
  let loyaltyResult:
    | { pointsRedeemed: number; discountAmount: number; balanceAfter: number }
    | undefined

  if (params.loyaltyPointsToRedeem && params.loyaltyPointsToRedeem > 0) {
    const { getCurrentCustomerLoyaltyAccount } = await import('./loyalty')
    const { account } = await getCurrentCustomerLoyaltyAccount()
    const balance = account?.points_balance || 0
    const pointsToUse = Math.min(params.loyaltyPointsToRedeem, balance)

    if (pointsToUse >= 100) {
      const pointValue = pointsToUse * 0.05 // 100 points = 5 AED
      loyaltyDiscount = Math.min(qualifyingSubtotal, pointValue)
      qualifyingSubtotal = Math.max(0, qualifyingSubtotal - loyaltyDiscount)

      loyaltyResult = {
        pointsRedeemed: pointsToUse,
        discountAmount: Number(loyaltyDiscount.toFixed(2)),
        balanceAfter: balance - pointsToUse,
      }
    }
  }

  const totalDiscount = Number((productPromoDiscount + couponDiscount + loyaltyDiscount).toFixed(2))
  const taxRate = 0.05
  const taxAmount = Number((qualifyingSubtotal * taxRate).toFixed(2))
  const deliveryFee = (subtotal - productPromoDiscount) >= 100 ? 0 : 10
  const grandTotal = Number((qualifyingSubtotal + taxAmount + deliveryFee).toFixed(2))

  return {
    subtotal: Number(subtotal.toFixed(2)),
    promotionDiscount: Number(productPromoDiscount.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    loyaltyDiscount: Number(loyaltyDiscount.toFixed(2)),
    totalDiscount,
    taxAmount,
    deliveryFee,
    grandTotal,
    couponResult,
    loyaltyResult,
  }
}

