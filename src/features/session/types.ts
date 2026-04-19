import type { SectionType } from '$lib/difficulty'
import type { DayContent } from '$types/curriculum'
import type { UserProfile } from '$types/profile'
import type { SessionStep } from '$session/constants'

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

export type SectionResults = Partial<Record<SectionType, SectionScore>>

export interface UseSessionResult {
  step: SessionStep
  results: SectionResults
  flaggedWords: string[]
  skippedAsKnown: boolean
  saving: boolean
  saveError: string | null
  canSkipKnown: boolean
  hydrating: boolean
  actions: UseSessionActions
}
