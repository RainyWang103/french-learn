import type { Track } from '@/types/profile'

export type SectionType = 'vocab' | 'grammar' | 'listening' | 'speaking'

export interface VocabScaffolding {
  wordCount: number
  showPronunciation: boolean
  showHints: boolean
  quizDifficulty: 'easy' | 'normal' | 'hard'
}

export interface GrammarScaffolding {
  showExplanation: boolean
  drillCount: number
  drillDifficulty: 'easy' | 'standard' | 'hard'
  showWorkedExamples: boolean
}

export interface ListeningScaffolding {
  speed: number
  questionCount: number
  /** Number of replays allowed. -1 = unlimited. */
  maxReplays: number
  showTranscriptUpfront: boolean
}

export interface SpeakingScaffolding {
  modelAnswerVisibility: 'on_request' | 'after_attempt' | 'upfront'
  showSentenceStarters: boolean
}

export type ScaffoldingConfig =
  | VocabScaffolding
  | GrammarScaffolding
  | ListeningScaffolding
  | SpeakingScaffolding

/**
 * Adjust difficulty after a scored section.
 * Returns value clamped to [1.0, 4.0].
 */
export function updateDifficulty(current: number, score: number, total: number): number {
  if (total === 0) return current
  const ratio = score / total
  if (ratio === 1.0) return Math.max(1, current - 0.3)
  if (ratio >= 0.8) return current
  if (ratio >= 0.6) return Math.min(4, current + 0.2)
  return Math.min(4, current + 0.5)
}

/** Human-readable label for a difficulty value. */
export function difficultyLabel(value: number): string {
  if (value < 1.5) return 'Too easy'
  if (value < 2.5) return 'Just right'
  if (value < 3.5) return 'Slightly too hard'
  return 'Too hard'
}

function band(difficulty: number): 1 | 2 | 3 | 4 {
  if (difficulty < 1.5) return 1
  if (difficulty < 2.5) return 2
  if (difficulty < 3.5) return 3
  return 4
}

function vocabScaffolding(difficulty: number, track: Track): VocabScaffolding {
  const defaultWords = track === 'advanced' ? 7 : 5
  switch (band(difficulty)) {
    case 1:
      return { wordCount: 10, showPronunciation: false, showHints: false, quizDifficulty: 'hard' }
    case 2:
      return {
        wordCount: defaultWords,
        showPronunciation: true,
        showHints: false,
        quizDifficulty: 'normal',
      }
    case 3:
      return {
        wordCount: defaultWords - 1,
        showPronunciation: true,
        showHints: true,
        quizDifficulty: 'easy',
      }
    case 4:
      return {
        wordCount: Math.max(3, defaultWords - 2),
        showPronunciation: true,
        showHints: true,
        quizDifficulty: 'easy',
      }
  }
}

function grammarScaffolding(difficulty: number): GrammarScaffolding {
  switch (band(difficulty)) {
    case 1:
      return {
        showExplanation: false,
        drillCount: 8,
        drillDifficulty: 'hard',
        showWorkedExamples: false,
      }
    case 2:
      return {
        showExplanation: true,
        drillCount: 5,
        drillDifficulty: 'standard',
        showWorkedExamples: false,
      }
    case 3:
      return {
        showExplanation: true,
        drillCount: 4,
        drillDifficulty: 'easy',
        showWorkedExamples: true,
      }
    case 4:
      return {
        showExplanation: true,
        drillCount: 3,
        drillDifficulty: 'easy',
        showWorkedExamples: true,
      }
  }
}

function listeningScaffolding(difficulty: number): ListeningScaffolding {
  switch (band(difficulty)) {
    case 1:
      return { speed: 1.0, questionCount: 5, maxReplays: 0, showTranscriptUpfront: false }
    case 2:
      return { speed: 0.8, questionCount: 3, maxReplays: 1, showTranscriptUpfront: false }
    case 3:
      return { speed: 0.6, questionCount: 2, maxReplays: -1, showTranscriptUpfront: false }
    case 4:
      return { speed: 0.6, questionCount: 2, maxReplays: -1, showTranscriptUpfront: true }
  }
}

function speakingScaffolding(difficulty: number): SpeakingScaffolding {
  switch (band(difficulty)) {
    case 1:
      return { modelAnswerVisibility: 'on_request', showSentenceStarters: false }
    case 2:
      return { modelAnswerVisibility: 'after_attempt', showSentenceStarters: false }
    case 3:
      return { modelAnswerVisibility: 'after_attempt', showSentenceStarters: true }
    case 4:
      return { modelAnswerVisibility: 'upfront', showSentenceStarters: true }
  }
}

export function getScaffolding(section: 'vocab', difficulty: number, track: Track): VocabScaffolding
export function getScaffolding(
  section: 'grammar',
  difficulty: number,
  track: Track,
): GrammarScaffolding
export function getScaffolding(
  section: 'listening',
  difficulty: number,
  track: Track,
): ListeningScaffolding
export function getScaffolding(
  section: 'speaking',
  difficulty: number,
  track: Track,
): SpeakingScaffolding
export function getScaffolding(
  section: SectionType,
  difficulty: number,
  track: Track,
): ScaffoldingConfig {
  switch (section) {
    case 'vocab':
      return vocabScaffolding(difficulty, track)
    case 'grammar':
      return grammarScaffolding(difficulty)
    case 'listening':
      return listeningScaffolding(difficulty)
    case 'speaking':
      return speakingScaffolding(difficulty)
  }
}
