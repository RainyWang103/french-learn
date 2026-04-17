import { describe, it, expect } from 'vitest'
import { computeLineDuration } from './dialogue'

describe('computeLineDuration', () => {
  it('returns minimum 2400ms for very short text', () => {
    expect(computeLineDuration('')).toBe(2400)
    expect(computeLineDuration('Hi')).toBe(2400)
  })

  it('returns 2400ms for text up to 32 characters', () => {
    const text32 = 'a'.repeat(32)
    expect(computeLineDuration(text32)).toBe(2400)
  })

  it('scales by 75ms per character for longer text', () => {
    const text = 'a'.repeat(40)
    expect(computeLineDuration(text)).toBe(40 * 75)
  })

  it('crossover point is at 32 characters', () => {
    expect(computeLineDuration('a'.repeat(31))).toBe(2400)
    expect(computeLineDuration('a'.repeat(33))).toBe(33 * 75)
  })

  it('handles a typical French sentence', () => {
    const sentence = 'Bonjour, comment allez-vous ?'
    const expected = Math.max(2400, sentence.length * 75)
    expect(computeLineDuration(sentence)).toBe(expected)
  })
})
