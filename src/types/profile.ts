export type Track = 'standard' | 'advanced'
export type Level = 'A1' | 'A2' | 'B1'
export type Phase = 1 | 2 | 3

export interface UserProfile {
  id: string
  display_name: string
  track: Track
  level: Level
  phase: Phase
  current_day: number
  starting_day: number
  word_count: number
  sessions_per_day: number
  playback_speed: number
  streak: number
  streak_shields: number
  last_session_date: string | null
  difficulty_vocab: number
  difficulty_grammar: number
  difficulty_listening: number
  difficulty_speaking: number
  difficulty_vocab_override: number | null
  difficulty_grammar_override: number | null
  difficulty_listening_override: number | null
  difficulty_speaking_override: number | null
  skip_known_enabled: boolean
  hide_pronunciation: boolean
  french_only_mode: boolean
  flagged_words: string[]
  created_at: string
  updated_at: string
}

export interface SessionLog {
  id: string
  user_id: string
  day_number: number
  phase: number
  date: string
  sections_completed: string[]
  skipped_as_known: boolean
  vocab_score: number | null
  vocab_total: number | null
  grammar_topic: string | null
  grammar_score: number | null
  grammar_total: number | null
  listening_score: number | null
  listening_total: number | null
  transcript: unknown | null
  difficulty_ratings: unknown | null
  flagged_words: string[]
  created_at: string
}
