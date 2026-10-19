import { createClient } from '@/lib/supabase/server'
import type { Expense } from '@/types/database.types'
import { logAuditEvent } from './audit'

export interface ExpenseListParams {
  category?: string
  paymentMethod?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface CreateExpenseInput {
  category: string
  amount: number
  description: string
  expenseDate: string
  paymentMethod?: string
  attachmentUrl?: string
}

export async function getExpenses(params: ExpenseListParams = {}): Promise<{
  expenses: Expense[]
  total: number
  totalAmount: number
  page: number
  limit: number
  totalPages: number
}> {
  const supabase = await createClient()
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, Math.min(params.limit || 25, 100))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('expenses').select('*', { count: 'exact' })

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  if (params.paymentMethod && params.paymentMethod !== 'all') {
    query = query.eq('payment_method', params.paymentMethod as import('@/types/database.types').PaymentMethod)
  }

  if (params.dateFrom) {
    query = query.gte('expense_date', params.dateFrom)
  }

  if (params.dateTo) {
    query = query.lte('expense_date', params.dateTo)
  }

  query = query.order('expense_date', { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching expenses:', error)
    return { expenses: [], total: 0, totalAmount: 0, page, limit, totalPages: 0 }
  }

  const expenses = (data as Expense[]) || []
  const total = count || 0

  // Calculate sum of amount for the current filter
  let sumQuery = supabase.from('expenses').select('amount')
  if (params.category && params.category !== 'all') sumQuery = sumQuery.eq('category', params.category)
  if (params.paymentMethod && params.paymentMethod !== 'all') sumQuery = sumQuery.eq('payment_method', params.paymentMethod as import('@/types/database.types').PaymentMethod)
  if (params.dateFrom) sumQuery = sumQuery.gte('expense_date', params.dateFrom)
  if (params.dateTo) sumQuery = sumQuery.lte('expense_date', params.dateTo)
  const { data: sumData } = await sumQuery

  const totalAmount = (sumData || []).reduce((acc, row) => acc + (Number(row.amount) || 0), 0)

  return {
    expenses,
    total,
    totalAmount: Math.round(totalAmount * 100) / 100,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!input.amount || input.amount <= 0) {
    throw new Error('Expense amount must be greater than zero')
  }

  if (!input.description?.trim()) {
    throw new Error('Expense description is required')
  }

  const payload = {
    category: input.category || 'other',
    amount: Math.round(input.amount * 100) / 100,
    description: input.description.trim(),
    expense_date: input.expenseDate || new Date().toISOString().slice(0, 10),
    payment_method: (input.paymentMethod || 'cash') as import('@/types/database.types').PaymentMethod,
    attachment_url: input.attachmentUrl || null,
    created_by: user?.id || null,
  }

  const { data, error } = await supabase.from('expenses').insert(payload as any).select().single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save expense record')
  }

  await logAuditEvent({
    action: 'expense.create',
    entityType: 'expense',
    entityId: data.id,
    newValues: payload,
  })

  return data as Expense
}

export async function deleteExpense(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await logAuditEvent({
    action: 'expense.delete',
    entityType: 'expense',
    entityId: id,
  })

  return true
}
