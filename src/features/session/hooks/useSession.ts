import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '$lib/supabase'
import type { DayContent } from '$types/curriculum'
import type { SessionLog, Track, UserProfile } from '$types/profile'
import type { SectionType } from '$lib/difficulty'
import { updateDifficulty } from '$lib/difficulty'
import { saveProfile } from '$features/profile/hooks/useProfile'
import { computeStreak } from '$session/utils/streak'

export type SessionStep =
  | 'loading'
  | 'home'
  | 'vocab'
  | 'listening'
  | 'grammar'
  | 'speaking'
  | 'revision'
  | 'saving'
  | 'complete'
  | 'error'

export interface SectionScore {
  score: number
  total: number
}

export interface CompleteSectionResult {
  score: number
  total: number
  flaggedWords?: string[]
}

export interface UseSessionArgs {
  profile: UserProfile
  dayContent: DayContent | null
  isRevisionDay: boolean
  onProfileSaved: (next: UserProfile) => void
}

export interface UseSessionActions {
  start: () => void
  skipKnown: () => Promise<void>
  completeSection: (section: SectionType, result: CompleteSectionResult) => Promise<void>
  completeRevision: (masteredWords: string[]) => Promise<void>
  retryCommit: () => Promise<void>
}

export interface UseSessionResult {
  step: SessionStep
  results: Partial<Record<SectionType, SectionScore>>
  flaggedWords: string[]
  skippedAsKnown: boolean
  saving: boolean
  saveError: string | null
  canSkipKnown: boolean
  hydrating: boolean
  actions: UseSessionActions
}

const SECTION_ORDER: SectionType[] = ['vocab', 'listening', 'grammar', 'speaking']

function todayYMD(): string {
  return new Date(Date.now()).toISOString().slice(0, 10)
}

function nowISO(): string {
  return new Date(Date.now()).toISOString()
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values))
}

function stepForFirstMissing(sectionsCompleted: string[]): SessionStep {
  for (const section of SECTION_ORDER) {
    if (!sectionsCompleted.includes(section)) return section as SessionStep
  }
  return 'saving'
}

function resultsFromRow(row: SessionLog): Partial<Record<SectionType, SectionScore>> {
  const out: Partial<Record<SectionType, SectionScore>> = {}
  if (row.vocab_score != null && row.vocab_total != null) {
    out.vocab = { score: row.vocab_score, total: row.vocab_total }
  }
  if (row.listening_score != null && row.listening_total != null) {
    out.listening = { score: row.listening_score, total: row.listening_total }
  }
  if (row.grammar_score != null && row.grammar_total != null) {
    out.grammar = { score: row.grammar_score, total: row.grammar_total }
  }
  if (row.sections_completed.includes('speaking')) {
    out.speaking = { score: 0, total: 0 }
  }
  return out
}

function grammarTopicFor(dayContent: DayContent | null, track: Track): string | null {
  return dayContent?.grammar[track].title ?? null
}

function difficultyRatingsOf(profile: UserProfile) {
  return {
    vocab: profile.difficulty_vocab,
    grammar: profile.difficulty_grammar,
    listening: profile.difficulty_listening,
    speaking: profile.difficulty_speaking,
  }
}

