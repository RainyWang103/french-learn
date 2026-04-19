export const TABLES = {
  SESSION_LOGS: 'session_logs',
  PROFILES: 'profiles',
} as const

export type TableName = (typeof TABLES)[keyof typeof TABLES]
