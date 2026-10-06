import { createClient } from '@/lib/supabase/server'
import type { Supplier, Purchase, SupplierInvoice, SupplierPayment, SupplierReturn } from '@/types/database.types'
import { logAuditEvent } from './audit'
import { requirePermission } from '@/lib/auth/permissions'

export interface SupplierListParams {
  search?: string
  status?: 'all' | 'active' | 'archived'
  paymentTerms?: string
  page?: number
  limit?: number
}

export interface SupplierFinancialSummary {
  totalPurchases: number
  totalPurchasesCount: number
  totalInvoiced: number
  totalPaid: number
  totalReturned: number
  outstandingBalance: number
  currentPayable: number
  lastPurchaseDate: string | null
}

export interface SupplierWithMetrics extends Supplier {
  financialSummary: SupplierFinancialSummary
}

export interface SupplierListResult {
  suppliers: SupplierWithMetrics[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateSupplierInput {
  name: string
  contact_person?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  tax_identifier?: string | null
  payment_terms?: string
  credit_limit?: number
  notes?: string | null
}

export interface UpdateSupplierInput {
  name?: string
  contact_person?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  tax_identifier?: string | null
  payment_terms?: string
  credit_limit?: number
  notes?: string | null
  is_active?: boolean
}

export interface SupplierDetailResult {
  supplier: Supplier
  financialSummary: SupplierFinancialSummary
  purchases: Purchase[]
  invoices: SupplierInvoice[]
  payments: SupplierPayment[]
  returns: SupplierReturn[]
}

/**
 * Fetch suppliers with search, filter, and real-time financial aggregations
 */
export async function getSuppliers(params: SupplierListParams = {}): Promise<SupplierListResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))
  const offset = (page - 1) * limit

  let query = supabase.from('suppliers').select('*', { count: 'exact' })

  // Status filter
  if (params.status === 'active' || !params.status) {
    query = query.eq('is_active', true)
  } else if (params.status === 'archived') {
    query = query.eq('is_active', false)
  }

  // Payment terms filter
  if (params.paymentTerms && params.paymentTerms !== 'all') {
    query = query.eq('payment_terms', params.paymentTerms)
  }

  // Search filter
  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`
    query = query.or(
      `name.ilike.${term},supplier_code.ilike.${term},contact_person.ilike.${term},phone.ilike.${term}`
    )
  }

  query = query.order('name', { ascending: true }).range(offset, offset + limit - 1)

  const { data: rawSuppliers, error, count } = await query

  if (error) {
    console.error('Error fetching suppliers:', error)
    throw new Error(`Failed to load suppliers: ${error.message}`)
  }

  const suppliersList = (rawSuppliers as Supplier[]) || []
  const total = count ?? 0

  if (suppliersList.length === 0) {
    return {
      suppliers: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // Aggregate financial metrics for the current page of suppliers
  const supplierIds = suppliersList.map((s) => s.id)

  const [purchasesRes, invoicesRes, paymentsRes, returnsRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('supplier_id, total_amount, purchase_date, status')
      .in('supplier_id', supplierIds),
    supabase
      .from('supplier_invoices')
      .select('supplier_id, total_amount, paid_amount, outstanding_amount, status')
      .in('supplier_id', supplierIds),
    supabase
      .from('supplier_payments')
      .select('supplier_id, amount')
      .in('supplier_id', supplierIds),
    supabase
      .from('supplier_returns')
      .select('supplier_id, total_amount, status')
      .in('supplier_id', supplierIds)
      .eq('status', 'completed'),
  ])

  // Build lookup maps
  const purchaseMap = new Map<string, { total: number; count: number; lastDate: string | null }>()
  for (const p of purchasesRes.data || []) {
    if (p.status === 'cancelled') continue
    const curr = purchaseMap.get(p.supplier_id) || { total: 0, count: 0, lastDate: null }
    curr.total += Number(p.total_amount) || 0
    curr.count += 1
    if (!curr.lastDate || p.purchase_date > curr.lastDate) {
      curr.lastDate = p.purchase_date
    }
    purchaseMap.set(p.supplier_id, curr)
  }

  const invoiceMap = new Map<string, { total: number; paid: number; outstanding: number }>()
  for (const inv of invoicesRes.data || []) {
    if (inv.status === 'cancelled') continue
    const curr = invoiceMap.get(inv.supplier_id) || { total: 0, paid: 0, outstanding: 0 }
    curr.total += Number(inv.total_amount) || 0
    curr.paid += Number(inv.paid_amount) || 0
    curr.outstanding += Number(inv.outstanding_amount) || 0
    invoiceMap.set(inv.supplier_id, curr)
  }

  const paymentMap = new Map<string, number>()
  for (const pmt of paymentsRes.data || []) {
    paymentMap.set(pmt.supplier_id, (paymentMap.get(pmt.supplier_id) || 0) + (Number(pmt.amount) || 0))
  }

  const returnMap = new Map<string, number>()
  for (const ret of returnsRes.data || []) {
    returnMap.set(ret.supplier_id, (returnMap.get(ret.supplier_id) || 0) + (Number(ret.total_amount) || 0))
  }

  const suppliers: SupplierWithMetrics[] = suppliersList.map((sup) => {
    const pData = purchaseMap.get(sup.id) || { total: 0, count: 0, lastDate: null }
    const invData = invoiceMap.get(sup.id) || { total: 0, paid: 0, outstanding: 0 }
    const totalPaid = paymentMap.get(sup.id) || 0
    const totalReturned = returnMap.get(sup.id) || 0
    const rawBalance = invData.total - totalPaid - totalReturned
    const outstandingBalance = Math.round(rawBalance * 100) / 100

    return {
      ...sup,
      financialSummary: {
        totalPurchases: Math.round(pData.total * 100) / 100,
        totalPurchasesCount: pData.count,
        totalInvoiced: Math.round(invData.total * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalReturned: Math.round(totalReturned * 100) / 100,
        outstandingBalance,
        currentPayable: Math.max(0, outstandingBalance),
        lastPurchaseDate: pData.lastDate,
      },
    }
  })

  return {
    suppliers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get supplier details along with authoritative history records
 */
export async function getSupplierById(id: string): Promise<SupplierDetailResult | null> {
  const supabase = await createClient()

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !supplier) {
    return null
  }

  // Fetch full related records
  const [purchasesRes, invoicesRes, paymentsRes, returnsRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('*')
      .eq('supplier_id', id)
      .order('purchase_date', { ascending: false }),
    supabase
      .from('supplier_invoices')
      .select('*')
      .eq('supplier_id', id)
      .order('invoice_date', { ascending: false }),
    supabase
      .from('supplier_payments')
      .select('*')
      .eq('supplier_id', id)
      .order('payment_date', { ascending: false }),
    supabase
      .from('supplier_returns')
      .select('*')
      .eq('supplier_id', id)
      .order('created_at', { ascending: false }),
  ])

  const purchases = (purchasesRes.data as Purchase[]) || []
  const invoices = (invoicesRes.data as SupplierInvoice[]) || []
  const payments = (paymentsRes.data as SupplierPayment[]) || []
  const returns = (returnsRes.data as SupplierReturn[]) || []

  // Derive authoritative financials
  let totalPurchases = 0
  let totalPurchasesCount = 0
  let lastPurchaseDate: string | null = null

  for (const p of purchases) {
    if (p.status !== 'cancelled') {
      totalPurchases += Number(p.total_amount) || 0
      totalPurchasesCount += 1
      if (!lastPurchaseDate || p.purchase_date > lastPurchaseDate) {
        lastPurchaseDate = p.purchase_date
      }
    }
  }

  let totalInvoiced = 0
  for (const inv of invoices) {
    if (inv.status !== 'cancelled') {
      totalInvoiced += Number(inv.total_amount) || 0
    }
  }

  let totalPaid = 0
  for (const pmt of payments) {
    totalPaid += Number(pmt.amount) || 0
  }

  let totalReturned = 0
  for (const ret of returns) {
    if (ret.status === 'completed') {
      totalReturned += Number(ret.total_amount) || 0
    }
  }

  const rawBalance = totalInvoiced - totalPaid - totalReturned
  const outstandingBalance = Math.round(rawBalance * 100) / 100

  return {
    supplier: supplier as Supplier,
    financialSummary: {
      totalPurchases: Math.round(totalPurchases * 100) / 100,
      totalPurchasesCount,
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalReturned: Math.round(totalReturned * 100) / 100,
      outstandingBalance,
      currentPayable: Math.max(0, outstandingBalance),
      lastPurchaseDate,
    },
    purchases,
    invoices,
    payments,
    returns,
  }
}

/**
 * Create a new supplier with database-safe code generation and audit log
 */
export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  await requirePermission('suppliers.create')
  const supabase = await createClient()

  // Generate safe code via RPC
  let supplierCode: string | null = null
  const { data: codeData } = await supabase.rpc('generate_document_code', {
    p_prefix: 'SUP',
    p_seq: 'public.seq_supplier_code',
  })

  if (codeData) {
    supplierCode = codeData
  } else {
    supplierCode = `SUP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const insertPayload = {
    supplier_code: supplierCode,
    name: input.name.trim(),
    contact_person: input.contact_person?.trim() || null,
    phone: input.phone?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    tax_identifier: input.tax_identifier?.trim() || null,
    payment_terms: input.payment_terms || '30 days',
    credit_limit: Math.max(0, Number(input.credit_limit) || 0),
    notes: input.notes?.trim() || null,
    is_active: true,
    created_by: user?.id || null,
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    throw new Error(`Failed to create supplier: ${error.message}`)
  }

  await logAuditEvent({
    action: 'supplier.create',
    entityType: 'supplier',
    entityId: data.id,
    newValues: insertPayload,
  })

  return data as Supplier
}

