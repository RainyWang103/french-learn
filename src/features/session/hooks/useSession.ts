import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionType, updateDifficulty } from '$lib/difficulty'
import { supabase } from '$lib/supabase'
import type { DayContent } from '$types/curriculum'
import type { SessionLog, Track, UserProfile } from '$types/profile'
import { saveProfile } from '$features/profile/api/profiles'
import {
  fetchInProgressLog,
  insertInProgressLog,
  insertSkippedLog,
  markLogAbandoned,
  patchLog,
} from '$session/api/sessionLogs'
import { SECTION_ORDER, SessionStep } from '$session/constants'
import type {
  CompleteSectionResult,
  SectionResults,
  UseSessionActions,
  UseSessionArgs,
  UseSessionResult,
} from '$session/types'
import { computeStreak } from '$session/utils/streak'

export type { SessionStep } from '$session/constants'
export type { SectionScore, CompleteSectionResult } from '$session/types'

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
    if (!sectionsCompleted.includes(section)) {
      return section as SessionStep
    }
  }
  return SessionStep.Saving
}

function resultsFromRow(row: SessionLog): SectionResults {
  const out: SectionResults = {}
  if (row.vocab_score != null && row.vocab_total != null) {
    out[SectionType.Vocab] = { score: row.vocab_score, total: row.vocab_total }
  }
  if (row.listening_score != null && row.listening_total != null) {
    out[SectionType.Listening] = { score: row.listening_score, total: row.listening_total }
  }
  if (row.grammar_score != null && row.grammar_total != null) {
    out[SectionType.Grammar] = { score: row.grammar_score, total: row.grammar_total }
  }
  if (row.sections_completed.includes(SectionType.Speaking)) {
    out[SectionType.Speaking] = { score: 0, total: 0 }
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

function sectionPatchFor(
  section: SectionType,
  score: number,
  total: number,
  dayContent: DayContent | null,
  track: Track,
): Partial<SessionLog> {
  if (section === SectionType.Vocab) {
    return { vocab_score: score, vocab_total: total }
  }
  if (section === SectionType.Listening) {
    return { listening_score: score, listening_total: total }
  }
  if (section === SectionType.Grammar) {
    return {
      grammar_score: score,
      grammar_total: total,
      grammar_topic: grammarTopicFor(dayContent, track),
    }
  }
  return {}
}

export function useSession({
  profile,
  dayContent,
  isRevisionDay,
  onProfileSaved,
}: UseSessionArgs): UseSessionResult {
  const [step, setStep] = useState<SessionStep>(SessionStep.Loading)
  const [results, setResults] = useState<SectionResults>({})
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
        if (cancelled) {
          return
        }
        setStep(SessionStep.Home)
        setFlaggedWords(profileRef.current.flagged_words.slice())
        setHydrating(false)
      }

      try {
        const row = await fetchInProgressLog(profile.id)
        if (cancelled) {
          return
        }
        if (!row) {
          fallbackHome()
          return
        }

        if (row.date !== todayYMD()) {
          await markLogAbandoned(row.id, nowISO())
          if (cancelled) {
            return
          }
          fallbackHome()
          return
        }

        sessionLogIdRef.current = row.id
        sectionsCompletedRef.current = row.sections_completed.slice()
        setResults(resultsFromRow(row))
        setFlaggedWords(row.flagged_words ?? [])
        setSkippedAsKnown(row.skipped_as_known)
        setStep(isRevisionDay ? SessionStep.Revision : stepForFirstMissing(row.sections_completed))
        setHydrating(false)
      } catch (hydrateError) {
        if (cancelled) {
          return
        }
        setSaveError(hydrateError instanceof Error ? hydrateError.message : String(hydrateError))
        fallbackHome()
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [profile.id, isRevisionDay])

  const isOnHome = step === SessionStep.Home
  const noSectionCompletedYet = Object.keys(results).length === 0
  const skipKnownAllowed = profile.skip_known_enabled && !isRevisionDay
  const canSkipKnown = !hydrating && isOnHome && skipKnownAllowed && noSectionCompletedYet

  // --- start: enter the first section and open a session_logs row.
  const start = useCallback(() => {
    if (step !== SessionStep.Home) {
      return
    }
    setStep(isRevisionDay ? SessionStep.Revision : SessionStep.Vocab)

    if (sessionLogIdRef.current) {
      return
    }

    const insertPromise = insertInProgressLog({
      userId: profileRef.current.id,
      dayNumber: profileRef.current.current_day,
      phase: profileRef.current.phase,
      dateYMD: todayYMD(),
    })
      .then((row) => {
        if (row) {
          sessionLogIdRef.current = row.id
        }
      })
      .catch((err: unknown) => {
        setSaveError(err instanceof Error ? err.message : String(err))
      })

    pendingSaveRef.current = insertPromise
  }, [step, isRevisionDay])

  // --- completeSection: non-blocking incremental save + advance.
  const completeSection = useCallback(
    async (section: SectionType, result: CompleteSectionResult) => {
      const newFlagged = result.flaggedWords ?? []
      setResults((prev) => ({ ...prev, [section]: { score: result.score, total: result.total } }))
      setFlaggedWords((prev) => dedupeStrings([...prev, ...newFlagged]))

      const idx = SECTION_ORDER.indexOf(section)
      const isLastSection = idx < 0 || idx === SECTION_ORDER.length - 1
      const nextStep: SessionStep = isLastSection
        ? SessionStep.Saving
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

        let logWritePromise: Promise<void> = Promise.resolve()
        const logId = sessionLogIdRef.current
        if (logId) {
          const sectionPatch = sectionPatchFor(
            section,
            result.score,
            result.total,
            dayContentRef.current,
            snapshot.track,
          )
          const patch: Partial<SessionLog> = {
            ...sectionPatch,
            sections_completed: sectionsCompletedRef.current,
            flagged_words: mergedFlagged,
          }
          logWritePromise = patchLog(logId, patch)
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
    sectionsCompletedRef.current = dedupeStrings([
      ...sectionsCompletedRef.current,
      SessionStep.Revision,
    ])
    setStep(SessionStep.Saving)
  }, [])

  // --- skipKnown: one-shot finalize with skipped=true.
  const skipKnown = useCallback(async () => {
    if (step !== SessionStep.Home) {
      return
    }
    if (!profile.skip_known_enabled || isRevisionDay) {
      return
    }

    setSkippedAsKnown(true)
    setStep(SessionStep.Saving)
    sectionsCompletedRef.current = []

    const run = async () => {
      if (pendingSaveRef.current) {
        await pendingSaveRef.current.catch(() => {})
      }

      if (sessionLogIdRef.current) {
        await patchLog(sessionLogIdRef.current, {
          skipped_as_known: true,
          completed_at: nowISO(),
          date: todayYMD(),
        })
        return
      }

      const row = await insertSkippedLog({
        userId: profileRef.current.id,
        dayNumber: profileRef.current.current_day,
        phase: profileRef.current.phase,
        dateYMD: todayYMD(),
        nowISO: nowISO(),
        flaggedWords: profileRef.current.flagged_words,
      })
      if (row) {
        sessionLogIdRef.current = row.id
      }
    }

    const runPromise = run()
    pendingSaveRef.current = runPromise
    try {
      await runPromise
    } catch (runError) {
      setSaveError(runError instanceof Error ? runError.message : String(runError))
    }
  }, [step, profile.skip_known_enabled, isRevisionDay])

  // --- Final commit runs whenever we enter 'saving'.
  useEffect(() => {
    if (step !== SessionStep.Saving) {
      return
    }
    let cancelled = false

    async function finalize() {
      setSaving(true)
      setSaveError(null)
      try {
        if (pendingSaveRef.current) {
          await pendingSaveRef.current
        }
        if (cancelled) {
          return
        }

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
        // Revision masters words: flaggedRef is already pruned.
        const finalFlagged = isRevisionDay ? flaggedRef.current.slice() : mergedFlagged

        const finalProfile: UserProfile = {
          ...snapshot,
          current_day: snapshot.current_day + 1,
          streak: nextStreak.streak,
          streak_shields: nextStreak.streak_shields,
          last_session_date: nextStreak.last_session_date,
          flagged_words: finalFlagged,
        }

        const logId = sessionLogIdRef.current
        if (logId) {
          await patchLog(logId, {
            completed_at: nowISO(),
            date: completionDate,
            difficulty_ratings: difficultyRatingsOf(snapshot),
            flagged_words: finalFlagged,
            sections_completed: sectionsCompletedRef.current,
          })
        }

        if (supabase) {
          const saved = await saveProfile(finalProfile)
          if (cancelled) {
            return
          }
          onProfileSavedRef.current(saved)
        } else {
          onProfileSavedRef.current(finalProfile)
        }

        if (cancelled) {
          return
        }
        setStep(SessionStep.Complete)
        setSaving(false)
      } catch (finalizeError) {
        if (cancelled) {
          return
        }
        setSaveError(finalizeError instanceof Error ? finalizeError.message : String(finalizeError))
        setStep(SessionStep.Error)
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
    if (step !== SessionStep.Error) {
      return
    }
    setSaveError(null)
    setStep(SessionStep.Saving)
  }, [step])

  const actions: UseSessionActions = {
    start,
    skipKnown,
    completeSection,
    completeRevision,
    retryCommit,
  }

  return {
    step,
    results,
    flaggedWords,
    skippedAsKnown,
    saving,
    saveError,
    canSkipKnown,
    hydrating,
    actions,
  }
}
