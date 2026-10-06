import { createClient } from '@/lib/supabase/server'
import type {
  Purchase,
  PurchaseItem,
  PurchaseStatus,
  Supplier,
  Product,
  GoodsReceivedNote,
  GoodsReceivedItem,
  SupplierInvoice,
  SupplierPayment,
  SupplierReturn,
  SupplierReturnItem,
  PaymentMethod,
  PaymentStatus,
} from '@/types/database.types'
import { logAuditEvent } from './audit'
import { requirePermission } from '@/lib/auth/permissions'

export interface PurchaseListParams {
  search?: string
  supplierId?: string
  status?: PurchaseStatus | 'all'
  invoiceStatus?: 'unbilled' | 'partially_billed' | 'billed' | 'all'
  paymentStatus?: PaymentStatus | 'all'
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface PurchaseWithSupplier extends Purchase {
  supplier: Pick<Supplier, 'id' | 'name' | 'supplier_code' | 'payment_terms' | 'phone'> | null
  items_count?: number
  total_ordered_qty?: number
  total_received_qty?: number
}

export interface PurchaseListResult {
  purchases: PurchaseWithSupplier[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PurchaseItemInput {
  productId: string
  quantity: number
  purchasePrice: number
  discountAmount?: number
  taxAmount?: number
  notes?: string | null
}

export interface CreatePurchaseInput {
  supplierId: string
  purchaseDate: string
  expectedDeliveryDate?: string | null
  invoiceNumber?: string | null // Vendor quotation or external reference
  additionalCharges?: number
  notes?: string | null
  items: PurchaseItemInput[]
}

export interface UpdatePurchaseInput {
  supplierId?: string
  purchaseDate?: string
  expectedDeliveryDate?: string | null
  invoiceNumber?: string | null
  additionalCharges?: number
  notes?: string | null
  items?: PurchaseItemInput[]
}

export interface PurchaseItemWithProduct extends PurchaseItem {
  product: Pick<Product, 'id' | 'name' | 'sku' | 'unit' | 'purchase_cost' | 'selling_price' | 'stock_quantity'> | null
}

export interface GoodsReceivedNoteWithItems extends GoodsReceivedNote {
  items: Array<
    GoodsReceivedItem & {
      product: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null
    }
  >
}

export interface SupplierReturnWithItems extends SupplierReturn {
  items: Array<
    SupplierReturnItem & {
      product: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null
    }
  >
}

export interface PurchaseDetailResult {
  purchase: Purchase
  supplier: Supplier
  items: PurchaseItemWithProduct[]
  goodsReceivedNotes: GoodsReceivedNoteWithItems[]
  invoices: SupplierInvoice[]
  payments: SupplierPayment[]
  returns: SupplierReturnWithItems[]
  summary: {
    totalOrderedQty: number
    totalReceivedQty: number
    remainingQty: number
    subtotal: number
    discountTotal: number
    taxTotal: number
    totalAmount: number
    invoicedTotal: number
    paidTotal: number
    outstandingTotal: number
  }
}

export interface ReceiveItemInput {
  purchaseItemId: string
  acceptedQuantity: number
  rejectedQuantity?: number
  unitCost?: number
  batchNumber?: string | null
  expiryDate?: string | null
  notes?: string | null
}

export interface ReceivePurchaseInput {
  purchaseId: string
  deliveryNoteNumber?: string | null
  notes?: string | null
  items: ReceiveItemInput[]
}

export interface CreateInvoiceInput {
  supplierId: string
  purchaseId?: string | null
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string | null
  subtotal: number
  discountAmount?: number
  taxAmount?: number
  totalAmount: number
  notes?: string | null
}

export interface RecordPaymentInput {
  supplierId: string
  invoiceId?: string | null
  amount: number
  paymentMethod: PaymentMethod
  paymentDate?: string
  reference?: string | null
  notes?: string | null
}

export interface CreateReturnItemInput {
  productId: string
  quantity: number
  unitCost: number
  reason?: string | null
}

export interface CreateReturnInput {
  supplierId: string
  purchaseId: string
  reason: string
  notes?: string | null
  items: CreateReturnItemInput[]
}

/**
 * List purchases with pagination, filters, and supplier details
 */
export async function getPurchases(params: PurchaseListParams = {}): Promise<PurchaseListResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))
  const offset = (page - 1) * limit

