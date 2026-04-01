import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const DB_CONNECTED = Boolean(supabaseUrl && supabaseAnonKey)

if (!DB_CONNECTED) {
  console.warn('Supabase env vars missing — database features disabled.')
}

export const supabase: SupabaseClient | null = DB_CONNECTED
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

export const DB_NOT_CONNECTED_MSG =
  'Database not connected yet — progress will not be saved.'
