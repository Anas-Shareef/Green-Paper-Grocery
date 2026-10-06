import type { Notification } from '@/types/database.types'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
}

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const iconConfig = {
    info: { icon: Info, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
    },
    error: {
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    },
  }[notification.type] || {
    icon: Info,
    color: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-800',
  }

  const Icon = iconConfig.icon
  const timeFormatted = new Date(notification.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3.5 rounded-xl border border-transparent transition-all hover:bg-muted/40',
        !notification.is_read && 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/40'
      )}
    >
      <div
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          iconConfig.color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {notification.title}
          </p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {timeFormatted}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
      </div>

      {!notification.is_read && onMarkRead && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="opacity-0 group-hover:opacity-100 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
        >
          Mark read
        </button>
      )}
    </div>
  )
}
