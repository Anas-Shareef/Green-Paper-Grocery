import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  // Order Statuses
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  returned: {
    label: 'Returned',
    bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
    dot: 'bg-zinc-500',
  },

  // Payment Statuses
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },

  // Stock Statuses
  in_stock: {
    label: 'In Stock',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  low_stock: {
    label: 'Low Stock',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  // Product Lifecycle Statuses
  active: {
    label: 'Active',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    text: 'text-zinc-600 dark:text-zinc-400',
    dot: 'bg-zinc-400',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedKey = status.toLowerCase()
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
    dot: 'bg-zinc-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
