'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addCustomerAddressAction,
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
} from '@/app/account/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Trash2,
  Star,
  X,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react'
import type { CustomerAddress } from '@/types/database.types'

interface CustomerAddressesManagerProps {
  initialAddresses: CustomerAddress[]
}

export function CustomerAddressesManager({ initialAddresses }: CustomerAddressesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form states
  const [label, setLabel] = useState('Home')
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [buildingOrVilla, setBuildingOrVilla] = useState('')
  const [street, setStreet] = useState('')
  const [area, setArea] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    startTransition(async () => {
      try {
        await addCustomerAddressAction({
          label,
          recipient_name: recipientName,
          phone,
          building_or_villa: buildingOrVilla,
          street,
          area,
          city: 'Abu Dhabi',
          emirate: 'Abu Dhabi',
          zone: 'Zone 19',
          delivery_instructions: instructions,
          is_default: isDefault,
        })
        setModalOpen(false)
        // Reset form
        setRecipientName('')
        setPhone('')
        setBuildingOrVilla('')
        setStreet('')
        setArea('')
        setInstructions('')
        setIsDefault(false)
        router.refresh()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save address'
        setErrorMsg(msg)
      }
    })
  }

  const handleDelete = (addressId: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return
    startTransition(async () => {
      try {
        await deleteCustomerAddressAction(addressId)
        router.refresh()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete address')
      }
    })
  }

  const handleSetDefault = (addressId: string) => {
    startTransition(async () => {
      try {
        await setDefaultCustomerAddressAction(addressId)
        router.refresh()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to set default address')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-foreground">Saved Delivery Addresses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Addresses in Zone 19 for fast express grocery deliveries
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      </div>

      {/* Address Cards Grid */}
      {initialAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialAddresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl border p-5 bg-card flex flex-col justify-between space-y-4 shadow-xs transition-all ${
                addr.is_default
                  ? 'border-emerald-600/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-border'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-current" /> Default
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground">{addr.recipient_name}</p>
                  <p className="text-muted-foreground">{addr.phone}</p>
                  <p className="text-muted-foreground leading-relaxed pt-1">
                    {addr.building_or_villa}, {addr.street}, {addr.area}, {addr.city} ({addr.zone})
                  </p>
                  {addr.delivery_instructions && (
                    <p className="text-[11px] text-muted-foreground italic pt-1">
                      Note: &ldquo;{addr.delivery_instructions}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {!addr.is_default && (
                <div className="pt-3 border-t border-border/60 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Set as Default Address
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground space-y-3">
          <Building className="h-8 w-8 mx-auto opacity-40" />
          <p>No delivery addresses saved yet. Add your Zone 19 home or apartment address.</p>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            size="sm"
            className="bg-emerald-600 text-white font-semibold"
          >
            Add Address Now
          </Button>
        </div>
      )}

      {/* Add Address Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Add Delivery Address</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Address Label
                  </label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold cursor-pointer"
                  >
                    <option value="Home">Home</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Work / Office">Work / Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Recipient Full Name
                  </label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    placeholder="e.g. Fatima Al Hosani"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Phone (UAE)
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="050 123 4567"
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Building / Villa
                  </label>
                  <Input
                    value={buildingOrVilla}
                    onChange={(e) => setBuildingOrVilla(e.target.value)}
                    required
                    placeholder="e.g. Tower B, Flat 301"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Area / District
                  </label>
                  <Input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    placeholder="e.g. Zone 19 Sector 2"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Street / Landmark Details
                </label>
                <Input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  placeholder="e.g. Street 24, near Baqqala Mosque"
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Delivery Instructions (Optional)
                </label>
                <Input
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Leave at apartment doorstep, ring bell"
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="defaultCheck" className="text-xs text-foreground cursor-pointer">
                  Set as my default delivery address
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="h-10 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
