import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mockMaybeSingle = vi.fn()
const mockUpsertSingle = vi.fn()
const mockEq = vi.fn((_column: string, _value: string) => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockUpsertSingle }))
const mockUpsert = vi.fn<
  (payload: Record<string, unknown>, options: { onConflict: string }) => unknown
>(() => ({
  select: mockSelect,
}))
const mockFrom = vi.fn((_table: string) => ({
  select: () => ({ eq: mockEq }),
  upsert: mockUpsert,
}))

vi.mock('$lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
  DB_NOT_CONNECTED_MSG: 'Database not connected yet — progress will not be saved.',
  DB_CONNECTED: true,
}))

const mockUseAuth = vi.fn()
vi.mock('$features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import {
  createDefaultProfile,
  getEffectiveDifficulty,
  loadProfile,
  saveProfile,
  useProfile,
} from '$features/profile/hooks/useProfile'
import type { UserProfile } from '$features/profile/types'

function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    ...createDefaultProfile('user-1', 'Rainy'),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
})

describe('createDefaultProfile', () => {
  it('uses standard-track defaults', () => {
    const profile = createDefaultProfile('user-1', 'Rainy')
    expect(profile.id).toBe('user-1')
    expect(profile.display_name).toBe('Rainy')
    expect(profile.track).toBe('standard')
    expect(profile.word_count).toBe(5)
    expect(profile.skip_known_enabled).toBe(false)
    expect(profile.hide_pronunciation).toBe(false)
    expect(profile.playback_speed).toBeCloseTo(0.7)
    expect(profile.starting_day).toBe(1)
    expect(profile.current_day).toBe(1)
  })

  it('uses advanced-track defaults', () => {
    const profile = createDefaultProfile('user-2', 'Friend', { track: 'advanced' })
    expect(profile.track).toBe('advanced')
    expect(profile.word_count).toBe(7)
    expect(profile.skip_known_enabled).toBe(true)
    expect(profile.hide_pronunciation).toBe(true)
    expect(profile.playback_speed).toBeCloseTo(0.9)
  })

  it('honours startingDay option for both current_day and starting_day', () => {
    const profile = createDefaultProfile('user-3', 'Friend', { startingDay: 12 })
    expect(profile.starting_day).toBe(12)
    expect(profile.current_day).toBe(12)
  })

  it('initialises every difficulty to 2.0 with no overrides', () => {
    const profile = createDefaultProfile('user-1', 'Rainy')
    expect(profile.difficulty_vocab).toBe(2.0)
    expect(profile.difficulty_grammar).toBe(2.0)
    expect(profile.difficulty_listening).toBe(2.0)
    expect(profile.difficulty_speaking).toBe(2.0)
    expect(profile.difficulty_vocab_override).toBeNull()
    expect(profile.difficulty_grammar_override).toBeNull()
    expect(profile.difficulty_listening_override).toBeNull()
    expect(profile.difficulty_speaking_override).toBeNull()
  })
})

describe('getEffectiveDifficulty', () => {
  it('returns the override value when an override is set', () => {
    const profile = buildProfile({ difficulty_vocab: 2.0, difficulty_vocab_override: 3.5 })
    expect(getEffectiveDifficulty(profile, 'vocab')).toBe(3.5)
  })

  it('returns the auto float when the override is null', () => {
    const profile = buildProfile({ difficulty_grammar: 2.4, difficulty_grammar_override: null })
    expect(getEffectiveDifficulty(profile, 'grammar')).toBeCloseTo(2.4)
  })

  it('falls back to the auto float after the override is reset to null', () => {
    let profile = buildProfile({ difficulty_listening: 2.7, difficulty_listening_override: 1.0 })
    expect(getEffectiveDifficulty(profile, 'listening')).toBe(1.0)
    profile = { ...profile, difficulty_listening_override: null }
    expect(getEffectiveDifficulty(profile, 'listening')).toBeCloseTo(2.7)
  })

  it('treats each section independently', () => {
    const profile = buildProfile({
      difficulty_vocab: 2.0,
      difficulty_vocab_override: 1.0,
      difficulty_speaking: 3.2,
      difficulty_speaking_override: null,
    })
    expect(getEffectiveDifficulty(profile, 'vocab')).toBe(1.0)
    expect(getEffectiveDifficulty(profile, 'speaking')).toBeCloseTo(3.2)
  })
})