  let query = supabase
    .from('purchases')
    .select(
      `
      *,
      supplier:suppliers(id, name, supplier_code, payment_terms, phone),
      purchase_items(id, quantity, received_quantity)
    `,
      { count: 'exact' }
    )

  if (params.supplierId) {
    query = query.eq('supplier_id', params.supplierId)
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.invoiceStatus && params.invoiceStatus !== 'all') {
    query = query.eq('invoice_status', params.invoiceStatus)
  }

  if (params.paymentStatus && params.paymentStatus !== 'all') {
    query = query.eq('payment_status', params.paymentStatus)
  }

  if (params.dateFrom) {
    query = query.gte('purchase_date', params.dateFrom)
  }

  if (params.dateTo) {
    query = query.lte('purchase_date', params.dateTo)
  }

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`
    query = query.or(`purchase_number.ilike.${term},invoice_number.ilike.${term}`)
  }

  query = query.order('purchase_date', { ascending: false }).range(offset, offset + limit - 1)

  const { data: rawPurchases, error, count } = await query

  if (error) {
    console.error('Error fetching purchases:', error)
    throw new Error(`Failed to load purchases: ${error.message}`)
  }

  const purchases: PurchaseWithSupplier[] = (rawPurchases || []).map((row) => {
    const rawRow = row as unknown as Purchase & {
      supplier: Pick<Supplier, 'id' | 'name' | 'supplier_code' | 'payment_terms' | 'phone'> | null
      purchase_items?: Array<{ quantity: number; received_quantity: number }> | null
    }
    const itemsList = rawRow.purchase_items || []
    let totalOrdered = 0
    let totalReceived = 0
    for (const item of itemsList) {
      totalOrdered += Number(item.quantity) || 0
      totalReceived += Number(item.received_quantity) || 0
    }

    const rowCopy = { ...rawRow }
    delete rowCopy.purchase_items
    return {
      ...rowCopy,
      items_count: itemsList.length,
      total_ordered_qty: totalOrdered,
      total_received_qty: totalReceived,
    }
  })

  const total = count ?? 0

  return {
    purchases,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get complete purchase workspace details (items, GRNs, invoices, payments, returns)
 */
export async function getPurchaseById(id: string): Promise<PurchaseDetailResult | null> {
  const supabase = await createClient()

  // 1. Fetch purchase + supplier
  const { data: purchase, error: pError } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(*)')
    .eq('id', id)
    .single()

  if (pError || !purchase) {
    return null
  }

  const purchaseRow = purchase as unknown as Purchase & { supplier: Supplier }
  const supplier = purchaseRow.supplier

  // 2. Fetch items + product details
  const { data: rawItems } = await supabase
    .from('purchase_items')
    .select('*, product:products(id, name, sku, unit, purchase_cost, selling_price, stock_quantity)')
    .eq('purchase_id', id)

  const items: PurchaseItemWithProduct[] = (rawItems || []).map((it) => {
    const row = it as unknown as PurchaseItem & {
      product: Pick<Product, 'id' | 'name' | 'sku' | 'unit' | 'purchase_cost' | 'selling_price' | 'stock_quantity'> | null
    }
    return {
      ...row,
      product: row.product || null,
    }
  })

  // 3. Fetch GRNs + GRN items
  const { data: rawGrns } = await supabase
    .from('goods_received_notes')
    .select(`
      *,
      items:goods_received_items(
        *,
        product:products(id, name, sku, unit)
      )
    `)
    .eq('purchase_id', id)
    .order('received_at', { ascending: false })

  const goodsReceivedNotes: GoodsReceivedNoteWithItems[] = (rawGrns || []).map((g) => {
    const row = g as unknown as GoodsReceivedNote & {
      items: Array<GoodsReceivedItem & { product: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null }>
    }
    return {
      ...row,
      items: row.items || [],
    }
  })

  // 4. Fetch supplier invoices
  const { data: rawInvoices } = await supabase
    .from('supplier_invoices')
    .select('*')
    .eq('purchase_id', id)
    .order('invoice_date', { ascending: false })

  const invoices = (rawInvoices as SupplierInvoice[]) || []

  // 5. Fetch supplier payments linked to these invoices
  const invoiceIds = invoices.map((i) => i.id)
  let payments: SupplierPayment[] = []
  if (invoiceIds.length > 0) {
    const { data: rawPayments } = await supabase
      .from('supplier_payments')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('payment_date', { ascending: false })
    payments = (rawPayments as SupplierPayment[]) || []
  }

  // 6. Fetch returns linked to this purchase
  const { data: rawReturns } = await supabase
    .from('supplier_returns')
    .select(`
      *,
      items:supplier_return_items(
        *,
        product:products(id, name, sku, unit)
      )
    `)
    .eq('purchase_id', id)
    .order('created_at', { ascending: false })

  const returns: SupplierReturnWithItems[] = (rawReturns || []).map((r) => {
    const row = r as unknown as SupplierReturn & {
      items: Array<SupplierReturnItem & { product: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null }>
    }
    return {
      ...row,
      items: row.items || [],
    }
  })

  // Calculate authoritative summaries
  let totalOrderedQty = 0
  let totalReceivedQty = 0
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0

  for (const item of items) {
    totalOrderedQty += Number(item.quantity) || 0
    totalReceivedQty += Number(item.received_quantity) || 0
    subtotal += (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0)
    discountTotal += Number(item.discount_amount) || 0
    taxTotal += Number(item.tax_amount) || 0
  }

  let invoicedTotal = 0
  let paidTotal = 0
  for (const inv of invoices) {
    if (inv.status !== 'cancelled') {
      invoicedTotal += Number(inv.total_amount) || 0
      paidTotal += Number(inv.paid_amount) || 0
    }
  }

  const outstandingTotal = Math.max(0, invoicedTotal - paidTotal)

  return {
    purchase: purchase as Purchase,
    supplier,
    items,
    goodsReceivedNotes,
    invoices,
    payments,
    returns,
    summary: {
      totalOrderedQty: Math.round(totalOrderedQty * 1000) / 1000,
      totalReceivedQty: Math.round(totalReceivedQty * 1000) / 1000,
      remainingQty: Math.max(0, Math.round((totalOrderedQty - totalReceivedQty) * 1000) / 1000),
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalAmount: Number(purchase.total_amount) || 0,
      invoicedTotal: Math.round(invoicedTotal * 100) / 100,
      paidTotal: Math.round(paidTotal * 100) / 100,
      outstandingTotal: Math.round(outstandingTotal * 100) / 100,
    },
  }
}

/**
 * Create a new Purchase Order in DRAFT status with server-side recalculated totals
 */
export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  await requirePermission('purchases.create')
  const supabase = await createClient()

  if (!input.items || input.items.length === 0) {
    throw new Error('A purchase order must contain at least one product item')
  }

  // 1. Authoritative server-side financial calculation
  let subtotal = 0
  let supplierDiscount = 0
  let taxAmount = 0

  const processedItems = input.items.map((it) => {
    const qty = Math.max(0.001, Number(it.quantity) || 0)
    const price = Math.max(0, Number(it.purchasePrice) || 0)
    const disc = Math.max(0, Number(it.discountAmount) || 0)
    const tax = Math.max(0, Number(it.taxAmount) || 0)

    const gross = qty * price
    const lineTotal = Math.max(0, gross - disc + tax)
    const finalUnitCost = Math.round((lineTotal / qty) * 100) / 100

    subtotal += gross
    supplierDiscount += disc
    taxAmount += tax

    return {
      product_id: it.productId,
      quantity: qty,
      purchase_price: price,
      discount_amount: disc,
      tax_amount: tax,
      final_unit_cost: finalUnitCost,
      total_cost: Math.round(lineTotal * 100) / 100,
      notes: it.notes?.trim() || null,
    }
  })

  const additionalCharges = Math.max(0, Number(input.additionalCharges) || 0)
  const totalAmount = Math.max(0, Math.round((subtotal - supplierDiscount + taxAmount + additionalCharges) * 100) / 100)

  // 2. Generate safe PO number
  let poNumber: string | null = null
  const { data: codeData } = await supabase.rpc('generate_document_code', {
    p_prefix: 'PO',
    p_seq: 'public.seq_purchase_number',
  })

  if (codeData) {
    poNumber = codeData
  } else {
    poNumber = `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Insert Purchase header
  const purchasePayload = {
    purchase_number: poNumber,
    supplier_id: input.supplierId,
    invoice_number: input.invoiceNumber?.trim() || poNumber,
    purchase_date: input.purchaseDate,
    expected_delivery_date: input.expectedDeliveryDate || null,
    subtotal: Math.round(subtotal * 100) / 100,
    supplier_discount: Math.round(supplierDiscount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    additional_charges: additionalCharges,
    total_amount: totalAmount,
    status: 'draft' as PurchaseStatus,
    invoice_status: 'unbilled' as const,
    payment_status: 'pending' as PaymentStatus,
    notes: input.notes?.trim() || null,
    created_by: user?.id || null,
  }

  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchases')
    .insert(purchasePayload)
    .select()
    .single()

  if (purchaseError) {
    console.error('Error creating purchase header:', purchaseError)
    throw new Error(`Failed to create purchase order: ${purchaseError.message}`)
  }

  // 4. Insert Purchase items
  const itemsPayload = processedItems.map((item) => ({
    ...item,
    purchase_id: purchaseData.id,
    received_quantity: 0,
  }))

  const { error: itemsError } = await supabase.from('purchase_items').insert(itemsPayload)

  if (itemsError) {
    console.error('Error creating purchase items:', itemsError)
    // Clean up header if items fail
    await supabase.from('purchases').delete().eq('id', purchaseData.id)
    throw new Error(`Failed to create purchase items: ${itemsError.message}`)
  }

  await logAuditEvent({
    action: 'purchase.create',
    entityType: 'purchase',
    entityId: purchaseData.id,
    newValues: {
      purchase: purchasePayload,
      itemsCount: itemsPayload.length,
    },
  })

  return purchaseData as Purchase
}

/**
 * Update an existing draft Purchase Order
 */
export async function updatePurchase(id: string, input: UpdatePurchaseInput): Promise<Purchase> {
  await requirePermission('purchases.edit')
  const supabase = await createClient()

  // Lock and verify status is 'draft'
  const { data: existing, error: existErr } = await supabase
    .from('purchases')
    .select('status')
    .eq('id', id)
    .single()

  if (existErr || !existing) {
    throw new Error('Purchase order not found')
  }

  if (existing.status !== 'draft') {
    throw new Error(`Cannot modify purchase order in "${existing.status}" status (only draft can be modified)`)
  }

  // Recalculate totals if items are provided
  let updateHeader: import('@/types/database.types').Database['public']['Tables']['purchases']['Update'] = {
    updated_at: new Date().toISOString(),
  }

  if (input.supplierId) updateHeader.supplier_id = input.supplierId
  if (input.purchaseDate) updateHeader.purchase_date = input.purchaseDate
  if (input.expectedDeliveryDate !== undefined) updateHeader.expected_delivery_date = input.expectedDeliveryDate
  if (input.invoiceNumber !== undefined && input.invoiceNumber !== null) {
    updateHeader.invoice_number = input.invoiceNumber.trim()
  }
  if (input.notes !== undefined) updateHeader.notes = input.notes?.trim() || null

  if (input.items && input.items.length > 0) {
    let subtotal = 0
    let supplierDiscount = 0
    let taxAmount = 0

    const processedItems = input.items.map((it) => {
      const qty = Math.max(0.001, Number(it.quantity) || 0)
      const price = Math.max(0, Number(it.purchasePrice) || 0)
      const disc = Math.max(0, Number(it.discountAmount) || 0)
      const tax = Math.max(0, Number(it.taxAmount) || 0)

      const gross = qty * price
      const lineTotal = Math.max(0, gross - disc + tax)
      const finalUnitCost = Math.round((lineTotal / qty) * 100) / 100

      subtotal += gross
      supplierDiscount += disc
      taxAmount += tax

      return {
        purchase_id: id,
        product_id: it.productId,
        quantity: qty,
        received_quantity: 0,
        purchase_price: price,
        discount_amount: disc,
        tax_amount: tax,
        final_unit_cost: finalUnitCost,
        total_cost: Math.round(lineTotal * 100) / 100,
        notes: it.notes?.trim() || null,
      }
    })

    const additionalCharges = Math.max(0, Number(input.additionalCharges ?? 0))
    const totalAmount = Math.max(
      0,
      Math.round((subtotal - supplierDiscount + taxAmount + additionalCharges) * 100) / 100
    )

    updateHeader = {
      ...updateHeader,
      subtotal: Math.round(subtotal * 100) / 100,
      supplier_discount: Math.round(supplierDiscount * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      additional_charges: additionalCharges,
      total_amount: totalAmount,
    }

    // Replace items
    await supabase.from('purchase_items').delete().eq('purchase_id', id)
    const { error: insErr } = await supabase.from('purchase_items').insert(processedItems)
    if (insErr) {
      throw new Error(`Failed to update purchase items: ${insErr.message}`)
    }
  }

  const { data: updated, error: updErr } = await supabase
    .from('purchases')
    .update(updateHeader)
    .eq('id', id)
    .select()
    .single()

  if (updErr) {
    throw new Error(`Failed to update purchase: ${updErr.message}`)
  }

  await logAuditEvent({
    action: 'purchase.update',
    entityType: 'purchase',
    entityId: id,
    newValues: updateHeader as unknown as import('@/types/database.types').Json,
  })

  return updated as Purchase
}

/**
 * Order Purchase: transitions status DRAFT -> ORDERED
 * Does NOT increase inventory stock!
 */
export async function orderPurchase(id: string): Promise<Purchase> {
  await requirePermission('purchases.order')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: existing, error: existErr } = await supabase
    .from('purchases')
    .select('status, purchase_number')
    .eq('id', id)
    .single()

  if (existErr || !existing) {
    throw new Error('Purchase order not found')
  }

  if (existing.status !== 'draft') {
    throw new Error(`Cannot place order: current status is "${existing.status}" (must be draft)`)
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('purchases')
    .update({
      status: 'ordered',
      ordered_at: now,
      ordered_by: user?.id || null,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to order purchase: ${error.message}`)
  }

  await logAuditEvent({
    action: 'purchase.order',
    entityType: 'purchase',
    entityId: id,
    newValues: { status: 'ordered', ordered_at: now, ordered_by: user?.id },
  })

  return data as Purchase
}

/**
 * Cancel a Purchase Order (allowed if DRAFT or ORDERED)
 */
export async function cancelPurchase(id: string, reason?: string): Promise<Purchase> {
  await requirePermission('purchases.cancel')
  const supabase = await createClient()

  const { data: existing } = await supabase.from('purchases').select('status').eq('id', id).single()

  if (!existing) {
    throw new Error('Purchase order not found')
  }

  if (existing.status !== 'draft' && existing.status !== 'ordered') {
    throw new Error(`Cannot cancel purchase with status "${existing.status}"`)
  }

  const { data, error } = await supabase
    .from('purchases')
    .update({
      status: 'cancelled',
      notes: reason ? `[Cancelled: ${reason}]` : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to cancel purchase: ${error.message}`)
  }

  await logAuditEvent({
    action: 'purchase.cancel',
    entityType: 'purchase',
    entityId: id,
    newValues: { status: 'cancelled', reason },
  })

  return data as Purchase
}

/**
 * ATOMIC RECEIVING / GRN:
 * Executes receive_purchase_order_atomic in PostgreSQL
 * Increases inventory stock, writes immutable movement ledger, creates GRN, logs audit
 */
export async function receivePurchaseOrder(input: ReceivePurchaseInput): Promise<{
  success: boolean
  grnId: string
  grnNumber: string
  itemsProcessed: number
  newPurchaseStatus: string
}> {
  await requirePermission('purchases.receive')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    throw new Error('Authenticated user required for purchase receiving')
  }

  const rpcItems = input.items.map((it) => ({
    purchaseItemId: it.purchaseItemId,
    acceptedQuantity: it.acceptedQuantity,
    rejectedQuantity: it.rejectedQuantity || 0,
    unitCost: it.unitCost,
    batchNumber: it.batchNumber || null,
    expiryDate: it.expiryDate || null,
    notes: it.notes || null,
  }))

  const { data, error } = await supabase.rpc('receive_purchase_order_atomic', {
    p_purchase_id: input.purchaseId,
    p_items: rpcItems as unknown as import('@/types/database.types').Json,
    p_delivery_note: input.deliveryNoteNumber || null,
    p_notes: input.notes || null,
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error executing receive_purchase_order_atomic RPC:', error)
    throw new Error(error.message)
  }

  const result = data as unknown as {
    success: boolean
    error?: string
    grn_id: string
    grn_number: string
    items_processed: number
    new_purchase_status: string
  }
  if (!result || !result.success) {
    throw new Error(result?.error || 'Failed to complete receiving transaction')
  }

  return {
    success: true,
    grnId: result.grn_id,
    grnNumber: result.grn_number,
    itemsProcessed: result.items_processed,
    newPurchaseStatus: result.new_purchase_status,
  }
}

/**
 * Create Supplier Invoice
 */
export async function createSupplierInvoice(input: CreateInvoiceInput): Promise<SupplierInvoice> {
  await requirePermission('supplier_invoices.create')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Calculate due date if not provided using supplier payment terms
  let dueDate = input.dueDate
  if (!dueDate) {
    const { data: sup } = await supabase
      .from('suppliers')
      .select('payment_terms')
      .eq('id', input.supplierId)
      .single()

    const termsStr = sup?.payment_terms || '30 days'
    const daysMatch = termsStr.match(/\d+/)
    const days = daysMatch ? parseInt(daysMatch[0], 10) : 30

    const d = new Date(input.invoiceDate)
    d.setDate(d.getDate() + days)
    dueDate = d.toISOString().split('T')[0]
  }

  const total = Math.max(0, Number(input.totalAmount) || 0)

  const payload = {
    supplier_id: input.supplierId,
    purchase_id: input.purchaseId || null,
    invoice_number: input.invoiceNumber.trim(),
    invoice_date: input.invoiceDate,
    due_date: dueDate,
    subtotal: Math.max(0, Number(input.subtotal) || 0),
    discount_amount: Math.max(0, Number(input.discountAmount) || 0),
    tax_amount: Math.max(0, Number(input.taxAmount) || 0),
    total_amount: total,
    paid_amount: 0,
    outstanding_amount: total,
    status: 'unpaid' as const,
    notes: input.notes?.trim() || null,
    created_by: user?.id || null,
  }

  const { data, error } = await supabase.from('supplier_invoices').insert(payload).select().single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Invoice number "${input.invoiceNumber}" already exists for this supplier`)
    }
    throw new Error(`Failed to create supplier invoice: ${error.message}`)
  }

  // Update purchase invoice_status to 'billed' if associated
  if (input.purchaseId) {
    await supabase
      .from('purchases')
      .update({ invoice_status: 'billed', updated_at: new Date().toISOString() })
      .eq('id', input.purchaseId)
  }

  await logAuditEvent({
    action: 'supplier_invoice.create',
    entityType: 'supplier_invoice',
    entityId: data.id,
    newValues: payload,
  })

  return data as SupplierInvoice
}

/**
 * Record Supplier Payment atomically
 */
export async function recordSupplierPayment(input: RecordPaymentInput): Promise<{
  success: boolean
  paymentId: string
  paymentNumber: string
  newOutstanding: number
  newInvoiceStatus: string
}> {
  await requirePermission('supplier_payments.create')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    throw new Error('Authenticated user required for recording payment')
  }

  const { data, error } = await supabase.rpc('record_supplier_payment_atomic', {
    p_supplier_id: input.supplierId,
    p_invoice_id: input.invoiceId || null,
    p_amount: input.amount,
    p_payment_method: input.paymentMethod,
    p_payment_date: input.paymentDate || new Date().toISOString().split('T')[0],
    p_reference: input.reference || null,
    p_notes: input.notes || null,
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error executing record_supplier_payment_atomic RPC:', error)
    throw new Error(error.message)
  }

  const result = data as unknown as {
    success: boolean
    error?: string
    payment_id: string
    payment_number: string
    new_outstanding: number
    new_invoice_status: string
  }
  if (!result || !result.success) {
    throw new Error(result?.error || 'Failed to record supplier payment')
  }

  return {
    success: true,
    paymentId: result.payment_id,
    paymentNumber: result.payment_number,
    newOutstanding: result.new_outstanding,
    newInvoiceStatus: result.new_invoice_status,
  }
}

/**
 * Create a Supplier Return request
 */
export async function createSupplierReturn(input: CreateReturnInput): Promise<SupplierReturn> {
  await requirePermission('purchases.return')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let returnCode: string | null = null
  const { data: codeData } = await supabase.rpc('generate_document_code', {
    p_prefix: 'PRET',
    p_seq: 'public.seq_supplier_return',
  })

  returnCode = codeData || `PRET-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

  let totalAmount = 0
  const processedItems = input.items.map((it) => {
    const qty = Math.max(0.001, Number(it.quantity) || 0)
    const cost = Math.max(0, Number(it.unitCost) || 0)
    const lineTotal = Math.round(qty * cost * 100) / 100
    totalAmount += lineTotal
    return {
      product_id: it.productId,
      quantity: qty,
      unit_cost: cost,
      total_cost: lineTotal,
      reason: it.reason?.trim() || null,
    }
  })

  const returnPayload = {
    return_number: returnCode,
    supplier_id: input.supplierId,
    purchase_id: input.purchaseId,
    status: 'draft' as const,
    total_amount: Math.round(totalAmount * 100) / 100,
    reason: input.reason.trim(),
    notes: input.notes?.trim() || null,
    requested_by: user?.id || null,
  }

  const { data: retData, error: retErr } = await supabase
    .from('supplier_returns')
    .insert(returnPayload)
    .select()
    .single()

  if (retErr) {
    throw new Error(`Failed to create return request: ${retErr.message}`)
  }

  const itemsPayload = processedItems.map((it) => ({
    ...it,
    return_id: retData.id,
  }))

  const { error: itemErr } = await supabase.from('supplier_return_items').insert(itemsPayload)

  if (itemErr) {
    await supabase.from('supplier_returns').delete().eq('id', retData.id)
    throw new Error(`Failed to insert return items: ${itemErr.message}`)
  }

  await logAuditEvent({
    action: 'supplier_return.create',
    entityType: 'supplier_return',
    entityId: retData.id,
    newValues: { return: returnPayload, itemsCount: itemsPayload.length },
  })

  return retData as SupplierReturn
}

/**
 * Atomically Complete Supplier Return:
 * Executes complete_supplier_return_atomic in PostgreSQL
 * Decreases inventory stock, creates PURCHASE_RETURN ledger movement, creates credit note
 */
export async function completeSupplierReturn(returnId: string): Promise<{
  success: boolean
  returnNumber: string
  itemsProcessed: number
  totalCreditAmount: number
}> {
  await requirePermission('purchases.return')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    throw new Error('Authenticated user required for completing return')
  }

  const { data, error } = await supabase.rpc('complete_supplier_return_atomic', {
    p_return_id: returnId,
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error executing complete_supplier_return_atomic RPC:', error)
    throw new Error(error.message)
  }

  const result = data as unknown as {
    success: boolean
    error?: string
    return_number: string
    items_processed: number
    total_credit_amount: number
  } | null
  if (!result || !result.success) {
    throw new Error(result?.error || 'Failed to complete supplier return')
  }

  return {
    success: true,
    returnNumber: result.return_number,
    itemsProcessed: result.items_processed,
    totalCreditAmount: result.total_credit_amount,
  }
}
