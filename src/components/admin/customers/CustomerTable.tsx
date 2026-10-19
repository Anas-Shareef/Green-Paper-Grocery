'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer } from '@/types/database.types'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  ShoppingBag,
  ExternalLink,
  X,
  Check,
  AlertCircle,
  Building,
} from 'lucide-react'
import { createCustomerAction } from '@/app/admin/customers/actions'

interface CustomerTableProps {
  customers: Customer[]
  total: number
  page: number
  limit: number
  currentSearch?: string
  currentSegment?: string
}

export function CustomerTable({
  customers,
  total,
  page,
  limit,
  currentSearch = '',
  currentSegment = 'all',
}: CustomerTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('search', searchTerm.trim())
    if (currentSegment && currentSegment !== 'all') params.set('segment', currentSegment)
    router.push(`/admin/customers?${params.toString()}`)
  }

  const handleSegmentChange = (seg: string) => {
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('search', searchTerm.trim())
    if (seg !== 'all') params.set('segment', seg)
    router.push(`/admin/customers?${params.toString()}`)
  }

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createCustomerAction(formData)
      if (res.success) {
        setIsAddModalOpen(false)
        router.refresh()
      } else {
        setErrorMsg(res.error || 'Failed to save customer')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Segment Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, mobile, or email..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs font-semibold">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'new', 'regular', 'vip', 'inactive'].map((seg) => {
            const isActive = currentSegment === seg
            return (
              <button
                key={seg}
                type="button"
                onClick={() => handleSegmentChange(seg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {seg}
              </button>
            )
          })}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold ml-auto md:ml-2 gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Table view */}
      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm text-foreground">No Customers Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || currentSegment !== 'all'
              ? 'No customers matched your active search and segment filters.'
              : 'Start building your customer directory by registering walk-in or phone order customers.'}
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add First Customer
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Zone & Address</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => {
                  const cleanPhone = (c.mobile || '').replace(/\D/g, '')
                  const waNumber = cleanPhone.startsWith('971') ? cleanPhone : `971${cleanPhone.replace(/^0+/, '')}`

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="hover:text-emerald-600 text-left font-bold transition-colors"
                        >
                          {c.name}
                        </button>
                        {c.email && (
                          <span className="block text-[11px] text-muted-foreground font-normal truncate max-w-xs">
                            {c.email}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{c.mobile}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          {c.zone || 'Zone 19'}
                        </div>
                        <div className="truncate max-w-xs">{c.villa_or_building ? `${c.villa_or_building}, ` : ''}{c.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.customer_segment === 'vip'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : c.customer_segment === 'regular'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : c.customer_segment === 'inactive'
                              ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {c.customer_segment || 'new'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {c.total_orders || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-foreground">
                        <CurrencyDisplay amount={Number(c.total_spend) || 0} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(c)}
                          className="h-8 text-xs font-semibold hover:bg-muted"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {customers.map((c) => {
              const cleanPhone = (c.mobile || '').replace(/\D/g, '')
              const waNumber = cleanPhone.startsWith('971') ? cleanPhone : `971${cleanPhone.replace(/^0+/, '')}`

              return (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="font-bold text-sm text-foreground text-left block hover:text-emerald-600"
                      >
                        {c.name}
                      </button>
                      <span className="text-xs text-muted-foreground font-mono">{c.mobile}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.customer_segment === 'vip'
                          ? 'bg-purple-100 text-purple-800'
                          : c.customer_segment === 'regular'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.customer_segment || 'new'}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.zone || 'Zone 19'}:</span> {c.address}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                    <div>
                      <span className="text-muted-foreground">Orders: </span>
                      <span className="font-bold font-mono">{c.total_orders || 0}</span>
                      <span className="text-muted-foreground ml-3">Spend: </span>
                      <span className="font-bold text-emerald-600">AED {Number(c.total_spend) || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedCustomer(c)}
                        className="h-7 text-[11px] px-2.5"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input name="name" required placeholder="e.g. Fatima Al Hosani" className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Mobile Number <span className="text-destructive">*</span>
                  </label>
                  <Input name="mobile" required placeholder="050 123 4567" className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address (Optional)</label>
                <Input name="email" type="email" placeholder="customer@domain.ae" className="h-9 text-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Villa / Building / Flat</label>
                  <Input name="villa_or_building" placeholder="Villa 14, Floor 2" className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Zone</label>
                  <Input name="zone" defaultValue="Zone 19" className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Street & Delivery Address</label>
                <Input name="address" placeholder="Street 14, Al Dana, Abu Dhabi" className="h-9 text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Special Delivery Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ring doorbell, leave outside door if unattended..."
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {isPending ? 'Saving...' : 'Save Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer/Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">{selectedCustomer.name}</h3>
                  <span className="text-[11px] text-muted-foreground">Customer Profile & CRM Summary</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Profile Card */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Mobile</span>
                  <span className="font-mono font-bold text-foreground text-sm">{selectedCustomer.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Segment</span>
                  <span className="font-bold uppercase text-emerald-600">{selectedCustomer.customer_segment || 'new'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Lifetime Orders</span>
                  <span className="font-bold text-foreground text-sm">{selectedCustomer.total_orders || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Lifetime Value</span>
                  <span className="font-bold text-emerald-600 text-sm">AED {Number(selectedCustomer.total_spend) || 0}</span>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Primary Address (Zone 19)
                </span>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <p className="font-semibold text-foreground">
                    {selectedCustomer.villa_or_building ? `${selectedCustomer.villa_or_building}, ` : ''}
                    {selectedCustomer.address}
                  </p>
                  <p className="text-muted-foreground text-[11px]">{selectedCustomer.area || 'Abu Dhabi'} • {selectedCustomer.zone || 'Zone 19'}</p>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-foreground">Customer Notes</span>
                  <div className="p-3 rounded-xl border border-border bg-muted/20 text-muted-foreground">
                    {selectedCustomer.notes}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                {selectedCustomer.mobile && (
                  <a
                    href={`https://wa.me/${selectedCustomer.mobile.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    <MessageCircle className="h-4 w-4" /> Message on WhatsApp
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="ml-auto text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
