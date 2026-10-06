'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardDateRange } from '@/lib/services/dashboard'

const RANGE_OPTIONS: Array<{ value: DashboardDateRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
]

export function DateRangePicker({
  currentRange = 'today',
}: {
  currentRange?: DashboardDateRange
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(range: DashboardDateRange) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-card shadow-2xs overflow-x-auto max-w-full">
      <div className="px-2 py-1 flex items-center text-muted-foreground shrink-0">
        <Calendar className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1">
        {RANGE_OPTIONS.map((opt) => {
          const isActive = currentRange === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all outline-none',
                isActive
                  ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
