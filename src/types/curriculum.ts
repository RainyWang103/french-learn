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

export interface ListenDialogueLine {
  0: 'A' | 'B'
  1: string
}

export interface ListenContent {
  d: ListenDialogueLine[]
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

export interface DayContent {
  day: number
  phase: number
  topic: string
  vocab: TrackContent<VocabWord[]>
  listen: TrackContent<ListenContent>
  grammar: TrackContent<GrammarContent>
  quiz: TrackContent<QuizQuestion[]>
  speak: TrackContent<SpeakContent>
}
