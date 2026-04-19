import { supabase } from '$lib/supabase'
import {
  insertSessionLog,
  selectLatestInProgressByUser,
  updateSessionLogById,
  type SessionLogInsert,
} from '$lib/supabase/sessionLogs'
import type { SessionLog } from '$types/profile'

export async function fetchInProgressLog(userId: string): Promise<SessionLog | null> {
  if (!supabase) {
    return null
  }
  return await selectLatestInProgressByUser(userId)
}

export type InsertInProgressLogInput = {
  userId: string
  dayNumber: number
  phase: number
  dateYMD: string
  flaggedWords?: string[]
}

export async function insertInProgressLog(
  input: InsertInProgressLogInput,
): Promise<SessionLog | null> {
  if (!supabase) {
    return null
  }
  const row: SessionLogInsert = {
    user_id: input.userId,
    day_number: input.dayNumber,
    phase: input.phase,
    date: input.dateYMD,
    sections_completed: [],
    skipped_as_known: false,
    flagged_words: input.flaggedWords ?? [],
    completed_at: null,
  }
  return await insertSessionLog(row)
}

export type InsertSkippedLogInput = {
  userId: string
  dayNumber: number
  phase: number
  dateYMD: string
  nowISO: string
  flaggedWords: string[]
}

export async function insertSkippedLog(input: InsertSkippedLogInput): Promise<SessionLog | null> {
  if (!supabase) {
    return null
  }
  const row: SessionLogInsert = {
    user_id: input.userId,
    day_number: input.dayNumber,
    phase: input.phase,
    date: input.dateYMD,
    sections_completed: [],
    skipped_as_known: true,
    flagged_words: input.flaggedWords,
    completed_at: input.nowISO,
  }
  return await insertSessionLog(row)
}

export async function patchLog(id: string, patch: Partial<SessionLog>): Promise<void> {
  if (!supabase) {
    return
  }
  await updateSessionLogById(id, patch)
}

export async function markLogAbandoned(id: string, nowISO: string): Promise<void> {
  if (!supabase) {
    return
  }
  await updateSessionLogById(id, { completed_at: nowISO })
}
