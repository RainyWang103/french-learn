import { describe, it, expect } from 'vitest'
import { computeStreak } from '$session/utils/streak'

describe('computeStreak', () => {
  it('starts a fresh streak when last_session_date is null', () => {
    const next = computeStreak(
      { streak: 0, streak_shields: 1, last_session_date: null },
      '2026-04-18',
    )
    expect(next).toEqual({ streak: 1, streak_shields: 1, last_session_date: '2026-04-18' })
  })

  it('leaves state untouched when completing on the same day again', () => {
    const prev = { streak: 5, streak_shields: 1, last_session_date: '2026-04-18' }
    expect(computeStreak(prev, '2026-04-18')).toBe(prev)
  })

  it('increments on the next consecutive day', () => {
    const next = computeStreak(
      { streak: 5, streak_shields: 1, last_session_date: '2026-04-17' },
      '2026-04-18',
    )
    expect(next).toEqual({ streak: 6, streak_shields: 1, last_session_date: '2026-04-18' })
  })

  it('consumes a shield on a 2-day gap when shields are available', () => {
    const next = computeStreak(
      { streak: 9, streak_shields: 1, last_session_date: '2026-04-16' },
      '2026-04-18',
    )
    expect(next).toEqual({ streak: 10, streak_shields: 0, last_session_date: '2026-04-18' })
  })

  it('resets to 1 on a multi-day gap when no shields are available', () => {
    const next = computeStreak(
      { streak: 12, streak_shields: 0, last_session_date: '2026-04-10' },
      '2026-04-18',
    )
    expect(next).toEqual({ streak: 1, streak_shields: 0, last_session_date: '2026-04-18' })
  })

  it('uses completion date even across month boundaries', () => {
    const next = computeStreak(
      { streak: 3, streak_shields: 2, last_session_date: '2026-03-31' },
      '2026-04-01',
    )
    expect(next.streak).toBe(4)
    expect(next.last_session_date).toBe('2026-04-01')
  })

  it('leaves state untouched if session date is earlier than last_session_date', () => {
    const prev = { streak: 4, streak_shields: 1, last_session_date: '2026-04-18' }
    expect(computeStreak(prev, '2026-04-17')).toBe(prev)
  })
})
