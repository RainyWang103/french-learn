import { supabase } from '$lib/supabase'
import { TABLES } from '$lib/supabase/tables'
import type { UserProfile } from '$types/profile'

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }
  return supabase
}

export async function selectProfileById(userId: string): Promise<UserProfile | null> {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLES.PROFILES)
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return (data as UserProfile | null) ?? null
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLES.PROFILES)
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data as UserProfile
}