describe('loadProfile', () => {
  it('selects the row by user id and returns the profile', async () => {
    const stored = buildProfile({ display_name: 'Stored' })
    mockMaybeSingle.mockResolvedValueOnce({ data: stored, error: null })

    const result = await loadProfile('user-1')

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1')
    expect(result).toEqual(stored)
  })

  it('returns null when no row exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect(await loadProfile('user-1')).toBeNull()
  })

  it('throws on supabase error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    await expect(loadProfile('user-1')).rejects.toThrow('boom')
  })
})

describe('saveProfile', () => {
  it('upserts on the id conflict and stamps updated_at on the payload', async () => {
    const draft = buildProfile({ display_name: 'Edited' })
    const saved = { ...draft, updated_at: '2026-04-18T00:00:00.000Z' }
    mockUpsertSingle.mockResolvedValueOnce({ data: saved, error: null })

    const result = await saveProfile(draft)

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const [payload, options] = mockUpsert.mock.calls[0]
    expect(options).toEqual({ onConflict: 'id' })
    expect(payload).toMatchObject({ id: 'user-1', display_name: 'Edited' })
    expect(typeof (payload as { updated_at: string }).updated_at).toBe('string')
    expect(result).toEqual(saved)
  })

  it('throws on supabase error', async () => {
    mockUpsertSingle.mockResolvedValueOnce({ data: null, error: { message: 'denied' } })
    await expect(saveProfile(buildProfile())).rejects.toThrow('denied')
  })
})

describe('useProfile hook', () => {
  it('loads the profile on mount when a user is present', async () => {
    const stored = buildProfile()
    mockMaybeSingle.mockResolvedValueOnce({ data: stored, error: null })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toEqual(stored)
    expect(result.current.error).toBeNull()
  })

  it('returns null profile when no row exists yet', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
  })

  it('createProfile upserts a default row using the auth user id', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const created = buildProfile({ display_name: 'Brand new', track: 'advanced', word_count: 7 })
    mockUpsertSingle.mockResolvedValueOnce({ data: created, error: null })

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createProfile('Brand new', { track: 'advanced' })
    })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const [payload] = mockUpsert.mock.calls[0]
    expect(payload).toMatchObject({
      id: 'user-1',
      display_name: 'Brand new',
      track: 'advanced',
      word_count: 7,
      skip_known_enabled: true,
      hide_pronunciation: true,
    })
    expect(result.current.profile).toEqual(created)
  })

  it('resetDifficultyOverride writes null for the chosen section only', async () => {
    const stored = buildProfile({
      difficulty_vocab: 2.4,
      difficulty_vocab_override: 3.0,
      difficulty_grammar_override: 1.0,
    })
    mockMaybeSingle.mockResolvedValueOnce({ data: stored, error: null })

    const reset = { ...stored, difficulty_vocab_override: null }
    mockUpsertSingle.mockResolvedValueOnce({ data: reset, error: null })

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.profile).toEqual(stored))

    await act(async () => {
      await result.current.resetDifficultyOverride('vocab')
    })

    const [payload] = mockUpsert.mock.calls[0]
    expect(payload).toMatchObject({
      difficulty_vocab_override: null,
      difficulty_grammar_override: 1.0,
    })
    expect(result.current.profile?.difficulty_vocab_override).toBeNull()
    expect(getEffectiveDifficulty(result.current.profile!, 'vocab')).toBeCloseTo(2.4)
  })

  it('surfaces save failures via error state and rethrows', async () => {
    const stored = buildProfile()
    mockMaybeSingle.mockResolvedValueOnce({ data: stored, error: null })
    mockUpsertSingle.mockResolvedValueOnce({ data: null, error: { message: 'nope' } })

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.profile).toEqual(stored))

    let caught: unknown = null
    await act(async () => {
      try {
        await result.current.saveProfile({ ...stored, display_name: 'New' })
      } catch (saveErr) {
        caught = saveErr
      }
    })

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe('nope')
    await waitFor(() => expect(result.current.error).toBe('nope'))
  })

  it('reports an empty state when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
    expect(mockMaybeSingle).not.toHaveBeenCalled()
  })
})
