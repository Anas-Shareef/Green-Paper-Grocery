'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, X, AlertCircle, Loader2 } from 'lucide-react'
import { createSupplierAction, updateSupplierAction } from '@/app/admin/suppliers/actions'
import type { Supplier } from '@/types/database.types'

interface SupplierFormDialogProps {
  supplier?: Supplier | null
  open: boolean
  onClose: () => void
}

const COMMON_PAYMENT_TERMS = [
  'Cash',
  'Due immediately',
  '7 days',
  '15 days',
  '30 days',
  '45 days',
  '60 days',
]

export function SupplierFormDialog({ supplier, open, onClose }: SupplierFormDialogProps) {
  const router = useRouter()
  const isEditing = Boolean(supplier)

  const [name, setName] = useState(supplier?.name || '')
  const [contactPerson, setContactPerson] = useState(supplier?.contact_person || '')
  const [phone, setPhone] = useState(supplier?.phone || '')
  const [whatsapp, setWhatsapp] = useState(supplier?.whatsapp || '')
  const [email, setEmail] = useState(supplier?.email || '')
  const [address, setAddress] = useState(supplier?.address || '')
  const [taxIdentifier, setTaxIdentifier] = useState(supplier?.tax_identifier || '')
  const [paymentTerms, setPaymentTerms] = useState(supplier?.payment_terms || '30 days')
  const [creditLimit, setCreditLimit] = useState(supplier?.credit_limit?.toString() || '0')
  const [notes, setNotes] = useState(supplier?.notes || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Supplier name is required')
      return
    }

    const parsedCredit = parseFloat(creditLimit)
    if (isNaN(parsedCredit) || parsedCredit < 0) {
      setError('Credit limit must be a valid non-negative number')
      return
    }

    setLoading(true)
    try {
      if (isEditing && supplier) {
        const res = await updateSupplierAction(supplier.id, {
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          tax_identifier: taxIdentifier.trim() || null,
          payment_terms: paymentTerms,
          credit_limit: parsedCredit,
          notes: notes.trim() || null,
        })

        if (!res.success) {
          setError(res.error || 'Failed to update supplier')
          return
        }
      } else {
        const res = await createSupplierAction({
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          tax_identifier: taxIdentifier.trim() || null,
          payment_terms: paymentTerms,
          credit_limit: parsedCredit,
          notes: notes.trim() || null,
        })

        if (!res.success) {
          setError(res.error || 'Failed to create supplier')
          return
        }
      }

      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? `Update ${supplier?.name} (${supplier?.supplier_code || 'SUP'})`
                  : 'Register a wholesale distributor or vendor profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Supplier / Business Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Al Rawabi Dairy LLC"
                required
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Contact Person</label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Tariq Mansoor"
              />
            </div>

            {/* TRN / Tax Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">VAT TRN / Tax Identifier</label>
              <Input
                value={taxIdentifier}
                onChange={(e) => setTaxIdentifier(e.target.value)}
                placeholder="e.g. 100234567800003"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +971 2 555 1234"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">WhatsApp Direct</label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. +971 50 123 4567"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. wholesale@supplier.ae"
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {COMMON_PAYMENT_TERMS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            {/* Credit Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Credit Limit (AED)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Warehouse / Office Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Musaffah Industrial Area M-14, Abu Dhabi"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Operational Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Delivery schedules, minimum order values, representative contacts..."
                className="w-full rounded-lg border border-input bg-background p-3 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Supplier'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
