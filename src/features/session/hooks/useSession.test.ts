import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { UserProfile, SessionLog } from '$types/profile'
import type { DayContent } from '$types/curriculum'

// --- Mocks -----------------------------------------------------------------

const { supabaseRef, saveProfileMock } = vi.hoisted(() => {
  return {
    supabaseRef: { current: null as unknown },
    saveProfileMock: vi.fn() as ReturnType<typeof vi.fn<(next: unknown) => Promise<unknown>>>,
  }
})

vi.mock('$lib/supabase', () => ({
  get supabase() {
    return supabaseRef.current
  },
  DB_CONNECTED: true,
  DB_NOT_CONNECTED_MSG: 'Database not connected yet — progress will not be saved.',
}))

vi.mock('$features/profile/hooks/useProfile', async () => {
  const actual = await vi.importActual<typeof import('$features/profile/hooks/useProfile')>(
    '$features/profile/hooks/useProfile',
  )
  return { ...actual, saveProfile: saveProfileMock }
})

// Import after mocks are set up.
import { useSession } from '$session/hooks/useSession'

// --- Fixtures --------------------------------------------------------------

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    display_name: 'Test',
    track: 'standard',
    level: 'A1',
    phase: 1,
    current_day: 3,
    starting_day: 1,
    word_count: 5,
    sessions_per_day: 1,
    playback_speed: 0.7,
    streak: 4,
    streak_shields: 1,
    last_session_date: null,
    difficulty_vocab: 2.0,
    difficulty_grammar: 2.0,
    difficulty_listening: 2.0,
    difficulty_speaking: 2.0,
    difficulty_vocab_override: null,
    difficulty_grammar_override: null,
    difficulty_listening_override: null,
    difficulty_speaking_override: null,
    skip_known_enabled: false,
    hide_pronunciation: false,
    french_only_mode: false,
    flagged_words: [],
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDayContent(): DayContent {
  return {
    day: 3,
    phase: 1,
    isRevision: false,
    topic: 'Greetings',
    vocab: { standard: [], advanced: [] },
    listen: {
      standard: { dialogue: [], questions: [], summary: '' },
      advanced: { dialogue: [], questions: [], summary: '' },
    },
    grammar: {
      standard: { title: 'Present tense', explanation: '', examples: [], drills: [] },
      advanced: { title: 'Present tense (adv)', explanation: '', examples: [], drills: [] },
    },
    quiz: { standard: [], advanced: [] },
    speak: {
      standard: { scenario: '', keyPhrases: [], modelAnswer: '', modelAnswerExplanation: '' },
      advanced: { scenario: '', keyPhrases: [], modelAnswer: '', modelAnswerExplanation: '' },
    },
  }
}

// --- Supabase chain mock ---------------------------------------------------
// The Supabase JS client uses a chainable builder. Each chain method returns
// the same builder so we can resolve at the end. We record invocations by
// attaching a `_calls` log on each builder call.

interface MockCall {
  table: string
  op: 'select' | 'insert' | 'update'
  payload: unknown
  filters: Array<{ method: string; args: unknown[] }>
  terminator: 'single' | 'maybeSingle' | 'await' | null
  resolved: unknown
}

