import React from 'react'
import { getOrCreateCurrentCustomer } from '@/lib/services/customerStore'
import { CustomerProfileForm } from '@/components/storefront/CustomerProfileForm'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Profile Details | My Account',
}

export default async function CustomerProfilePage() {
  const customer = await getOrCreateCurrentCustomer()

  if (!customer) {
    notFound()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Personal Details</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Update your phone number and delivery location for grocery deliveries
        </p>
      </div>

      <CustomerProfileForm customer={customer} />
    </div>
  )
}
