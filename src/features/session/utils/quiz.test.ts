import { describe, it, expect } from 'vitest'
import {
  normalise,
  checkAnswer,
  countAnswered,
  countCorrect,
  progressPercent,
  extractFlaggedWords,
  quizQuestionToDrill,
  listeningQuestionToDrill,
  grammarDrillItemToDrill,
} from '$session/utils/quiz'
import type { QuizQuestion, ListeningQuestion, GrammarDrillItem } from '$types/curriculum'

describe('normalise', () => {
  it('lowercases input', () => {
    expect(normalise('Bonjour')).toBe('bonjour')
  })

  it('strips diacritics', () => {
    expect(normalise('café')).toBe('cafe')
    expect(normalise('être')).toBe('etre')
    expect(normalise('naïve')).toBe('naive')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalise('  bonjour  ')).toBe('bonjour')
  })

  it('collapses multiple spaces into one', () => {
    expect(normalise('je  suis   là')).toBe('je suis la')
  })

  it('normalises curly apostrophes to straight ones', () => {
    expect(normalise('c\u2019est')).toBe("c'est")
    expect(normalise('l\u2018ami')).toBe("l'ami")
  })

  it('handles empty string', () => {
    expect(normalise('')).toBe('')
  })
})

describe('checkAnswer', () => {
  it('returns true for exact match', () => {
    expect(checkAnswer('bonjour', 'bonjour')).toBe(true)
  })

  it('returns true when accents differ', () => {
    expect(checkAnswer('cafe', 'café')).toBe(true)
    expect(checkAnswer('etre', 'être')).toBe(true)
  })

  it('returns true regardless of casing', () => {
    expect(checkAnswer('Bonjour', 'bonjour')).toBe(true)
  })

  it('returns true with extra surrounding spaces', () => {
    expect(checkAnswer('  merci  ', 'merci')).toBe(true)
  })

  it('returns false for wrong answer', () => {
    expect(checkAnswer('bonsoir', 'bonjour')).toBe(false)
  })

  it('returns false for empty input against non-empty correct', () => {
    expect(checkAnswer('', 'bonjour')).toBe(false)
  })
})

describe('countAnswered', () => {
  it('returns 0 for empty record', () => {
    expect(countAnswered({})).toBe(0)
  })

  it('counts all keys regardless of value', () => {
    expect(countAnswered({ 0: true, 1: false, 2: true })).toBe(3)
  })
})

describe('countCorrect', () => {
  it('returns 0 for empty record', () => {
    expect(countCorrect({})).toBe(0)
  })

  it('counts only truthy values', () => {
    expect(countCorrect({ 0: true, 1: false, 2: true })).toBe(2)
  })

  it('returns 0 when all wrong', () => {
    expect(countCorrect({ 0: false, 1: false })).toBe(0)
  })
})

describe('progressPercent', () => {
  it('returns 0 when total is 0', () => {
    expect(progressPercent(0, 0)).toBe(0)
  })

  it('returns 0 when current is 0', () => {
    expect(progressPercent(0, 5)).toBe(0)
  })

  it('returns 100 when current equals total', () => {
    expect(progressPercent(5, 5)).toBe(100)
  })

  it('returns correct percentage', () => {
    expect(progressPercent(1, 4)).toBe(25)
    expect(progressPercent(3, 4)).toBe(75)
  })

  it('returns 0 for negative total', () => {
    expect(progressPercent(1, -1)).toBe(0)
  })
})

describe('extractFlaggedWords', () => {
  const questions: QuizQuestion[] = [
    {
      type: 'multipleChoice',
      question: 'Q1',
      options: ['a'],
      correctAnswer: 'a',
      explanation: '',
      targetWord: 'manger',
    },
    {
      type: 'multipleChoice',
      question: 'Q2',
      options: ['b'],
      correctAnswer: 'b',
      explanation: '',
      targetWord: 'boire',
    },
    { type: 'fillInTheBlank', question: 'Q3', correctAnswer: 'c', explanation: '' },
  ]

  it('returns empty array when all correct', () => {
    expect(extractFlaggedWords(questions, { 0: true, 1: true, 2: true })).toEqual([])
  })

  it('returns targetWord for incorrect answers with targetWord', () => {
    expect(extractFlaggedWords(questions, { 0: false, 1: true, 2: false })).toEqual(['manger'])
  })

  it('ignores wrong answers without targetWord', () => {
    expect(extractFlaggedWords(questions, { 0: true, 1: false, 2: false })).toEqual(['boire'])
  })

  it('returns all targetWords when answers record is empty (unanswered = wrong)', () => {
    expect(extractFlaggedWords(questions, {})).toEqual(['manger', 'boire'])
  })
})

describe('quizQuestionToDrill', () => {
  const q: QuizQuestion = {
    type: 'multipleChoice',
    question: 'What is bonjour?',
    options: ['Hello', 'Goodbye'],
    correctAnswer: 'Hello',
    explanation: 'Bonjour means hello.',
    targetWord: 'bonjour',
  }

  it('maps all fields correctly', () => {
    const drill = quizQuestionToDrill(q)
    expect(drill.type).toBe('multipleChoice')
    expect(drill.question).toBe('What is bonjour?')
    expect(drill.options).toEqual(['Hello', 'Goodbye'])
    expect(drill.correctAnswer).toBe('Hello')
    expect(drill.explanation).toBe('Bonjour means hello.')
  })
})

describe('listeningQuestionToDrill', () => {
  const q: ListeningQuestion = {
    question: 'Où va Marie ?',
    options: ['Au marché', 'À la plage'],
    correctAnswer: 'Au marché',
  }

  it('always sets type to multipleChoice', () => {
    const drill = listeningQuestionToDrill(q)
    expect(drill.type).toBe('multipleChoice')
  })

  it('maps question, options, and correctAnswer', () => {
    const drill = listeningQuestionToDrill(q)
    expect(drill.question).toBe('Où va Marie ?')
    expect(drill.options).toEqual(['Au marché', 'À la plage'])
    expect(drill.correctAnswer).toBe('Au marché')
  })

  it('has no explanation', () => {
    const drill = listeningQuestionToDrill(q)
    expect(drill.explanation).toBeUndefined()
  })
})

describe('grammarDrillItemToDrill', () => {
  const d: GrammarDrillItem = {
    type: 'fillInTheBlank',
    question: 'Complete: je ___ (manger)',
    correctAnswer: 'mange',
    explanation: 'First person singular of manger is mange.',
  }

  it('maps all fields correctly', () => {
    const drill = grammarDrillItemToDrill(d)
    expect(drill.type).toBe('fillInTheBlank')
    expect(drill.question).toBe('Complete: je ___ (manger)')
    expect(drill.correctAnswer).toBe('mange')
    expect(drill.explanation).toBe('First person singular of manger is mange.')
  })

  it('passes through optional options', () => {
    const withOptions: GrammarDrillItem = {
      ...d,
      type: 'multipleChoice',
      options: ['mange', 'manges'],
    }
    expect(grammarDrillItemToDrill(withOptions).options).toEqual(['mange', 'manges'])
  })
})
