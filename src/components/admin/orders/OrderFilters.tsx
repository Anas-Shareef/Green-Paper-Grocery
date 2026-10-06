'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Filter } from 'lucide-react'

interface OrderFiltersProps {
  currentStatus?: string
  currentPaymentStatus?: string
  currentDateRange?: string
  currentSearch?: string
  kpis?: {
    pendingOrders: number
    confirmedOrders: number
    preparingOrders: number
    readyOrders: number
    outForDeliveryOrders: number
  }
}

interface StatusTabItem {
  key: string
  label: string
  countKey?: 'pendingOrders' | 'confirmedOrders' | 'preparingOrders' | 'readyOrders' | 'outForDeliveryOrders'
}

const STATUS_TABS: StatusTabItem[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending', countKey: 'pendingOrders' },
  { key: 'confirmed', label: 'Confirmed', countKey: 'confirmedOrders' },
  { key: 'preparing', label: 'Preparing', countKey: 'preparingOrders' },
  { key: 'ready', label: 'Ready', countKey: 'readyOrders' },
  { key: 'out_for_delivery', label: 'Out for Delivery', countKey: 'outForDeliveryOrders' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed_delivery', label: 'Failed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function OrderFilters({
  currentStatus = 'all',
  currentPaymentStatus = 'all',
  currentDateRange = 'all',
  currentSearch = '',
  kpis,
}: OrderFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState(currentSearch)

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page') // Reset page on filter change

    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all') {
        params.delete(key)
      } else {
        params.set(key, val)
      }
    })

    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchTerm.trim() || undefined })
  }

  const clearSearch = () => {
    setSearchTerm('')
    updateFilters({ search: undefined })
  }

  const hasActiveFilters =
    (currentStatus && currentStatus !== 'all') ||
    (currentPaymentStatus && currentPaymentStatus !== 'all') ||
    (currentDateRange && currentDateRange !== 'all') ||
    !!currentSearch

  return (
    <div className="space-y-4">
      {/* 1. Status Queue Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = currentStatus === tab.key || (!currentStatus && tab.key === 'all')
          const count =
            tab.countKey && kpis ? kpis[tab.countKey as keyof typeof kpis] : undefined

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateFilters({ status: tab.key })}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              {typeof count === 'number' && count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-800 text-emerald-100'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 2. Secondary Filter Controls (Search + Dropdowns) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search order #, customer, phone, Zone 19 address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs rounded-lg bg-background"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Filters dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Select */}
          <select
            value={currentDateRange}
            onChange={(e) => updateFilters({ dateRange: e.target.value })}
            className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          {/* Payment Status Select */}
          <select
            value={currentPaymentStatus}
            onChange={(e) => updateFilters({ paymentStatus: e.target.value })}
            className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="all">All Payments</option>
            <option value="pending">Payment Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Payment Failed</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                router.push('/admin/orders')
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <Filter className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
