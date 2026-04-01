import { describe, it, expect } from 'vitest'
import {
  updateDifficulty,
  difficultyLabel,
  getScaffolding,
  type VocabScaffolding,
  type GrammarScaffolding,
  type ListeningScaffolding,
  type SpeakingScaffolding,
} from './difficulty'

describe('updateDifficulty', () => {
  it('decreases by 0.3 when score is perfect', () => {
    expect(updateDifficulty(2.0, 5, 5)).toBeCloseTo(1.7)
  })

  it('does not change when score is good (80%+)', () => {
    expect(updateDifficulty(2.0, 4, 5)).toBe(2.0)
  })

  it('increases by 0.2 when score is ok (60–79%)', () => {
    expect(updateDifficulty(2.0, 3, 5)).toBeCloseTo(2.2)
  })

  it('increases by 0.5 when score is bad (<60%)', () => {
    expect(updateDifficulty(2.0, 1, 5)).toBeCloseTo(2.5)
  })

  it('does not exceed ceiling of 4.0', () => {
    expect(updateDifficulty(3.8, 0, 5)).toBe(4.0)
  })

  it('does not go below floor of 1.0', () => {
    expect(updateDifficulty(1.1, 5, 5)).toBe(1.0)
  })

  it('does not crash when score=0 and total=0', () => {
    expect(() => updateDifficulty(2.0, 0, 0)).not.toThrow()
  })

  it('returns current difficulty unchanged when total=0', () => {
    expect(updateDifficulty(2.5, 0, 0)).toBe(2.5)
  })
})

describe('difficultyLabel', () => {
  it('returns "Too easy" for value 1.0', () => {
    expect(difficultyLabel(1.0)).toBe('Too easy')
  })

  it('returns "Too easy" for value 1.3', () => {
    expect(difficultyLabel(1.3)).toBe('Too easy')
  })

  it('returns "Just right" for value 2.0', () => {
    expect(difficultyLabel(2.0)).toBe('Just right')
  })

  it('returns "Slightly too hard" for value 3.0', () => {
    expect(difficultyLabel(3.0)).toBe('Slightly too hard')
  })

  it('returns "Too hard" for value 4.0', () => {
    expect(difficultyLabel(4.0)).toBe('Too hard')
  })

  it('returns "Just right" at boundary value 1.5', () => {
    expect(difficultyLabel(1.5)).toBe('Just right')
  })

  it('returns "Slightly too hard" at boundary value 2.5', () => {
    expect(difficultyLabel(2.5)).toBe('Slightly too hard')
  })

  it('returns "Too hard" at boundary value 3.5', () => {
    expect(difficultyLabel(3.5)).toBe('Too hard')
  })
})