export function useSession({
  profile,
  dayContent,
  isRevisionDay,
  onProfileSaved,
}: UseSessionArgs): UseSessionResult {
  const [step, setStep] = useState<SessionStep>('loading')
  const [results, setResults] = useState<Partial<Record<SectionType, SectionScore>>>({})
  const [flaggedWords, setFlaggedWords] = useState<string[]>([])
  const [skippedAsKnown, setSkippedAsKnown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hydrating, setHydrating] = useState(true)

  const sessionLogIdRef = useRef<string | null>(null)
  const sectionsCompletedRef = useRef<string[]>([])
  const pendingSaveRef = useRef<Promise<unknown> | null>(null)
  const profileRef = useRef(profile)
  const flaggedRef = useRef<string[]>([])
  const dayContentRef = useRef(dayContent)
  const onProfileSavedRef = useRef(onProfileSaved)

  profileRef.current = profile
  flaggedRef.current = flaggedWords
  dayContentRef.current = dayContent
  onProfileSavedRef.current = onProfileSaved

  // --- Hydration: look for an in-progress row and either resume or abandon.
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const fallbackHome = () => {
        if (cancelled) return
        setStep('home')
        setFlaggedWords(profileRef.current.flagged_words.slice())
        setHydrating(false)
      }

      if (!supabase) {
        fallbackHome()
        return
      }

      try {
        const { data, error } = await supabase
          .from('session_logs')
          .select('*')
          .eq('user_id', profile.id)
          .is('completed_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (error) {
          setSaveError(error.message)
          fallbackHome()
          return
        }

        const row = data as SessionLog | null
        if (!row) {
          fallbackHome()
          return
        }

        const today = todayYMD()
        if (row.date !== today) {
          await supabase.from('session_logs').update({ completed_at: nowISO() }).eq('id', row.id)
          if (cancelled) return
          fallbackHome()
          return
        }

        sessionLogIdRef.current = row.id
        sectionsCompletedRef.current = row.sections_completed.slice()
        setResults(resultsFromRow(row))
        setFlaggedWords(row.flagged_words ?? [])
        setSkippedAsKnown(row.skipped_as_known)
        setStep(isRevisionDay ? 'revision' : stepForFirstMissing(row.sections_completed))
        setHydrating(false)
      } catch (hydrateError) {
        if (cancelled) return
        setSaveError(hydrateError instanceof Error ? hydrateError.message : String(hydrateError))
        fallbackHome()
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [profile.id, isRevisionDay])

  const canSkipKnown =
    !hydrating &&
    step === 'home' &&
    profile.skip_known_enabled &&
    !isRevisionDay &&
    Object.keys(results).length === 0

  // --- start: enter the first section and open a session_logs row.
  const start = useCallback(() => {
    if (step !== 'home') return
    setStep(isRevisionDay ? 'revision' : 'vocab')

    if (!supabase || sessionLogIdRef.current) return

    const insertPromise = (async () => {
      const { data, error } = await supabase!
        .from('session_logs')
        .insert({
          user_id: profileRef.current.id,
          day_number: profileRef.current.current_day,
          phase: profileRef.current.phase,
          date: todayYMD(),
          sections_completed: [],
          skipped_as_known: false,
          flagged_words: [],
          completed_at: null,
        })
        .select()
        .single()
      if (error) {
        setSaveError(error.message)
        return
      }
      sessionLogIdRef.current = (data as SessionLog).id
    })()

    pendingSaveRef.current = insertPromise
    void insertPromise.catch(() => {
      /* surfaced via saveError above */
    })
  }, [step, isRevisionDay])

  // --- completeSection: non-blocking incremental save + advance.
  const completeSection = useCallback(
    async (section: SectionType, result: CompleteSectionResult) => {
      const newFlagged = result.flaggedWords ?? []
      setResults((prev) => ({ ...prev, [section]: { score: result.score, total: result.total } }))
      setFlaggedWords((prev) => dedupeStrings([...prev, ...newFlagged]))

      const idx = SECTION_ORDER.indexOf(section)
      const nextStep: SessionStep =
        idx < 0 || idx === SECTION_ORDER.length - 1
          ? 'saving'
          : (SECTION_ORDER[idx + 1] as SessionStep)
      setStep(nextStep)

      sectionsCompletedRef.current = dedupeStrings([...sectionsCompletedRef.current, section])

      const save = (async () => {
        if (pendingSaveRef.current) {
          await pendingSaveRef.current.catch(() => {})
        }

        const snapshot = profileRef.current
        const autoKey = `difficulty_${section}` as const
        const nextDifficulty = updateDifficulty(snapshot[autoKey], result.score, result.total)
        const mergedFlagged = dedupeStrings([...snapshot.flagged_words, ...newFlagged])

        const profileUpdate: UserProfile = {
          ...snapshot,
          [autoKey]: nextDifficulty,
          flagged_words: mergedFlagged,
        }

        if (!supabase) {
          onProfileSavedRef.current(profileUpdate)
          return
        }

        const profileWritePromise = saveProfile(profileUpdate).then((saved) => {
          onProfileSavedRef.current(saved)
        })

        let logWritePromise: Promise<unknown> = Promise.resolve()
        if (sessionLogIdRef.current) {
          const patch: Record<string, unknown> = {
            sections_completed: sectionsCompletedRef.current,
            flagged_words: mergedFlagged,
          }
          if (section === 'vocab') {
            patch.vocab_score = result.score
            patch.vocab_total = result.total
          } else if (section === 'listening') {
            patch.listening_score = result.score
            patch.listening_total = result.total
          } else if (section === 'grammar') {
            patch.grammar_score = result.score
            patch.grammar_total = result.total
            patch.grammar_topic = grammarTopicFor(dayContentRef.current, snapshot.track)
          }
          const logId = sessionLogIdRef.current
          logWritePromise = (async () => {
            await supabase!.from('session_logs').update(patch).eq('id', logId)
          })()
        }

        await Promise.all([profileWritePromise, logWritePromise])
      })()

      pendingSaveRef.current = save
      save.catch((writeError) => {
        setSaveError(writeError instanceof Error ? writeError.message : String(writeError))
      })
    },
    [],
  )

  // --- completeRevision: remove mastered from flagged, then finalize.
  const completeRevision = useCallback(async (masteredWords: string[]) => {
    const masteredSet = new Set(masteredWords)
    setFlaggedWords((prev) => prev.filter((word) => !masteredSet.has(word)))
    sectionsCompletedRef.current = dedupeStrings([...sectionsCompletedRef.current, 'revision'])
    setStep('saving')
  }, [])

  // --- skipKnown: one-shot finalize with skipped=true.
  const skipKnown = useCallback(async () => {
    if (step !== 'home') return
    if (!profile.skip_known_enabled || isRevisionDay) return

    setSkippedAsKnown(true)
    setStep('saving')
    sectionsCompletedRef.current = []

    const run = async () => {
      if (!supabase) return
      // Drain any earlier insert (shouldn't exist since we haven't started).
      if (pendingSaveRef.current) await pendingSaveRef.current.catch(() => {})

      if (sessionLogIdRef.current) {
        // Existing open row — shouldn't happen via UI, but finalize it in place.
        await supabase
          .from('session_logs')
          .update({
            skipped_as_known: true,
            completed_at: nowISO(),
            date: todayYMD(),
          })
          .eq('id', sessionLogIdRef.current)
      } else {
        const { data, error } = await supabase
          .from('session_logs')
          .insert({
            user_id: profileRef.current.id,
            day_number: profileRef.current.current_day,
            phase: profileRef.current.phase,
            date: todayYMD(),
            sections_completed: [],
            skipped_as_known: true,
            flagged_words: profileRef.current.flagged_words,
            completed_at: nowISO(),
          })
          .select()
          .single()
        if (error) throw new Error(error.message)
        sessionLogIdRef.current = (data as SessionLog).id
      }
    }

    pendingSaveRef.current = run()
    try {
      await pendingSaveRef.current
    } catch (runError) {
      setSaveError(runError instanceof Error ? runError.message : String(runError))
    }
  }, [step, profile.skip_known_enabled, isRevisionDay])

  // --- Final commit runs whenever we enter 'saving'.
  useEffect(() => {
    if (step !== 'saving') return
    let cancelled = false

    async function finalize() {
      setSaving(true)
      setSaveError(null)
      try {
        if (pendingSaveRef.current) await pendingSaveRef.current
        if (cancelled) return

        const completionDate = todayYMD()
        const snapshot = profileRef.current
        const nextStreak = computeStreak(
          {
            streak: snapshot.streak,
            streak_shields: snapshot.streak_shields,
            last_session_date: snapshot.last_session_date,
          },
          completionDate,
        )
        const mergedFlagged = dedupeStrings([...snapshot.flagged_words, ...flaggedRef.current])
        // Revision masters words: use local flaggedRef which was already pruned.
        const finalFlagged = isRevisionDay ? flaggedRef.current.slice() : mergedFlagged

        const finalProfile: UserProfile = {
          ...snapshot,
          current_day: snapshot.current_day + 1,
          streak: nextStreak.streak,
          streak_shields: nextStreak.streak_shields,
          last_session_date: nextStreak.last_session_date,
          flagged_words: finalFlagged,
        }

        if (supabase && sessionLogIdRef.current) {
          const { error: logError } = await supabase
            .from('session_logs')
            .update({
              completed_at: nowISO(),
              date: completionDate,
              difficulty_ratings: difficultyRatingsOf(snapshot),
              flagged_words: finalFlagged,
              sections_completed: sectionsCompletedRef.current,
            })
            .eq('id', sessionLogIdRef.current)
          if (logError) throw new Error(logError.message)
        }

        if (supabase) {
          const saved = await saveProfile(finalProfile)
          if (cancelled) return
          onProfileSavedRef.current(saved)
        } else {
          onProfileSavedRef.current(finalProfile)
        }

        if (cancelled) return
        setStep('complete')
        setSaving(false)
      } catch (finalizeError) {
        if (cancelled) return
        setSaveError(finalizeError instanceof Error ? finalizeError.message : String(finalizeError))
        setStep('error')
        setSaving(false)
      }
    }

    void finalize()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const retryCommit = useCallback(async () => {
    if (step !== 'error') return
    setSaveError(null)
    setStep('saving')
  }, [step])

  return {
    step,
    results,
    flaggedWords,
    skippedAsKnown,
    saving,
    saveError,
    canSkipKnown,
    hydrating,
    actions: { start, skipKnown, completeSection, completeRevision, retryCommit },
  }
}
