import { useMemo } from 'react'
import { useFailureModes } from '@/services/failure-mode/failure-mode-queries'
import { useAuthStore } from '@/store/auth-store'
import { toDateKey } from '@/lib/date'

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeekSaturday(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + (6 - d.getDay()))
  d.setHours(0, 0, 0, 0)
  return d
}

function subYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() - years)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' })
}

export interface DayCell {
  date: Date
  key: string
  count: number
  isOutOfRange: boolean
}

interface UseContributionWeeksOptions {
  /** Calendar year (Jan 1 - Dec 31) to show. Omit for the default trailing-12-months window ending today. */
  year?: number
}

export function useContributionWeeks(options: UseContributionWeeksOptions = {}) {
  const { year } = options
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useFailureModes(
    { reported_by: user?.id, limit: 1000 },
    { enabled: !!user?.id },
  )

  const { weeks, monthLabels } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const fm of data?.data ?? []) {
      if (!fm.due_date) continue
      const key = toDateKey(new Date(fm.due_date))
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const today = new Date()
    let periodStart: Date
    let periodEnd: Date
    if (year != null) {
      periodStart = new Date(year, 0, 1)
      periodEnd = year === today.getFullYear() ? today : new Date(year, 11, 31)
    } else {
      periodStart = subYears(today, 1)
      periodEnd = today
    }

    const gridStart = startOfWeekSunday(periodStart)
    const gridEnd = endOfWeekSaturday(periodEnd)
    const days: Date[] = []
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
      days.push(d)
    }

    const weekChunks: DayCell[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weekChunks.push(
        days.slice(i, i + 7).map((date) => {
          const key = toDateKey(date)
          return {
            date,
            key,
            count: counts.get(key) ?? 0,
            isOutOfRange: date < periodStart || date > periodEnd,
          }
        }),
      )
    }

    const labels = weekChunks.map((week, i) => {
      const firstDay = week[0].date
      const prevFirstDay = i > 0 ? weekChunks[i - 1][0].date : null
      const isNewMonth = !prevFirstDay || firstDay.getMonth() !== prevFirstDay.getMonth()
      return isNewMonth ? monthLabel(firstDay) : ''
    })

    return { weeks: weekChunks, monthLabels: labels }
  }, [data, year])

  return { weeks, monthLabels, isLoading }
}
