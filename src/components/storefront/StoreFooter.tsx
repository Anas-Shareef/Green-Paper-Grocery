import React from 'react'
import Link from 'next/link'
import { Store, MapPin, ShieldCheck, Clock, Truck } from 'lucide-react'

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-card mt-auto text-muted-foreground text-xs">
      {/* Value Proposition Highlights Banner */}
      <div className="border-b border-border bg-emerald-50/40 dark:bg-emerald-950/10">
        <div className="store-container py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-card/60 border border-emerald-100/60 dark:border-emerald-900/30 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-foreground text-sm tracking-tight">Zone 19 Express</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">Fast local delivery direct to your villa or apartment.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-card/60 border border-emerald-100/60 dark:border-emerald-900/30 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-foreground text-sm tracking-tight">Daily Fresh Restock</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">Farm produce, dairy & pantry staples restocked daily.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-card/60 border border-emerald-100/60 dark:border-emerald-900/30 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-foreground text-sm tracking-tight">Transparent Pricing</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">100% genuine retail prices in AED with standard 5% VAT.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-card/60 border border-emerald-100/60 dark:border-emerald-900/30 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-foreground text-sm tracking-tight">Abu Dhabi Local</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">Rooted in Zone 19 neighborhood grocery community.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="store-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-foreground block">
                  Baqqala Grocery
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest block">
                  Zone 19 • Abu Dhabi
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Your neighborhood grocery operating system and fresh delivery platform serving Zone 19, Abu Dhabi, United Arab Emirates. Order fresh fruits, vegetables, dairy, and household essentials.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px]">
              <span className="font-bold text-foreground">Currency:</span> AED (United Arab Emirates Dirham)
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Shop Grocery
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/shop" className="hover:text-emerald-600 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-emerald-600 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=featured" className="hover:text-emerald-600 transition-colors">
                  Popular & Featured
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-emerald-600 transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Account */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Customer Account
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/account" className="hover:text-emerald-600 transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-emerald-600 transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/account/addresses" className="hover:text-emerald-600 transition-colors">
                  Saved Addresses
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-600 transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Store */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Operations & Store
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zone 19, Abu Dhabi, UAE</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Staff Management Portal →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Baqqala Grocery LLC. Zone 19, Abu Dhabi. All rights reserved.</p>
          <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
            <span>5% UAE VAT Inclusive</span>
            <span>•</span>
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>Card on Delivery</span>
            <span>•</span>
            <span>Verified Zone 19 Merchant</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
