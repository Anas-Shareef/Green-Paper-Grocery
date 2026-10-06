import React from 'react'
import Link from 'next/link'
import { Store, MapPin, ShieldCheck, Clock, Truck } from 'lucide-react'

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-card mt-auto text-muted-foreground text-xs">
      {/* Value Proposition Highlights Banner */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Zone 19 Express</h4>
                <p className="text-[11px] text-muted-foreground">Fast local delivery direct to your villa or flat.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Daily Fresh Restock</h4>
                <p className="text-[11px] text-muted-foreground">Farm produce, dairy & pantry essentials restocked daily.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Transparent Pricing</h4>
                <p className="text-[11px] text-muted-foreground">100% genuine retail prices in AED with standard 5% VAT.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Abu Dhabi Local</h4>
                <p className="text-[11px] text-muted-foreground">Rooted in Zone 19 community neighborhood grocery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Store className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground">
                Baqqala Grocery
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Your neighborhood grocery operating system and fresh delivery platform serving Zone 19, Abu Dhabi, United Arab Emirates. Order fresh fruits, vegetables, dairy, and household essentials.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-foreground">Currency:</span> AED (United Arab Emirates Dirham)
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Shop Grocery
            </h4>
            <ul className="space-y-2">
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
            <ul className="space-y-2">
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

          {/* Community & Admin */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Operations & Store
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Zone 19, Abu Dhabi, UAE</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Staff Management Portal →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Baqqala Grocery LLC. Zone 19, Abu Dhabi. All rights reserved.</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>5% UAE VAT Inclusive</span>
            <span>•</span>
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>Card on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
