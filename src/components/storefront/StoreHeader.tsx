'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Store,
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Package,
  MapPin,
  LogOut,
  LogIn,
  ChevronDown,
  Sparkles,
  Phone,
  LayoutGrid,
  ShieldCheck,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/lib/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function StoreHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { totalCount, subtotal } = useCart()

  const urlQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state when urlQuery or pathname changes during render
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setSearchQuery(urlQuery)
  }

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
  }

  // Listen to Supabase auth state
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/shop')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setAccountMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const categoryQuickLinks = [
    { label: 'Fresh Produce', href: '/shop?category=fresh-produce' },
    { label: 'Dairy & Eggs', href: '/shop?category=dairy-eggs' },
    { label: 'Bakery & Bread', href: '/shop?category=bakery-bread' },
    { label: 'Pantry & Rice', href: '/shop?category=pantry-staples' },
    { label: 'Beverages & Water', href: '/shop?category=beverages-water' },
    { label: 'Snacks & Sweets', href: '/shop?category=snacks-sweets' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border/80 shadow-xs">
      {/* 1. Top Utility Notification Bar (Matches FreshMart Image 2) */}
      <div className="bg-[#14532d] text-emerald-50 text-[11px] py-1.5 px-4 font-medium transition-colors">
        <div className="store-container flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-emerald-300 text-[10px] uppercase font-bold tracking-wider">Delivery to</span>
            <MapPin className="h-3 w-3 text-emerald-300 shrink-0" />
            <span className="font-bold text-white truncate">Zone 19, Abu Dhabi, United Arab Emirates</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 shrink-0 text-emerald-100 text-[11px]">
            <span>Call Us for any query or help: <strong className="text-white">+971 2 642 8899</strong></span>
            <span className="h-3 w-px bg-emerald-700" />
            <span>English</span>
            <span className="h-3 w-px bg-emerald-700" />
            <span className="font-bold text-white">AED</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="store-container">
        <div className="h-18 flex items-center justify-between gap-4 sm:gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-11 w-11 rounded-2xl bg-[#16a34a] text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-foreground leading-none">
                  Baqqala
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Grocery
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wide block mt-0.5">
                Zone 19 • Abu Dhabi
              </span>
            </div>
          </Link>

          {/* All Categories Dropdown Button (FreshMart Style in Image 2) */}
          <Link
            href="/categories"
            className="hidden lg:flex items-center gap-2 h-11 px-4 rounded-xl border border-border/80 bg-muted/30 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-600/40 text-xs font-bold transition-all shadow-2xs shrink-0"
          >
            <Menu className="h-4 w-4 text-[#16a34a]" />
            <span>All Categories</span>
          </Link>

          {/* Central Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl mx-2 relative items-center"
          >
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search for Product, Brand or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-5 pr-12 h-11 rounded-2xl bg-muted/40 border-border/80 focus:bg-card focus:border-[#16a34a] text-xs font-medium placeholder:text-muted-foreground/70 transition-all shadow-2xs"
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1.5 h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-[#16a34a]"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Right Action Clusters */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zone Indicator (Desktop) */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/20 text-xs">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <div className="text-left leading-tight">
                <span className="text-[10px] text-muted-foreground block font-medium">Deliver to</span>
                <span className="font-bold text-foreground text-xs">Zone 19, Abu Dhabi</span>
              </div>
            </div>

            {/* Account Menu */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border/70 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-2xs"
                    aria-label="User Account"
                  >
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-black text-[11px]">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline-block max-w-[110px] truncate">
                      {user.user_metadata?.full_name || 'My Account'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>

                  {/* Dropdown Menu */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-2 border-b border-border/60 mb-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {user.user_metadata?.full_name || 'Customer'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground"
                      >
                        <User className="h-3.5 w-3.5 text-emerald-600" />
                        Account Overview
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground"
                      >
                        <Package className="h-3.5 w-3.5 text-emerald-600" />
                        Order History
                      </Link>
                      <Link
                        href="/account/loyalty"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        Baqqala Rewards
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-foreground"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        Saved Addresses
                      </Link>
                      <div className="h-px bg-border/60 my-1" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3.5 rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:border-emerald-600 hover:text-emerald-600 shadow-2xs"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Shopping Cart Button */}
            <Link href="/cart">
              <Button
                variant="outline"
                size="sm"
                className="relative h-10 px-3.5 sm:px-4 gap-2 border-emerald-600/30 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold text-xs rounded-2xl transition-all shadow-xs"
              >
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Cart</span>
                {mounted && totalCount > 0 && (
                  <span className="h-5 min-w-5 px-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center animate-in zoom-in shadow-xs">
                    {totalCount}
                  </span>
                )}
                {mounted && subtotal > 0 && (
                  <span className="hidden md:inline-block font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-bold border-l border-emerald-300/40 pl-2">
                    AED {subtotal.toFixed(2)}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Navigation Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Stacked below on small viewports) */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Input
              type="search"
              placeholder="Search vegetables, milk, rice, tea..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-16 h-10 rounded-xl bg-muted/50 border-border text-xs font-medium"
            />
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 h-8 px-3 rounded-lg text-xs bg-emerald-600 text-white font-bold"
            >
              Find
            </Button>
          </form>
        </div>
      </div>

      {/* 3. Secondary Category & Quick Links Bar (Desktop) */}
      <div className="hidden lg:block border-t border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-11 flex items-center justify-between gap-6 text-xs font-semibold">
            {/* All Categories Dropdown Pill */}
            <div className="flex items-center gap-6">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>All Categories</span>
                <ChevronDown className="h-3 w-3 opacity-80" />
              </Link>

              {/* Quick Category Links */}
              <nav className="flex items-center gap-5">
                <Link
                  href="/shop"
                  className={`hover:text-emerald-600 transition-colors ${
                    pathname === '/shop' && !searchParams.get('category')
                      ? 'text-emerald-600 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Shop Catalog
                </Link>
                {categoryQuickLinks.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="text-muted-foreground hover:text-emerald-600 transition-colors whitespace-nowrap"
                  >
                    {cat.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Quick Highlights */}
            <div className="flex items-center gap-4 text-xs">
              <Link
                href="/shop?sort=featured"
                className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold hover:underline"
              >
                <Flame className="h-3.5 w-3.5 text-amber-600" />
                <span>Special Offers</span>
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-600" /> Zone 19 Support
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[110px] bottom-0 z-40 bg-background/95 backdrop-blur-md overflow-y-auto px-4 py-5 space-y-6 border-t border-border animate-in slide-in-from-top-2">
          {/* Categories Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block px-2">
              Browse Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between"
              >
                <span>All Categories</span>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-card border border-border text-foreground text-xs font-bold flex items-center justify-between"
              >
                <span>Full Catalog</span>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
              </Link>
              {categoryQuickLinks.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-xl bg-card border border-border/70 text-foreground text-xs font-medium hover:bg-muted truncate"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account & Orders Section */}
          <div className="border-t border-border pt-4 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block px-2">
              Customer Account
            </span>
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <User className="h-4 w-4 text-emerald-600" /> My Account Overview
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Package className="h-4 w-4 text-emerald-600" /> My Orders & History
                </Link>
                <Link
                  href="/account/loyalty"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Baqqala Loyalty Rewards
                </Link>
                <Link
                  href="/account/addresses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <MapPin className="h-4 w-4 text-emerald-600" /> Delivery Addresses
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-xs font-bold h-10 rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full text-xs font-bold h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Delivery Note */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Serving Zone 19 Abu Dhabi
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Express local fulfillment from your neighborhood Baqqala grocery.
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
