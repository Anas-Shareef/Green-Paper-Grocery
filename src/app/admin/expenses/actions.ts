'use server'

import { revalidatePath } from 'next/cache'
import { createExpense, deleteExpense } from '@/lib/services/expenses'

export async function createExpenseAction(formData: FormData) {
  try {
    const category = (formData.get('category') as string) || 'other'
    const amountStr = formData.get('amount') as string
    const description = formData.get('description') as string
    const expenseDate = (formData.get('expense_date') as string) || new Date().toISOString().slice(0, 10)
    const paymentMethod = (formData.get('payment_method') as string) || 'cash'
    const attachmentUrl = (formData.get('attachment_url') as string) || undefined

    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Please enter a valid expense amount greater than 0.' }
    }

    if (!description?.trim()) {
      return { success: false, error: 'Please enter an expense description or reference.' }
    }

    await createExpense({
      category,
      amount,
      description,
      expenseDate,
      paymentMethod,
      attachmentUrl,
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/reports')
    return { success: true }
  } catch (err: any) {
    console.error('Error creating expense:', err)
    return { success: false, error: err.message || 'Failed to record expense.' }
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    await deleteExpense(id)
    revalidatePath('/admin/expenses')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/reports')
    return { success: true }
  } catch (err: any) {
    console.error('Error deleting expense:', err)
    return { success: false, error: err.message || 'Failed to delete expense.' }
  }
}
