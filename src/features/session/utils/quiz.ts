import type { QuizQuestion, ListeningQuestion, GrammarDrillItem } from '$types/curriculum'

// ── Shared question shape consumed by QuizItem ──────────────────────────────

export interface DrillQuestion {
  type: 'multipleChoice' | 'fillInTheBlank'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}

// ── Text normalisation ───────────────────────────────────────────────────────

/**
 * Strips diacritics, lowercases, trims, and collapses whitespace so that
 * French answers with/without accents compare equal.
 */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
}

/** Returns true when user input matches the correct answer after normalisation. */
export function checkAnswer(input: string, correct: string): boolean {
  return normalise(input) === normalise(correct)
}

// ── Answers record helpers ───────────────────────────────────────────────────

/** Number of questions the user has responded to (correct or wrong). */
export function countAnswered(answers: Record<number, boolean>): number {
  return Object.keys(answers).length
}

/** Number of correct answers in the answers record. */
export function countCorrect(answers: Record<number, boolean>): number {
  return Object.values(answers).filter(Boolean).length
}

// ── Progress ─────────────────────────────────────────────────────────────────

/** Returns a percentage 0–100, safe against zero total. */
export function progressPercent(current: number, total: number): number {
  if (total <= 0) return 0
  return (current / total) * 100
}

// ── Flagged word extraction ──────────────────────────────────────────────────

/**
 * Returns the targetWord for every question that was answered incorrectly
 * and has a targetWord field set.
 */
export function extractFlaggedWords(
  questions: QuizQuestion[],
  answers: Record<number, boolean>,
): string[] {
  return questions.filter((q, i) => !answers[i] && q.targetWord).map((q) => q.targetWord as string)
}

// ── Question adapters ────────────────────────────────────────────────────────

/** Adapt a curriculum QuizQuestion to the internal DrillQuestion shape. */
export function quizQuestionToDrill(q: QuizQuestion): DrillQuestion {
  return {
    type: q.type,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }
}

/** Adapt a ListeningQuestion (always MC, no explanation) to DrillQuestion. */
export function listeningQuestionToDrill(q: ListeningQuestion): DrillQuestion {
  return {
    type: 'multipleChoice',
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }
}

/** Adapt a GrammarDrillItem to the internal DrillQuestion shape. */
export function grammarDrillItemToDrill(d: GrammarDrillItem): DrillQuestion {
  return {
    type: d.type,
    question: d.question,
    options: d.options,
    correctAnswer: d.correctAnswer,
    explanation: d.explanation,
  }
}