/**
 * Update an existing supplier record
 */
export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  await requirePermission('suppliers.edit')
  const supabase = await createClient()

  // Fetch current for audit comparison
  const { data: existing } = await supabase.from('suppliers').select('*').eq('id', id).single()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const updatePayload: import('@/types/database.types').Database['public']['Tables']['suppliers']['Update'] = {
    updated_by: user?.id || null,
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updatePayload.name = input.name.trim()
  if (input.contact_person !== undefined) updatePayload.contact_person = input.contact_person?.trim() || null
  if (input.phone !== undefined) updatePayload.phone = input.phone?.trim() || null
  if (input.whatsapp !== undefined) updatePayload.whatsapp = input.whatsapp?.trim() || null
  if (input.email !== undefined) updatePayload.email = input.email?.trim() || null
  if (input.address !== undefined) updatePayload.address = input.address?.trim() || null
  if (input.tax_identifier !== undefined) updatePayload.tax_identifier = input.tax_identifier?.trim() || null
  if (input.payment_terms !== undefined) updatePayload.payment_terms = input.payment_terms
  if (input.credit_limit !== undefined) updatePayload.credit_limit = Math.max(0, Number(input.credit_limit) || 0)
  if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active

  const { data, error } = await supabase
    .from('suppliers')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    throw new Error(`Failed to update supplier: ${error.message}`)
  }

  await logAuditEvent({
    action: 'supplier.update',
    entityType: 'supplier',
    entityId: id,
    oldValues: existing ? (existing as unknown as import('@/types/database.types').Json) : undefined,
    newValues: updatePayload as unknown as import('@/types/database.types').Json,
  })

  return data as Supplier
}

/**
 * Archive a supplier (soft delete)
 */
export async function archiveSupplier(id: string): Promise<boolean> {
  await requirePermission('suppliers.archive')
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error archiving supplier:', error)
    throw new Error(`Failed to archive supplier: ${error.message}`)
  }

  await logAuditEvent({
    action: 'supplier.archive',
    entityType: 'supplier',
    entityId: id,
    newValues: { is_active: false },
  })

  return true
}

/**
 * Restore an archived supplier
 */
export async function restoreSupplier(id: string): Promise<boolean> {
  await requirePermission('suppliers.archive')
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error restoring supplier:', error)
    throw new Error(`Failed to restore supplier: ${error.message}`)
  }

  await logAuditEvent({
    action: 'supplier.restore',
    entityType: 'supplier',
    entityId: id,
    newValues: { is_active: true },
  })

  return true
}
