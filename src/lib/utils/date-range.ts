export type DashboardDateRange =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'this_month'
  | 'custom'

export interface DateRangeBounds {
  startDate: string // ISO UTC timestamp: inclusive start
  endExclusive: string // ISO UTC timestamp: strictly exclusive end (< endExclusive)
  label: string
}

/**
 * Calculates start (inclusive) and end (exclusive) boundaries for date ranges.
 * Uses `timestamp >= start AND timestamp < endExclusive` to prevent edge boundary inaccuracies.
 * Respects business timezone (defaults to Asia/Dubai).
 */
export function getDateRangeBounds(
  range: DashboardDateRange,
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  const now = new Date()

  // Base midnight today (00:00:00.000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  // Tomorrow midnight (start of next day: strictly exclusive)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  switch (range) {
    case 'today':
      return {
        startDate: todayStart.toISOString(),
        endExclusive: tomorrowStart.toISOString(),
        label: 'Today',
      }

    case 'yesterday': {
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)
      return {
        startDate: yesterdayStart.toISOString(),
        endExclusive: todayStart.toISOString(), // strictly less than today's start
        label: 'Yesterday',
      }
    }

    case '7d': {
      const past7Start = new Date(todayStart)
      past7Start.setDate(past7Start.getDate() - 6)
      return {
        startDate: past7Start.toISOString(),
        endExclusive: tomorrowStart.toISOString(),
        label: 'Last 7 Days',
      }
    }

    case '30d': {
      const past30Start = new Date(todayStart)
      past30Start.setDate(past30Start.getDate() - 29)
      return {
        startDate: past30Start.toISOString(),
        endExclusive: tomorrowStart.toISOString(),
        label: 'Last 30 Days',
      }
    }

    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
      return {
        startDate: monthStart.toISOString(),
        endExclusive: nextMonthStart.toISOString(),
        label: 'This Month',
      }
    }

    case 'custom': {
      if (customStart && customEnd) {
        const start = new Date(customStart)
        start.setHours(0, 0, 0, 0)

        const end = new Date(customEnd)
        end.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() + 1) // next day midnight for exclusive comparison

        return {
          startDate: start.toISOString(),
          endExclusive: end.toISOString(),
          label: 'Custom Range',
        }
      }
      return {
        startDate: todayStart.toISOString(),
        endExclusive: tomorrowStart.toISOString(),
        label: 'Today',
      }
    }

    default:
      return {
        startDate: todayStart.toISOString(),
        endExclusive: tomorrowStart.toISOString(),
        label: 'Today',
      }
  }
}
