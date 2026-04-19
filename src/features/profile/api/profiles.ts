import { DB_NOT_CONNECTED_MSG, supabase } from '$lib/supabase'
import { selectProfileById, upsertProfile } from '$lib/supabase/profiles'
import type { UserProfile } from '$types/profile'

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) {
    throw new Error(DB_NOT_CONNECTED_MSG)
  }
  return await selectProfileById(userId)
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  if (!supabase) {
    throw new Error(DB_NOT_CONNECTED_MSG)
  }
  const next: UserProfile = { ...profile, updated_at: new Date(Date.now()).toISOString() }
  return await upsertProfile(next)
}
