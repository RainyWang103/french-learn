import { supabase } from '$lib/supabase'
import { TABLES } from '$lib/supabase/tables'
import type { SessionLog } from '$types/profile'

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }
  return supabase
}

export async function selectLatestInProgressByUser(userId: string): Promise<SessionLog | null> {
  const client = requireClient()
  const { data, error } = await client
    .from(TABLES.SESSION_LOGS)
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return (data as SessionLog | null) ?? null
}

export type SessionLogInsert = Partial<SessionLog> & {
  user_id: string
  day_number: number
  phase: number
  date: string
}

export async function insertSessionLog(row: SessionLogInsert): Promise<SessionLog> {
  const client = requireClient()
  const { data, error } = await client.from(TABLES.SESSION_LOGS).insert(row).select().single()
  if (error) {
    throw new Error(error.message)
  }
  return data as SessionLog
}

export async function updateSessionLogById(id: string, patch: Partial<SessionLog>): Promise<void> {
  const client = requireClient()
  const { error } = await client.from(TABLES.SESSION_LOGS).update(patch).eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
}