function makeMockSupabase() {
  const calls: MockCall[] = []

  function queueResponse(
    table: string,
    op: 'select' | 'insert' | 'update',
    handler: (call: MockCall) => { data: unknown; error: unknown },
  ) {
    handlers.push({ table, op, handler })
  }

  const handlers: Array<{
    table: string
    op: 'select' | 'insert' | 'update'
    handler: (call: MockCall) => { data: unknown; error: unknown }
  }> = []

  function from(table: string) {
    let currentOp: 'select' | 'insert' | 'update' = 'select'
    let payload: unknown = undefined
    const filters: MockCall['filters'] = []
    let terminator: MockCall['terminator'] = null

    function resolve() {
      const call: MockCall = { table, op: currentOp, payload, filters, terminator, resolved: null }
      const idx = handlers.findIndex((h) => h.table === table && h.op === currentOp)
      let result: { data: unknown; error: unknown } = { data: null, error: null }
      if (idx >= 0) {
        const h = handlers.splice(idx, 1)[0]
        result = h.handler(call)
      }
      call.resolved = result
      calls.push(call)
      return result
    }

    const builder = {
      select: (_cols?: string) => {
        if (currentOp === 'select') payload = _cols
        return builder
      },
      insert: (data: unknown) => {
        currentOp = 'insert'
        payload = data
        return builder
      },
      update: (data: unknown) => {
        currentOp = 'update'
        payload = data
        return builder
      },
      eq: (column: string, value: unknown) => {
        filters.push({ method: 'eq', args: [column, value] })
        return builder
      },
      is: (column: string, value: unknown) => {
        filters.push({ method: 'is', args: [column, value] })
        return builder
      },
      order: (column: string, opts: unknown) => {
        filters.push({ method: 'order', args: [column, opts] })
        return builder
      },
      limit: (n: number) => {
        filters.push({ method: 'limit', args: [n] })
        return builder
      },
      single: () => {
        terminator = 'single'
        return Promise.resolve(resolve())
      },
      maybeSingle: () => {
        terminator = 'maybeSingle'
        return Promise.resolve(resolve())
      },
      then<TResult1, TResult2 = never>(
        onFulfilled?: (value: {
          data: unknown
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>,
        onRejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
      ) {
        terminator = 'await'
        const result = resolve()
        return Promise.resolve(result).then(onFulfilled, onRejected)
      },
    }

    return builder
  }

  return {
    client: { from, auth: {} as Record<string, never> },
    calls,
    queueResponse,
    findCalls(table: string, op: 'select' | 'insert' | 'update') {
      return calls.filter((c) => c.table === table && c.op === op)
    },
  }
}

// Supabase client mock exposes from/auth.
type MockSupabaseHandle = ReturnType<typeof makeMockSupabase>

function installSupabase(handle: MockSupabaseHandle | null) {
  supabaseRef.current = handle ? handle.client : null
}

// --- Hook driver helpers ---------------------------------------------------

function renderSession({
  profile,
  dayContent = makeDayContent(),
  isRevisionDay = false,
}: {
  profile: UserProfile
  dayContent?: DayContent | null
  isRevisionDay?: boolean
}) {
  let latestProfile = profile
  const onProfileSaved = vi.fn((next: UserProfile) => {
    latestProfile = next
  })
  const hook = renderHook(
    ({ p, dc, irv }: { p: UserProfile; dc: DayContent | null; irv: boolean }) =>
      useSession({
        profile: p,
        dayContent: dc,
        isRevisionDay: irv,
        onProfileSaved,
      }),
    { initialProps: { p: profile, dc: dayContent, irv: isRevisionDay } },
  )
  return {
    hook,
    onProfileSaved,
    getLatestProfile: () => latestProfile,
    rerenderWith: (p: UserProfile, dc: DayContent | null = dayContent, irv = isRevisionDay) =>
      hook.rerender({ p, dc, irv }),
  }
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

// --- Tests -----------------------------------------------------------------

beforeEach(() => {
  saveProfileMock.mockClear()
  saveProfileMock.mockImplementation(async (next) => next)
  const handle = makeMockSupabase()
  // Default hydrate response: no in-progress row.
  handle.queueResponse('session_logs', 'select', () => ({ data: null, error: null }))
  installSupabase(handle)
})

afterEach(() => {
  installSupabase(null)
  vi.restoreAllMocks()
})

function freezeNow(isoDate: string) {
  vi.spyOn(Date, 'now').mockReturnValue(new Date(isoDate).getTime())
}

describe('useSession', () => {
  it('hydrates to home when no in-progress row exists', async () => {
    const profile = makeProfile({ flagged_words: ['bonjour'] })
    const { hook } = renderSession({ profile })

    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))
    expect(hook.result.current.step).toBe('home')
    expect(hook.result.current.flaggedWords).toEqual(['bonjour'])
    expect(hook.result.current.results).toEqual({})
  })

  it('hydrates from an in-progress row for today and jumps to the next incomplete section', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const row: Partial<SessionLog> = {
      id: 'log-1',
      user_id: 'user-1',
      day_number: 3,
      phase: 1,
      date: today,
      sections_completed: ['vocab'],
      skipped_as_known: false,
      vocab_score: 4,
      vocab_total: 5,
      flagged_words: ['pain'],
      completed_at: null,
    }

    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: row, error: null }))
    installSupabase(handle)

    const profile = makeProfile()
    const { hook } = renderSession({ profile })

    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))
    expect(hook.result.current.step).toBe('listening')
    expect(hook.result.current.results.vocab).toEqual({ score: 4, total: 5 })
    expect(hook.result.current.flaggedWords).toEqual(['pain'])
  })

  it('abandons a stale in-progress row from a previous date and starts fresh', async () => {
    const row: Partial<SessionLog> = {
      id: 'log-old',
      user_id: 'user-1',
      day_number: 2,
      phase: 1,
      date: '2020-01-01',
      sections_completed: ['vocab', 'listening'],
      skipped_as_known: false,
      flagged_words: [],
      completed_at: null,
    }
    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: row, error: null }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    installSupabase(handle)

    const profile = makeProfile()
    const { hook } = renderSession({ profile })

    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))
    expect(hook.result.current.step).toBe('home')
    const updates = handle.findCalls('session_logs', 'update')
    expect(updates).toHaveLength(1)
    const patch = updates[0].payload as Record<string, unknown>
    expect(patch).toHaveProperty('completed_at')
    expect(updates[0].filters.some((f) => f.method === 'eq' && f.args[1] === 'log-old')).toBe(true)
  })

  it('advances step immediately on completeSection and saves non-blockingly', async () => {
    // Freeze saveProfile so we can observe UI transitions before it resolves.
    let resolveSave: (value: UserProfile) => void = () => {}
    saveProfileMock.mockImplementation((next) =>
      new Promise<UserProfile>((res) => {
        resolveSave = res
      }).then(() => next as UserProfile),
    )

    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'insert', () => ({
      data: { id: 'log-new' } as Partial<SessionLog>,
      error: null,
    }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    installSupabase(handle)

    const profile = makeProfile()
    const { hook } = renderSession({ profile })
    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))

    act(() => hook.result.current.actions.start())
    await flush()
    expect(hook.result.current.step).toBe('vocab')

    act(() => {
      void hook.result.current.actions.completeSection('vocab', {
        score: 3,
        total: 5,
        flaggedWords: ['bonjour'],
      })
    })
    // UI transitions immediately — save has NOT resolved yet.
    expect(hook.result.current.step).toBe('listening')
    expect(hook.result.current.results.vocab).toEqual({ score: 3, total: 5 })

    // Allow saves to resolve.
    act(() => resolveSave(profile))
    await flush()

    expect(saveProfileMock).toHaveBeenCalled()
    const savedArg = saveProfileMock.mock.calls[0][0] as UserProfile
    // Low score path: 3/5 = 0.6 → +0.2
    expect(savedArg.difficulty_vocab).toBeCloseTo(2.2, 5)
    expect(savedArg.flagged_words).toContain('bonjour')
  })

  it('fires updateDifficulty with per-section args for each completed section', async () => {
    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'insert', () => ({
      data: { id: 'log-x' } as Partial<SessionLog>,
      error: null,
    }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    installSupabase(handle)

    const profile = makeProfile()
    let currentProfile = profile
    saveProfileMock.mockImplementation(async (next) => {
      currentProfile = next as UserProfile
      return next
    })

    const { hook, rerenderWith } = renderSession({ profile })
    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))

    act(() => hook.result.current.actions.start())
    await flush()

    // Perfect vocab → -0.3.
    await act(async () => {
      await hook.result.current.actions.completeSection('vocab', { score: 5, total: 5 })
    })
    rerenderWith(currentProfile)
    expect(currentProfile.difficulty_vocab).toBeCloseTo(1.7, 5)

    // 0.8 ratio → unchanged.
    await act(async () => {
      await hook.result.current.actions.completeSection('listening', { score: 4, total: 5 })
    })
    rerenderWith(currentProfile)
    expect(currentProfile.difficulty_listening).toBeCloseTo(2.0, 5)

    // 0.6 ratio → +0.2.
    await act(async () => {
      await hook.result.current.actions.completeSection('grammar', { score: 3, total: 5 })
    })
    rerenderWith(currentProfile)
    expect(currentProfile.difficulty_grammar).toBeCloseTo(2.2, 5)
  })

  it('canSkipKnown toggles false once any section has completed', async () => {
    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'insert', () => ({
      data: { id: 'log-z' } as Partial<SessionLog>,
      error: null,
    }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    installSupabase(handle)

    const profile = makeProfile({ skip_known_enabled: true, track: 'advanced' })
    const { hook } = renderSession({ profile })
    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))

    expect(hook.result.current.canSkipKnown).toBe(true)

    act(() => hook.result.current.actions.start())
    await flush()
    // Now on 'vocab' step — canSkipKnown requires step === 'home'.
    expect(hook.result.current.canSkipKnown).toBe(false)
  })

  it('skipKnown inserts a skipped session_log and advances current_day by 1', async () => {
    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'insert', () => ({
      data: { id: 'log-skip' } as Partial<SessionLog>,
      error: null,
    }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    installSupabase(handle)

    const profile = makeProfile({
      skip_known_enabled: true,
      track: 'advanced',
      current_day: 8,
      streak: 3,
      last_session_date: '2026-04-17',
    })
    // System date is 2026-04-18 per test env (see CLAUDE.md currentDate).
    freezeNow('2026-04-18T12:00:00Z')

    const { hook } = renderSession({ profile })
    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))

    await act(async () => {
      await hook.result.current.actions.skipKnown()
    })
    await flush()

    const inserts = handle.findCalls('session_logs', 'insert')
    expect(inserts).toHaveLength(1)
    const insertPayload = inserts[0].payload as Record<string, unknown>
    expect(insertPayload.skipped_as_known).toBe(true)
    expect(insertPayload.completed_at).toBeTruthy()

    await waitFor(() => expect(saveProfileMock).toHaveBeenCalled())
    const savedArg = saveProfileMock.mock.calls[
      saveProfileMock.mock.calls.length - 1
    ][0] as UserProfile
    expect(savedArg.current_day).toBe(9)
    expect(savedArg.streak).toBe(4)
    expect(savedArg.last_session_date).toBe('2026-04-18')
    expect(hook.result.current.step).toBe('complete')
  })

  it('uses the completion date for streak even when the session started on a prior calendar day', async () => {
    // Initial profile: last session 2 days ago, no shields.
    const profile = makeProfile({
      streak: 5,
      streak_shields: 0,
      last_session_date: '2026-04-16',
      skip_known_enabled: true,
      track: 'advanced',
    })
    const handle = makeMockSupabase()
    handle.queueResponse('session_logs', 'select', () => ({ data: null, error: null }))
    handle.queueResponse('session_logs', 'insert', () => ({
      data: { id: 'log-c' } as Partial<SessionLog>,
      error: null,
    }))
    handle.queueResponse('session_logs', 'update', () => ({ data: null, error: null }))
    installSupabase(handle)

    freezeNow('2026-04-18T12:00:00Z')

    const { hook } = renderSession({ profile })
    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))

    await act(async () => {
      await hook.result.current.actions.skipKnown()
    })
    await flush()

    await waitFor(() => expect(saveProfileMock).toHaveBeenCalled())
    const savedArg = saveProfileMock.mock.calls[
      saveProfileMock.mock.calls.length - 1
    ][0] as UserProfile
    // 2-day gap, no shields → reset to 1.
    expect(savedArg.streak).toBe(1)
    expect(savedArg.last_session_date).toBe('2026-04-18')
  })

  it('gracefully handles supabase === null by running locally and still calling onProfileSaved', async () => {
    installSupabase(null)
    const profile = makeProfile({
      skip_known_enabled: true,
      track: 'advanced',
      last_session_date: '2026-04-17',
    })
    freezeNow('2026-04-18T12:00:00Z')

    const { hook, onProfileSaved } = renderSession({ profile })
    await waitFor(() => expect(hook.result.current.hydrating).toBe(false))

    await act(async () => {
      await hook.result.current.actions.skipKnown()
    })
    await flush()

    await waitFor(() => expect(hook.result.current.step).toBe('complete'))
    expect(onProfileSaved).toHaveBeenCalled()
    // saveProfile (DB) was not called — supabase is null.
    expect(saveProfileMock).not.toHaveBeenCalled()
  })
})
