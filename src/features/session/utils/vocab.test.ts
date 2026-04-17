import { describe, it, expect } from 'vitest'
import { genderLabel } from './vocab'

describe('genderLabel', () => {
  it('returns "masc." for male gender', () => {
    expect(genderLabel('male')).toBe('masc.')
  })

  it('returns "fém." for female gender', () => {
    expect(genderLabel('female')).toBe('fém.')
  })

  it('returns null for null gender', () => {
    expect(genderLabel(null)).toBeNull()
  })
})
