'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Expense } from '@/types/database.types'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  X,
  AlertCircle,
  Tag,
  CreditCard,
  Building,
  Truck,
  Package,
} from 'lucide-react'
import { createExpenseAction, deleteExpenseAction } from '@/app/admin/expenses/actions'

const CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  delivery_fuel: { label: 'Delivery & Fuel', icon: Truck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
  packaging: { label: 'Packaging & Bags', icon: Package, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
  salaries: { label: 'Staff Salaries', icon: Building, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
  utilities: { label: 'Electricity & Water', icon: Tag, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60' },
  rent: { label: 'Store Lease / Rent', icon: Building, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
  maintenance: { label: 'Repairs & Maintenance', icon: Tag, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60' },
  marketing: { label: 'Marketing & Ads', icon: Tag, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
  other: { label: 'General Overhead', icon: Receipt, color: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900' },
}

interface ExpenseTableProps {
  expenses: Expense[]
  total: number
  totalAmount: number
  page: number
  limit: number
  currentCategory?: string
}

export function ExpenseTable({
  expenses,
  total,
  totalAmount,
  page,
  limit,
  currentCategory = 'all',
}: ExpenseTableProps) {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleCategoryFilter = (cat: string) => {
    const params = new URLSearchParams()
    if (cat !== 'all') params.set('category', cat)
    router.push(`/admin/expenses?${params.toString()}`)
  }

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createExpenseAction(formData)
      if (res.success) {
        setIsAddModalOpen(false)
        router.refresh()
      } else {
        setErrorMsg(res.error || 'Failed to record expense')
      }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    startTransition(async () => {
      await deleteExpenseAction(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Category Filter Pills & Add Button */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => handleCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              currentCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => {
            const isActive = currentCategory === catKey
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryFilter(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {info.label}
              </button>
            )
          })}
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" /> Record Expense
        </Button>
      </div>

      {/* Table List */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm text-foreground">No Operating Expenses Recorded</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {currentCategory !== 'all'
              ? 'No expenses match the selected category filter.'
              : 'Log daily store overheads like delivery fuel, packaging, and utilities for accurate financial reporting.'}
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Record Expense
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount (AED)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => {
                  const catMeta = CATEGORY_LABELS[exp.category] || CATEGORY_LABELS.other
                  const CatIcon = catMeta.icon

                  return (
                    <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${catMeta.color}`}>
                          <CatIcon className="h-3 w-3" />
                          {catMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-sm truncate">
                        {exp.description}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-muted-foreground">
                        {exp.payment_method || 'cash'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-foreground">
                        <CurrencyDisplay amount={Number(exp.amount) || 0} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(exp.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Record Operating Expense</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Expense Category <span className="text-destructive">*</span>
                </label>
                <select
                  name="category"
                  required
                  defaultValue="delivery_fuel"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Amount (AED) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 120.00"
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Expense Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="expense_date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  defaultValue="cash"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="cash">Store Cash / Till</option>
                  <option value="card">Company Card / Debit</option>
                  <option value="bank_transfer">Bank Wire / Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Description / Receipt Reference <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  placeholder="e.g. Petrol for delivery bike #2 (E-Plus 91)"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {isPending ? 'Recording...' : 'Record Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Delete Expense Record?</h3>
                <p className="text-xs text-muted-foreground">This transaction will be permanently removed.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteId(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                size="sm"
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
