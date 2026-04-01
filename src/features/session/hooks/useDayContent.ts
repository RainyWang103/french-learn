import type { DayContent } from '@/types/curriculum'

/**
 * Compute the content file index from the current day number.
 * Every 4th day is a revision day (no JSON file).
 *
 * currentDay % 4 === 0  →  revision day
 * contentIndex = currentDay - Math.floor(currentDay / 4)
 */
export function getDayFileIndex(currentDay: number): number | null {
  if (currentDay % 4 === 0) return null
  return currentDay - Math.floor(currentDay / 4)
}

export function useDayContent(
  _phase: number,
  _day: number,
): {
  content: DayContent | null
  loading: boolean
  error: string | null
  isRevisionDay: boolean
} {
  return { content: null, loading: false, error: null, isRevisionDay: false }
}
