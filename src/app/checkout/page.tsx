import React from 'react'
import Link from 'next/link'
import { StoreLayout } from '@/components/storefront/StoreLayout'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import {
  getOrCreateCurrentCustomer,
  getCustomerAddresses,
} from '@/lib/services/customerStore'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Secure Checkout | Baqqala Grocery',
  description: 'Complete your grocery order for Zone 19, Abu Dhabi delivery.',
}

export default async function CheckoutPage() {
  const [customer, savedAddresses] = await Promise.all([
    getOrCreateCurrentCustomer(),
    getCustomerAddresses(),
  ])

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Express Checkout
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fast local delivery in Zone 19, Abu Dhabi
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Guaranteed Stock & Price Protection</span>
          </div>
        </div>

        {/* Interactive Checkout Form */}
        <CheckoutForm
          savedAddresses={savedAddresses}
          initialCustomerName={customer?.name || ''}
          initialCustomerPhone={customer?.mobile || ''}
          initialCustomerEmail={customer?.email || ''}
        />
      </div>
    </StoreLayout>
  )
}
