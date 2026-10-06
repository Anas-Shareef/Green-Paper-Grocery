'use client'

import React, { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/context/CartContext'
import {
  processCustomerCheckout,
  previewOrderPricingAction,
} from '@/app/checkout/actions'
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
  Tag,
  Gift,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type { CustomerAddress, CustomerLoyaltyAccount, PaymentMethod } from '@/types/database.types'

interface CheckoutFormProps {
  savedAddresses: CustomerAddress[]
  initialCustomerName?: string
  initialCustomerPhone?: string
  initialCustomerEmail?: string
  loyaltyInfo?: {
    account: CustomerLoyaltyAccount | null
    availableValueAed: number
    canRedeem: boolean
  }
}

export function CheckoutForm({
  savedAddresses,
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialCustomerEmail = '',
  loyaltyInfo,
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
  const area = 'Zone 19'
  const [deliveryNotes, setDeliveryNotes] = useState('')

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  // Phase 8: Coupon & Loyalty states
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponFeedback, setCouponFeedback] = useState<{
    valid: boolean
    message: string
  } | null>(null)
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false)

  // Loyalty states
  const pointsBalance = loyaltyInfo?.account?.points_balance || 0
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(
    Math.min(100, pointsBalance)
  )

  // Base pricing calculation
  const defaultDelivery = subtotal >= 100 || subtotal === 0 ? 0 : 10
  const defaultTax = Number((subtotal * 0.05).toFixed(2))

  // Server-authoritative Pricing Preview
  const [pricingPreview, setPricingPreview] = useState<{
    subtotal: number
    promotionDiscount: number
    couponDiscount: number
    loyaltyDiscount: number
    totalDiscount: number
    taxAmount: number
    deliveryFee: number
    grandTotal: number
  }>({
    subtotal,
    promotionDiscount: 0,
    couponDiscount: 0,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    taxAmount: defaultTax,
    deliveryFee: defaultDelivery,
    grandTotal: Number((subtotal + defaultTax + defaultDelivery).toFixed(2)),
  })

  // Trigger server-authoritative preview calculation on user actions
  const refreshPricingPreview = useCallback(async (
    couponCode?: string,
    points?: number
  ) => {
    if (items.length === 0) return

    const orderLines = items.map((i) => ({
      product_id: i.id,
      quantity: i.quantity,
    }))

    const preview = await previewOrderPricingAction({
      items: orderLines,
      couponCode: couponCode || undefined,
      loyaltyPointsToRedeem: points || 0,
    })

    if (preview) {
      setPricingPreview({
        subtotal: preview.subtotal,
        promotionDiscount: preview.promotionDiscount,
        couponDiscount: preview.couponDiscount,
        loyaltyDiscount: preview.loyaltyDiscount,
        totalDiscount: preview.totalDiscount,
        taxAmount: preview.taxAmount,
        deliveryFee: preview.deliveryFee,
        grandTotal: preview.grandTotal,
      })

      if (preview.couponResult) {
        setCouponFeedback({
          valid: preview.couponResult.valid,
          message: preview.couponResult.message,
        })
        if (!preview.couponResult.valid) {
          setAppliedCoupon(null)
        }
      }
    }
  }, [items])

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return

    setIsCheckingCoupon(true)
    setCouponFeedback(null)

    const normalized = couponInput.trim().toUpperCase()
    const orderLines = items.map((i) => ({
      product_id: i.id,
      quantity: i.quantity,
    }))

    const preview = await previewOrderPricingAction({
      items: orderLines,
      couponCode: normalized,
      loyaltyPointsToRedeem: useLoyaltyPoints ? pointsToRedeem : 0,
    })

    setIsCheckingCoupon(false)

    if (preview && preview.couponResult) {
      setCouponFeedback({
        valid: preview.couponResult.valid,
        message: preview.couponResult.message,
      })
      if (preview.couponResult.valid) {
        setAppliedCoupon(normalized)
        setPricingPreview({
          subtotal: preview.subtotal,
          promotionDiscount: preview.promotionDiscount,
          couponDiscount: preview.couponDiscount,
          loyaltyDiscount: preview.loyaltyDiscount,
          totalDiscount: preview.totalDiscount,
          taxAmount: preview.taxAmount,
          deliveryFee: preview.deliveryFee,
          grandTotal: preview.grandTotal,
        })
      } else {
        setAppliedCoupon(null)
      }
    } else {
      setCouponFeedback({
        valid: false,
        message: 'Could not validate coupon at this time.',
      })
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponFeedback(null)
    refreshPricingPreview(undefined, useLoyaltyPoints ? pointsToRedeem : 0)
  }

  const handleToggleLoyalty = (checked: boolean) => {
    setUseLoyaltyPoints(checked)
    const pts = checked ? pointsToRedeem : 0
    refreshPricingPreview(appliedCoupon || undefined, pts)
  }

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
        couponCode: appliedCoupon || undefined,
        loyaltyPointsToRedeem: useLoyaltyPoints ? pointsToRedeem : 0,
      })

      if (!result.success || !result.orderId) {
        setErrorMsg(result.error || 'Failed to place order. Please check stock and try again.')
      } else {
        clearCart()
        router.push(`/order-success/${result.orderId}`)
      }
    })
  }

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

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Delivery & Payment Details */}
      <div className="lg:col-span-7 space-y-6">
        {errorMsg && (
          <div className="rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Checkout Notice</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 1. Recipient Contact */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Full Name *</label>
              <Input
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ahmed Al Mansoori"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Mobile Phone (UAE) *</label>
              <Input
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="050 123 4567"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-foreground">Email Address (Optional)</label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="ahmed@example.com"
                className="h-10 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 2. Delivery Address in Zone 19 */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            Delivery Address (Zone 19, Abu Dhabi)
          </h2>

          {savedAddresses.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Select Saved Address:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
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
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {addr.building_or_villa}, {addr.street}, {addr.area}
                      </p>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedAddressId === 'new'
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    value="new"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-foreground">+ Enter New Address</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Deliver to a new villa or apartment in Zone 19
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Manual inputs if 'new' address or guest */}
          {selectedAddressId === 'new' && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Villa / Building / Flat *</label>
                <Input
                  required
                  value={buildingOrVilla}
                  onChange={(e) => setBuildingOrVilla(e.target.value)}
                  placeholder="Villa 14B or Al Rayyan Tower Apt 402"
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Street Name / Landmark *</label>
                <Input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="19th Street, near Baqqala Corner"
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-foreground">Zone / District</label>
                <Input
                  disabled
                  value={`${area}, Abu Dhabi`}
                  className="h-10 text-xs bg-muted text-muted-foreground"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-xs pt-2">
            <label className="font-semibold text-foreground">Delivery Instructions / Gate Code</label>
            <Input
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Leave at front door, ring doorbell"
              className="h-10 text-xs"
            />
          </div>
        </div>

        {/* 3. Payment Method */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
              3
            </span>
            Payment Method
          </h2>

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

      {/* Right Column: Order Summary, Coupons, Loyalty & Place Order */}
      <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6 sticky top-24">
        <h2 className="font-extrabold text-lg text-foreground">Order Review</h2>

        {/* Item list snapshot */}
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1 divide-y divide-border/60">
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

        {/* Phase 8: Coupon Code Entry */}
        <div className="pt-3 border-t border-border space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-emerald-600" />
            Promo Code / Coupon
          </label>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-200">
                    {appliedCoupon}
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    Applied! -AED {pricingPreview.couponDiscount.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="h-10 text-xs font-mono uppercase"
                  disabled={isCheckingCoupon}
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || isCheckingCoupon}
                  className="h-10 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {isCheckingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                </Button>
              </div>

              {couponFeedback && (
                <div
                  className={`text-[11px] p-2.5 rounded-xl flex items-center gap-2 ${
                    couponFeedback.valid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {couponFeedback.valid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>{couponFeedback.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phase 8: Customer Loyalty Redemption */}
        {loyaltyInfo?.canRedeem && (
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-foreground">Baqqala Loyalty Points</p>
                  <p className="text-[11px] text-muted-foreground">
                    You have <span className="font-bold text-amber-700 dark:text-amber-400">{pointsBalance} pts</span> (worth AED {loyaltyInfo.availableValueAed.toFixed(2)})
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="loyaltyToggle"
                checked={useLoyaltyPoints}
                onChange={(e) => handleToggleLoyalty(e.target.checked)}
                className="h-4 w-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {useLoyaltyPoints && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Points to redeem:</span>
                  <span className="font-bold font-mono text-amber-700 dark:text-amber-400">
                    {pointsToRedeem} pts (AED {(pointsToRedeem * 0.05).toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={pointsBalance}
                  step={50}
                  value={pointsToRedeem}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setPointsToRedeem(val)
                    refreshPricingPreview(appliedCoupon || undefined, val)
                  }}
                  className="w-full accent-amber-600 h-1.5 bg-amber-200 dark:bg-amber-900 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Authoritative Cost Breakdown */}
        <div className="space-y-2.5 pt-4 border-t border-border text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Merchandise Subtotal</span>
            <CurrencyDisplay amount={pricingPreview.subtotal} className="text-foreground font-semibold" />
          </div>

          {pricingPreview.promotionDiscount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-medium">
              <span>Promotion Discount</span>
              <span>-AED {pricingPreview.promotionDiscount.toFixed(2)}</span>
            </div>
          )}

          {pricingPreview.couponDiscount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-medium">
              <span>Coupon Discount ({appliedCoupon})</span>
              <span>-AED {pricingPreview.couponDiscount.toFixed(2)}</span>
            </div>
          )}

          {pricingPreview.loyaltyDiscount > 0 && (
            <div className="flex items-center justify-between text-amber-600 font-medium">
              <span>Loyalty Points Redeemed</span>
              <span>-AED {pricingPreview.loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-muted-foreground">
            <span>5% UAE VAT</span>
            <CurrencyDisplay amount={pricingPreview.taxAmount} className="text-foreground font-semibold" />
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Delivery Fee</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded font-mono">
                Zone 19
              </span>
            </div>
            {pricingPreview.deliveryFee === 0 ? (
              <span className="text-emerald-600 font-bold">FREE</span>
            ) : (
              <CurrencyDisplay amount={pricingPreview.deliveryFee} className="text-foreground font-semibold" />
            )}
          </div>

          <div className="h-px bg-border my-2" />

          <div className="flex items-baseline justify-between pt-1">
            <span className="font-bold text-base text-foreground">Total to Pay</span>
            <CurrencyDisplay
              amount={pricingPreview.grandTotal}
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
            `Place Order • AED ${pricingPreview.grandTotal.toFixed(2)}`
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
