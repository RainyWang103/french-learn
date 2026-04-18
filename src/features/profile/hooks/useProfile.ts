import { useCallback, useEffect, useState } from 'react'
import { DB_NOT_CONNECTED_MSG, supabase } from '$lib/supabase'
import type { SectionType } from '$lib/difficulty'
import type { Track, UserProfile } from '$features/profile/types'
import { useAuth } from '$features/auth/hooks/useAuth'

export interface CreateDefaultProfileOptions {
  track?: Track
  startingDay?: number
}

export function createDefaultProfile(
  userId: string,
  displayName: string,
  options: CreateDefaultProfileOptions = {},
): UserProfile {
  const track: Track = options.track ?? 'standard'
  const startingDay = options.startingDay ?? 1
  const isAdvanced = track === 'advanced'
  const now = new Date().toISOString()

  return {
    id: userId,
    display_name: displayName,
    track,
    level: 'A1',
    phase: 1,
    current_day: startingDay,
    starting_day: startingDay,
    word_count: isAdvanced ? 7 : 5,
    sessions_per_day: 1,
    playback_speed: isAdvanced ? 0.9 : 0.7,
    streak: 0,
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
    skip_known_enabled: isAdvanced,
    hide_pronunciation: isAdvanced,
    french_only_mode: false,
    flagged_words: [],
    created_at: now,
    updated_at: now,
  }
}

export function getEffectiveDifficulty(profile: UserProfile, section: SectionType): number {
  const auto = profile[`difficulty_${section}`]
  const override = profile[`difficulty_${section}_override`]
  return override ?? auto
}

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) throw new Error(DB_NOT_CONNECTED_MSG)
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as UserProfile | null) ?? null
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  if (!supabase) throw new Error(DB_NOT_CONNECTED_MSG)
  const next = { ...profile, updated_at: new Date().toISOString() }
  const { data, error } = await supabase
    .from('profiles')
    .upsert(next, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as UserProfile
}

export interface UseProfileResult {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  saveProfile: (next: UserProfile) => Promise<void>
  createProfile: (displayName: string, options?: CreateDefaultProfileOptions) => Promise<void>
  resetDifficultyOverride: (section: SectionType) => Promise<void>
  refresh: () => Promise<void>
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase) {
      setProfile(null)
      setLoading(false)
      setError(DB_NOT_CONNECTED_MSG)
      return
    }
    if (!user) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const loaded = await loadProfile(user.id)
      setProfile(loaded)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(async (next: UserProfile) => {
    setError(null)
    try {
      const saved = await saveProfile(next)
      setProfile(saved)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
      throw saveError
    }
  }, [])

  const createProfile = useCallback(
    async (displayName: string, options: CreateDefaultProfileOptions = {}) => {
      if (!user) throw new Error('Cannot create profile: no authenticated user')
      const draft = createDefaultProfile(user.id, displayName, options)
      await save(draft)
    },
    [user, save],
  )

  const resetDifficultyOverride = useCallback(
    async (section: SectionType) => {
      if (!profile) throw new Error('Cannot reset difficulty: no profile loaded')
      const next: UserProfile = { ...profile, [`difficulty_${section}_override`]: null }
      await save(next)
    },
    [profile, save],
  )

  return {
    profile,
    loading,
    error,
    saveProfile: save,
    createProfile,
    resetDifficultyOverride,
    refresh,
  }
}
