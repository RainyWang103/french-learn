import { SectionType } from '$lib/difficulty'

export const VocabPhase = { CARDS: 'cards', QUIZ: 'quiz' } as const
export type VocabPhase = (typeof VocabPhase)[keyof typeof VocabPhase]

export const ListeningPhase = {
  LISTEN: 'listen',
  QUESTIONS: 'questions',
  TRANSCRIPT: 'transcript',
} as const
export type ListeningPhase = (typeof ListeningPhase)[keyof typeof ListeningPhase]

export const GrammarPhase = { LEARN: 'learn', DRILL: 'drill' } as const
export type GrammarPhase = (typeof GrammarPhase)[keyof typeof GrammarPhase]

export const SessionStep = {
  Loading: 'loading',
  Home: 'home',
  Vocab: 'vocab',
  Listening: 'listening',
  Grammar: 'grammar',
  Speaking: 'speaking',
  Revision: 'revision',
  Saving: 'saving',
  Complete: 'complete',
  Error: 'error',
} as const

export type SessionStep = (typeof SessionStep)[keyof typeof SessionStep]

export const SessionSectionKey = {
  ...SectionType,
  Revision: 'revision',
} as const

export type SessionSectionKey = (typeof SessionSectionKey)[keyof typeof SessionSectionKey]

export const SECTION_ORDER: readonly SectionType[] = [
  SectionType.Vocab,
  SectionType.Listening,
  SectionType.Grammar,
  SectionType.Speaking,
] as const
