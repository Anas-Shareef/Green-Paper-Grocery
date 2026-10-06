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
  const { totalCount } = useCart()

  const urlQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  // Adjust state when urlQuery or pathname changes during render
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setSearchQuery(urlQuery)
  }

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
  }

  // Listen to auth state
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

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop Catalog', href: '/shop' },
    { label: 'Categories', href: '/categories' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
      {/* Top Banner: Zone 19 Delivery Announcement */}
      <div className="bg-emerald-700 text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            <MapPin className="h-3.5 w-3.5 text-emerald-300" />
            <span>Delivering fresh daily across Zone 19, Abu Dhabi • Free delivery over AED 100</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px]">
            <span>Fast 30-min express fulfillment</span>
            <Link href="/admin/dashboard" className="text-emerald-200 hover:text-white underline">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-foreground block leading-tight">
                Baqqala
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Grocery Zone 19
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 relative items-center"
          >
            <Input
              type="search"
              placeholder="Search fresh milk, vegetables, rice, tea..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 h-10 rounded-xl bg-muted/50 border-border focus:bg-card text-xs font-medium"
            />
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 h-8 px-3 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Search
            </Button>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-bold transition-colors ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions: Account & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Account Menu (Desktop) */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                  >
                    <User className="h-4 w-4 text-emerald-600" />
                    <span className="hidden sm:inline-block max-w-[100px] truncate">
                      {user.user_metadata?.full_name || 'My Account'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>

                  {/* Dropdown */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
                      <Link
                        href="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground"
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Dashboard
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground"
                      >
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        My Orders
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground"
                      >
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Delivery Addresses
                      </Link>
                      <div className="h-px bg-border my-1" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold h-9 px-2.5 sm:px-3">
                      <LogIn className="h-3.5 w-3.5 mr-1" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Cart Button with Dynamic Badge */}
            <Link href="/cart">
              <Button
                variant="outline"
                size="sm"
                className="relative h-9 px-3 gap-2 border-border font-semibold text-xs rounded-xl hover:border-emerald-600 hover:text-emerald-600"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {totalCount > 0 && (
                  <span className="h-5 min-w-5 px-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center animate-in zoom-in">
                    {totalCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Stacked) */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Input
              type="search"
              placeholder="Search groceries in Zone 19..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-16 h-9 rounded-xl bg-muted/60 border-border text-xs"
            />
            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 h-7 px-2.5 rounded-lg text-[11px] bg-emerald-600 text-white font-semibold"
            >
              Go
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border pt-3 space-y-2">
            {user ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <User className="h-4 w-4 text-emerald-600" /> My Account
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Package className="h-4 w-4 text-emerald-600" /> My Orders
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <MapPin className="h-4 w-4 text-emerald-600" /> Delivery Addresses
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold">
                    Sign In to Account
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                    Create New Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
