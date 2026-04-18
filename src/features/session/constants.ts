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
