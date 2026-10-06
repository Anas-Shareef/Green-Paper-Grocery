'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomerProfileAction } from '@/app/account/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import type { Customer } from '@/types/database.types'

interface CustomerProfileFormProps {
  customer: Customer
}

export function CustomerProfileForm({ customer }: CustomerProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [name, setName] = useState(customer.name || '')
  const [mobile, setMobile] = useState(customer.mobile || '')
  const [whatsapp, setWhatsapp] = useState(customer.whatsapp || '')
  const [address, setAddress] = useState(customer.address || '')
  const [villaOrBuilding, setVillaOrBuilding] = useState(customer.villa_or_building || '')
  const [area, setArea] = useState(customer.area || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(false)

    startTransition(async () => {
      try {
        await updateCustomerProfileAction({
          name,
          mobile,
          whatsapp,
          address,
          villa_or_building: villaOrBuilding,
          area,
        })
        setSuccessMsg(true)
        router.refresh()
        setTimeout(() => setSuccessMsg(false), 3000)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile'
        setErrorMsg(msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Profile details saved successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-10 rounded-xl text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email Address
          </label>
          <Input
            value={customer.email || ''}
            disabled
            className="h-10 rounded-xl text-xs bg-muted/50 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Mobile Phone (UAE)
          </label>
          <Input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            placeholder="050 123 4567"
            className="h-10 rounded-xl text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            WhatsApp Phone (Optional)
          </label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="050 123 4567"
            className="h-10 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="font-bold text-sm text-foreground">Default Delivery Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Building / Villa Name or Number
            </label>
            <Input
              value={villaOrBuilding}
              onChange={(e) => setVillaOrBuilding(e.target.value)}
              placeholder="e.g. Al Huda Building, Apt 402"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Area / Neighborhood
            </label>
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Zone 19 Central"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Street / Full Address
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Street 12, Zone 19, Abu Dhabi"
              className="h-10 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
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
            'Save Profile Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
