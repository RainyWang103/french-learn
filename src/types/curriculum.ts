export type PartOfSpeech = 'verb' | 'noun' | 'adjective' | 'adverb' | 'expression'
export type Gender = 'm' | 'f' | null

export interface VocabWord {
  word: string
  partOfSpeech: PartOfSpeech
  gender: Gender
  pronunciation: string
  meaning: string
  notes?: string
  conjugation?: Record<string, string>
  examples: [string, string][]
  special: string
}

export type DialogueLine = ['A' | 'B', string]

export interface ListenContent {
  dialogue: DialogueLine[]
  questions: string[]
  summary: string
}

export interface GrammarContent {
  title: string
  explanation: string
  examples: [string, string][]
  drills: string[]
}

export type QuizType = 'mc' | 'f'

export interface QuizQuestion {
  type: QuizType
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  targetWord?: string
}

export interface SpeakContent {
  scenario: string
  keyPhrases: string[]
  modelAnswer: string
  modelAnswerExplanation: string
  tip?: string
}

export interface TrackContent<T> {
  standard: T
  advanced: T
}

export type VocabSection = TrackContent<VocabWord[]>
export type ListenSection = TrackContent<ListenContent>
export type GrammarSection = TrackContent<GrammarContent>
export type SpeakSection = TrackContent<SpeakContent>

export interface DayContent {
  day: number
  phase: number
  topic: string
  vocab: VocabSection
  listen: ListenSection
  grammar: GrammarSection
  quiz: TrackContent<QuizQuestion[]>
  speak: SpeakSection
}

export interface RevisionDay {
  day: number
  phase: number
  isRevision: true
}

export type DayData = DayContent | RevisionDay