describe('getScaffolding', () => {
  describe('vocab section', () => {
    it('returns 10 words for difficulty 1.0 on standard track', () => {
      const cfg = getScaffolding('vocab', 1.0, 'standard') as VocabScaffolding
      expect(cfg.wordCount).toBe(10)
    })

    it('hides pronunciation for difficulty 1.0', () => {
      const cfg = getScaffolding('vocab', 1.0, 'standard') as VocabScaffolding
      expect(cfg.showPronunciation).toBe(false)
    })

    it('returns default 5 words for difficulty 2.0 on standard track', () => {
      const cfg = getScaffolding('vocab', 2.0, 'standard') as VocabScaffolding
      expect(cfg.wordCount).toBe(5)
    })

    it('returns default 7 words for difficulty 2.0 on advanced track', () => {
      const cfg = getScaffolding('vocab', 2.0, 'advanced') as VocabScaffolding
      expect(cfg.wordCount).toBe(7)
    })

    it('shows hints for difficulty 4.0', () => {
      const cfg = getScaffolding('vocab', 4.0, 'standard') as VocabScaffolding
      expect(cfg.showHints).toBe(true)
    })

    it('shows pronunciation for difficulty 4.0', () => {
      const cfg = getScaffolding('vocab', 4.0, 'standard') as VocabScaffolding
      expect(cfg.showPronunciation).toBe(true)
    })
  })

  describe('grammar section', () => {
    it('skips explanation for difficulty 1.0', () => {
      const cfg = getScaffolding('grammar', 1.0, 'standard') as GrammarScaffolding
      expect(cfg.showExplanation).toBe(false)
    })

    it('returns 8 drills for difficulty 1.0', () => {
      const cfg = getScaffolding('grammar', 1.0, 'standard') as GrammarScaffolding
      expect(cfg.drillCount).toBe(8)
    })

    it('shows explanation for difficulty 2.0', () => {
      const cfg = getScaffolding('grammar', 2.0, 'standard') as GrammarScaffolding
      expect(cfg.showExplanation).toBe(true)
    })

    it('returns 5 drills for difficulty 2.0', () => {
      const cfg = getScaffolding('grammar', 2.0, 'standard') as GrammarScaffolding
      expect(cfg.drillCount).toBe(5)
    })

    it('returns 3 drills for difficulty 4.0', () => {
      const cfg = getScaffolding('grammar', 4.0, 'standard') as GrammarScaffolding
      expect(cfg.drillCount).toBe(3)
    })

    it('shows worked examples for difficulty 4.0', () => {
      const cfg = getScaffolding('grammar', 4.0, 'standard') as GrammarScaffolding
      expect(cfg.showWorkedExamples).toBe(true)
    })
  })

  describe('listening section', () => {
    it('returns 1.0x speed for difficulty 1.0', () => {
      const cfg = getScaffolding('listening', 1.0, 'standard') as ListeningScaffolding
      expect(cfg.speed).toBe(1.0)
    })

    it('returns 5 questions for difficulty 1.0', () => {
      const cfg = getScaffolding('listening', 1.0, 'standard') as ListeningScaffolding
      expect(cfg.questionCount).toBe(5)
    })

    it('disallows replays for difficulty 1.0', () => {
      const cfg = getScaffolding('listening', 1.0, 'standard') as ListeningScaffolding
      expect(cfg.maxReplays).toBe(0)
    })

    it('returns 0.8x speed for difficulty 2.0', () => {
      const cfg = getScaffolding('listening', 2.0, 'standard') as ListeningScaffolding
      expect(cfg.speed).toBe(0.8)
    })

    it('allows 1 replay for difficulty 2.0', () => {
      const cfg = getScaffolding('listening', 2.0, 'standard') as ListeningScaffolding
      expect(cfg.maxReplays).toBe(1)
    })

    it('shows transcript upfront for difficulty 4.0', () => {
      const cfg = getScaffolding('listening', 4.0, 'standard') as ListeningScaffolding
      expect(cfg.showTranscriptUpfront).toBe(true)
    })

    it('allows unlimited replays (-1) for difficulty 4.0', () => {
      const cfg = getScaffolding('listening', 4.0, 'standard') as ListeningScaffolding
      expect(cfg.maxReplays).toBe(-1)
    })
  })

  describe('speaking section', () => {
    it('sets model answer to "on_request" for difficulty 1.0', () => {
      const cfg = getScaffolding('speaking', 1.0, 'standard') as SpeakingScaffolding
      expect(cfg.modelAnswerVisibility).toBe('on_request')
    })

    it('hides sentence starters for difficulty 1.0', () => {
      const cfg = getScaffolding('speaking', 1.0, 'standard') as SpeakingScaffolding
      expect(cfg.showSentenceStarters).toBe(false)
    })

    it('sets model answer to "after_attempt" for difficulty 2.0', () => {
      const cfg = getScaffolding('speaking', 2.0, 'standard') as SpeakingScaffolding
      expect(cfg.modelAnswerVisibility).toBe('after_attempt')
    })

    it('shows sentence starters for difficulty 4.0', () => {
      const cfg = getScaffolding('speaking', 4.0, 'standard') as SpeakingScaffolding
      expect(cfg.showSentenceStarters).toBe(true)
    })

    it('sets model answer to "upfront" for difficulty 4.0', () => {
      const cfg = getScaffolding('speaking', 4.0, 'standard') as SpeakingScaffolding
      expect(cfg.modelAnswerVisibility).toBe('upfront')
    })

    it('returns same speaking config for advanced track as standard', () => {
      const std = getScaffolding('speaking', 2.0, 'standard') as SpeakingScaffolding
      const adv = getScaffolding('speaking', 2.0, 'advanced') as SpeakingScaffolding
      expect(adv.modelAnswerVisibility).toBe(std.modelAnswerVisibility)
    })
  })
})
