export type PartOfSpeech = 'verb' | 'noun' | 'adjective' | 'adverb' | 'expression'
export type Gender = 'm' | 'f' | null

export interface VocabWord {
  w: string
  t: PartOfSpeech
  g: Gender
  pr: string
  m: string
  n?: string
  cj?: Record<string, string>
  ex: [string, string][]
  sp: string
}

export type DialogueLine = ['A' | 'B', string]

export interface ListenContent {
  d: DialogueLine[]
  qs: string[]
  sum: string
}

export interface GrammarContent {
  title: string
  exp: string
  exs: [string, string][]
  drills: string[]
}

export type QuizType = 'mc' | 'f'

export interface QuizQuestion {
  t: QuizType
  q: string
  o?: string[]
  c: string
  e: string
  tw?: string
}

export interface SpeakContent {
  sc: string
  pr: string[]
  ma: string
  mae: string
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
