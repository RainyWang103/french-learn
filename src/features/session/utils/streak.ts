export interface StreakState {
  streak: number
  streak_shields: number
  last_session_date: string | null
}

/**
 * Derive next streak state from previous state and the date the session
 * being closed out actually completed on.
 *
 * Rules:
 *   last_session_date null       → streak 1 (first session)
 *   gap ≤ 0 (same day or stale)  → unchanged
 *   gap === 1                    → streak + 1
 *   gap ≥ 2, shields > 0         → streak + 1, shields - 1
 *   gap ≥ 2, shields === 0       → streak resets to 1
 */
export function computeStreak(prev: StreakState, sessionDate: string): StreakState {
  if (!prev.last_session_date) {
    return {
      streak: 1,
      streak_shields: prev.streak_shields,
      last_session_date: sessionDate,
    }
  }
  const gap = daysBetween(prev.last_session_date, sessionDate)
  if (gap <= 0) return prev
  if (gap === 1) {
    return {
      streak: prev.streak + 1,
      streak_shields: prev.streak_shields,
      last_session_date: sessionDate,
    }
  }
  if (prev.streak_shields > 0) {
    return {
      streak: prev.streak + 1,
      streak_shields: prev.streak_shields - 1,
      last_session_date: sessionDate,
    }
  }
  return { streak: 1, streak_shields: 0, last_session_date: sessionDate }
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fromY, fromM, fromD] = parseYMD(fromIso)
  const [toY, toM, toD] = parseYMD(toIso)
  const fromUtc = Date.UTC(fromY, fromM, fromD)
  const toUtc = Date.UTC(toY, toM, toD)
  return Math.round((toUtc - fromUtc) / 86_400_000)
}

function parseYMD(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return [y, m - 1, d]
}
