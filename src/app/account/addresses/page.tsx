import React from 'react'
import { getCustomerAddresses } from '@/lib/services/customerStore'
import { CustomerAddressesManager } from '@/components/storefront/CustomerAddressesManager'

export const metadata = {
  title: 'Delivery Addresses | My Account',
}

export default async function CustomerAddressesPage() {
  const addresses = await getCustomerAddresses()

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <CustomerAddressesManager initialAddresses={addresses} />
    </div>
  )
}
