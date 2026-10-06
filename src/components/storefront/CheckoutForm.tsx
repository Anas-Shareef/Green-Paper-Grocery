'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/context/CartContext'
import { processCustomerCheckout } from '@/app/checkout/actions'
import { CurrencyDisplay } from '@/components/admin/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  Truck,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { CustomerAddress, PaymentMethod } from '@/types/database.types'

interface CheckoutFormProps {
  savedAddresses: CustomerAddress[]
  initialCustomerName?: string
  initialCustomerPhone?: string
  initialCustomerEmail?: string
}

export function CheckoutForm({
  savedAddresses,
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialCustomerEmail = '',
}: CheckoutFormProps) {
  const router = useRouter()
  const { items, subtotal, clearCart, isLoaded } = useCart()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Address selection state
  const defaultAddrId = savedAddresses.find((a) => a.is_default)?.id || savedAddresses[0]?.id || 'new'
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddrId)

  // Manual / Guest Address inputs
  const [guestName, setGuestName] = useState(initialCustomerName)
  const [guestPhone, setGuestPhone] = useState(initialCustomerPhone)
  const [guestEmail, setGuestEmail] = useState(initialCustomerEmail)
  const [buildingOrVilla, setBuildingOrVilla] = useState('')
  const [street, setStreet] = useState('')
  const [area, setArea] = useState('Zone 19')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  if (!isLoaded) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground">
        Loading checkout...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-foreground">Your Cart is Empty</h2>
        <p className="text-xs text-muted-foreground">
          You don&apos;t have any items in your cart to checkout.
        </p>
        <Link href="/shop">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
            Return to Shop
          </Button>
        </Link>
      </div>
    )
  }

  // Cost calculations
  const taxRate = 0.05 // 5% UAE standard VAT
  const taxAmount = Number((subtotal * taxRate).toFixed(2))
  const freeDeliveryThreshold = 100
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : 10
  const grandTotal = Number((subtotal + taxAmount + deliveryFee).toFixed(2))

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Determine final address string
    let finalAddressText = ''
    if (selectedAddressId !== 'new') {
      const found = savedAddresses.find((a) => a.id === selectedAddressId)
      if (found) {
        finalAddressText = `${found.building_or_villa}, ${found.street}, ${found.area}, ${found.city} (${found.zone})`
      }
    } else {
      if (!buildingOrVilla.trim() || !street.trim()) {
        setErrorMsg('Please specify your building/villa and street address in Zone 19.')
        return
      }
      finalAddressText = `${buildingOrVilla.trim()}, ${street.trim()}, ${area.trim()}, Abu Dhabi (Zone 19)`
    }

    if (!finalAddressText) {
      setErrorMsg('A valid delivery address is required.')
      return
    }

    const orderLines = items.map((i) => ({
      product_id: i.id,
      quantity: i.quantity,
    }))

    startTransition(async () => {
      const result = await processCustomerCheckout({
        items: orderLines,
        deliveryAddress: finalAddressText,
        deliveryNotes: deliveryNotes.trim() || undefined,
        paymentMethod,
        guestName: guestName.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
      })

      if (!result.success || !result.orderId) {
        setErrorMsg(result.error || 'Failed to place order. Please check stock and try again.')
      } else {
        // Clear cart after confirmed success
        clearCart()
        router.push(`/order-success/${result.orderId}`)
      }
    })
  }

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Delivery & Payment Details */}
      <div className="lg:col-span-7 space-y-6">
        {errorMsg && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive text-xs">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Checkout Issue</strong>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 1. Contact Information */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h2 className="font-bold text-base text-foreground">Customer Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Name
              </label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                placeholder="Full Name"
                className="h-10 rounded-xl text-xs"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mobile Number (UAE)
              </label>
              <Input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
                placeholder="050 123 4567"
                className="h-10 rounded-xl text-xs"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address (For Order Updates)
              </label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-10 rounded-xl text-xs"
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* 2. Delivery Address in Zone 19 */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h2 className="font-bold text-base text-foreground">Delivery Location (Zone 19)</h2>
          </div>

          {/* Saved Addresses Radio Selector if available */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Choose Saved Address
              </label>
              <div className="space-y-2">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addressChoice"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <strong className="font-bold text-foreground">{addr.label}</strong>
                        {addr.is_default && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {addr.building_or_villa}, {addr.street}, {addr.area}
                      </p>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedAddressId === 'new'
                      ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    value="new"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    + Deliver to a different address
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* New / Manual Address Form */}
          {(savedAddresses.length === 0 || selectedAddressId === 'new') && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Building / Villa / Flat
                  </label>
                  <Input
                    value={buildingOrVilla}
                    onChange={(e) => setBuildingOrVilla(e.target.value)}
                    required={selectedAddressId === 'new'}
                    placeholder="e.g. Al Noor Building, Apt 204"
                    className="h-10 rounded-xl text-xs"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Area / Sector
                  </label>
                  <Input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required={selectedAddressId === 'new'}
                    placeholder="Zone 19"
                    className="h-10 rounded-xl text-xs"
                    disabled={isPending}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Street & Landmark
                  </label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required={selectedAddressId === 'new'}
                    placeholder="e.g. Street 15, Near Baqqala Market"
                    className="h-10 rounded-xl text-xs"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delivery Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Delivery Notes / Gate Instructions (Optional)
            </label>
            <Input
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Ring bell, leave outside door, gate code 1234"
              className="h-10 rounded-xl text-xs"
              disabled={isPending}
            />
          </div>
        </div>

        {/* 3. Payment Method */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h2 className="font-bold text-base text-foreground">Payment Method</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'cash'
                  ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="paymentChoice"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span>Cash on Delivery</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Pay cash directly to our delivery courier upon arrival.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'card_on_delivery'
                  ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="paymentChoice"
                value="card_on_delivery"
                checked={paymentMethod === 'card_on_delivery'}
                onChange={() => setPaymentMethod('card_on_delivery')}
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Card on Delivery</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Pay with Visa, Mastercard, or Apple Pay via portable POS machine.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Place Order Button */}
      <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6 sticky top-24">
        <h2 className="font-extrabold text-lg text-foreground">Order Review</h2>

        {/* Item list snapshot */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-border/60">
          {items.map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-bold text-foreground truncate">{item.name}</p>
                <span className="text-[11px] text-muted-foreground">
                  {item.quantity} × <CurrencyDisplay amount={item.price} />
                </span>
              </div>
              <CurrencyDisplay
                amount={item.price * item.quantity}
                className="font-bold text-foreground shrink-0"
              />
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2.5 pt-4 border-t border-border text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <CurrencyDisplay amount={subtotal} className="text-foreground font-semibold" />
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>5% UAE VAT</span>
            <CurrencyDisplay amount={taxAmount} className="text-foreground font-semibold" />
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Delivery Fee</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded font-mono">
                Zone 19
              </span>
            </div>
            {deliveryFee === 0 ? (
              <span className="text-emerald-600 font-bold">FREE</span>
            ) : (
              <CurrencyDisplay amount={deliveryFee} className="text-foreground font-semibold" />
            )}
          </div>

          <div className="h-px bg-border my-2" />

          <div className="flex items-baseline justify-between pt-1">
            <span className="font-bold text-base text-foreground">Total to Pay</span>
            <CurrencyDisplay
              amount={grandTotal}
              className="text-2xl font-black text-emerald-600"
            />
          </div>
        </div>

        {/* Submit Place Order Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...
            </>
          ) : (
            `Place Order • AED ${grandTotal.toFixed(2)}`
          )}
        </Button>

        {/* Reassurance */}
        <div className="pt-2 space-y-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Authoritative price recalculation enforced by server</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Zone 19 local grocery fulfillment within 30 minutes</span>
          </div>
        </div>
      </div>
    </form>
  )
}
