import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const CURRICULUM_DIR = resolve(__dirname, '../public/curriculum')

const VALID_PARTS_OF_SPEECH = ['verb', 'noun', 'adjective', 'adverb', 'expression']
const VALID_GENDERS = ['male', 'female', null]
const VALID_QUIZ_TYPES = ['multipleChoice', 'fillInTheBlank']
const VALID_DIALOGUE_SPEAKERS = ['A', 'B']
const VALID_DRILL_TYPES = ['multipleChoice', 'fillInTheBlank']

/** Collect every phase folder and its day JSON files. */
function getCurriculumFiles(): { phase: string; file: string; path: string }[] {
  const results: { phase: string; file: string; path: string }[] = []
  if (!existsSync(CURRICULUM_DIR)) return results

  for (const phaseDir of readdirSync(CURRICULUM_DIR, { withFileTypes: true })) {
    if (!phaseDir.isDirectory() || !/^phase\d+$/.test(phaseDir.name)) continue
    const phasePath = join(CURRICULUM_DIR, phaseDir.name)
    for (const file of readdirSync(phasePath)) {
      if (/^day\d{3}\.json$/.test(file)) {
        results.push({ phase: phaseDir.name, file, path: join(phasePath, file) })
      }
    }
  }
  return results
}

const curriculumFiles = getCurriculumFiles()

/** Check if a parsed JSON file is a revision stub. */
function isRevisionStub(data: Record<string, unknown>): boolean {
  return 'isRevision' in data && data.isRevision === true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertNonEmptyString(value: unknown, label: string) {
  expect(typeof value, `${label} should be a string`).toBe('string')
  expect((value as string).trim().length, `${label} should not be empty`).toBeGreaterThan(0)
}

function assertNonEmptyArray(value: unknown, label: string) {
  expect(Array.isArray(value), `${label} should be an array`).toBe(true)
  expect((value as unknown[]).length, `${label} should not be empty`).toBeGreaterThan(0)
}

// ---------------------------------------------------------------------------
// Vocab validation
// ---------------------------------------------------------------------------

function validateVocabWord(word: Record<string, unknown>, label: string) {
  assertNonEmptyString(word.word, `${label}.word`)
  expect(VALID_PARTS_OF_SPEECH, `${label}.partOfSpeech`).toContain(word.partOfSpeech)
  expect(VALID_GENDERS, `${label}.gender`).toContain(word.gender)
  assertNonEmptyString(word.pronunciation, `${label}.pronunciation`)
  assertNonEmptyString(word.meaning, `${label}.meaning`)

  if (word.notes !== undefined) {
    assertNonEmptyString(word.notes, `${label}.notes`)
  }

  // Conjugation: required for verbs, optional for others
  if (word.partOfSpeech === 'verb') {
    if (word.conjugation !== undefined) {
      expect(typeof word.conjugation, `${label}.conjugation should be an object`).toBe('object')
      expect(word.conjugation, `${label}.conjugation should not be null`).not.toBeNull()
      const conj = word.conjugation as Record<string, unknown>
      expect(Object.keys(conj).length, `${label}.conjugation should have entries`).toBeGreaterThan(
        0,
      )
      for (const [key, val] of Object.entries(conj)) {
        assertNonEmptyString(val, `${label}.conjugation.${key}`)
      }
    }
  }
  if (word.conjugation !== undefined && word.conjugation !== null) {
    expect(typeof word.conjugation, `${label}.conjugation should be object`).toBe('object')
  }

  // Examples: non-empty array of [french, english] pairs
  assertNonEmptyArray(word.examples, `${label}.examples`)
  for (const [index, example] of (word.examples as unknown[]).entries()) {
    expect(Array.isArray(example), `${label}.examples[${index}] should be an array`).toBe(true)
    const pair = example as unknown[]
    expect(pair.length, `${label}.examples[${index}] should have 2 elements`).toBe(2)
    assertNonEmptyString(pair[0], `${label}.examples[${index}][0] (french)`)
    assertNonEmptyString(pair[1], `${label}.examples[${index}][1] (english)`)
  }

  // Special: must be a string (can be empty)
  expect(typeof word.special, `${label}.special should be a string`).toBe('string')
}

function validateVocabSection(vocab: Record<string, unknown>, label: string) {
  for (const track of ['standard', 'advanced'] as const) {
    const words = vocab[track]
    assertNonEmptyArray(words, `${label}.${track}`)
    for (const [index, word] of (words as unknown[]).entries()) {
      validateVocabWord(word as Record<string, unknown>, `${label}.${track}[${index}]`)
    }
  }

  // Standard has at least 5, advanced has at least 7
  expect(
    (vocab.standard as unknown[]).length,
    `${label}.standard should have >= 5 words`,
  ).toBeGreaterThanOrEqual(5)
  expect(
    (vocab.advanced as unknown[]).length,
    `${label}.advanced should have >= 7 words`,
  ).toBeGreaterThanOrEqual(7)
}

// ---------------------------------------------------------------------------
// Listen validation
// ---------------------------------------------------------------------------

function validateListenQuestion(question: Record<string, unknown>, label: string) {
  assertNonEmptyString(question.question, `${label}.question`)
  assertNonEmptyArray(question.options, `${label}.options`)
  for (const [index, option] of (question.options as unknown[]).entries()) {
    assertNonEmptyString(option, `${label}.options[${index}]`)
  }
  assertNonEmptyString(question.correctAnswer, `${label}.correctAnswer`)
  expect(
    (question.options as string[]).includes(question.correctAnswer as string),
    `${label}.correctAnswer should be one of the options`,
  ).toBe(true)
}

function validateListenTrack(track: Record<string, unknown>, label: string) {
  // Dialogue
  assertNonEmptyArray(track.dialogue, `${label}.dialogue`)
  for (const [index, line] of (track.dialogue as unknown[]).entries()) {
    expect(Array.isArray(line), `${label}.dialogue[${index}] should be array`).toBe(true)
    const pair = line as unknown[]
    expect(pair.length, `${label}.dialogue[${index}] should have 2 elements`).toBe(2)
    expect(VALID_DIALOGUE_SPEAKERS, `${label}.dialogue[${index}][0] speaker`).toContain(pair[0])
    assertNonEmptyString(pair[1], `${label}.dialogue[${index}][1] text`)
  }

  // Questions
  assertNonEmptyArray(track.questions, `${label}.questions`)
  for (const [index, question] of (track.questions as unknown[]).entries()) {
    validateListenQuestion(question as Record<string, unknown>, `${label}.questions[${index}]`)
  }

  // Summary
  assertNonEmptyString(track.summary, `${label}.summary`)
}

function validateListenSection(listen: Record<string, unknown>, label: string) {
  for (const track of ['standard', 'advanced'] as const) {
    expect(listen[track], `${label}.${track} should exist`).toBeDefined()
    validateListenTrack(listen[track] as Record<string, unknown>, `${label}.${track}`)
  }
}

// ---------------------------------------------------------------------------
// Grammar validation
// ---------------------------------------------------------------------------

function validateGrammarExample(example: Record<string, unknown>, label: string) {
  assertNonEmptyString(example.french, `${label}.french`)
  assertNonEmptyString(example.english, `${label}.english`)
}

function validateGrammarDrill(drill: Record<string, unknown>, label: string) {
  expect(VALID_DRILL_TYPES, `${label}.type`).toContain(drill.type)
  assertNonEmptyString(drill.question, `${label}.question`)
  assertNonEmptyString(drill.correctAnswer, `${label}.correctAnswer`)
  assertNonEmptyString(drill.explanation, `${label}.explanation`)

  if (drill.type === 'multipleChoice') {
    assertNonEmptyArray(drill.options, `${label}.options (required for multipleChoice)`)
    expect(
      (drill.options as string[]).includes(drill.correctAnswer as string),
      `${label}.correctAnswer should be one of the options`,
    ).toBe(true)
  }
}

function validateGrammarTrack(track: Record<string, unknown>, label: string) {
  assertNonEmptyString(track.title, `${label}.title`)
  assertNonEmptyString(track.explanation, `${label}.explanation`)

  assertNonEmptyArray(track.examples, `${label}.examples`)
  for (const [index, example] of (track.examples as unknown[]).entries()) {
    validateGrammarExample(example as Record<string, unknown>, `${label}.examples[${index}]`)
  }

  assertNonEmptyArray(track.drills, `${label}.drills`)
  for (const [index, drill] of (track.drills as unknown[]).entries()) {
    validateGrammarDrill(drill as Record<string, unknown>, `${label}.drills[${index}]`)
  }
}

function validateGrammarSection(grammar: Record<string, unknown>, label: string) {
  for (const track of ['standard', 'advanced'] as const) {
    expect(grammar[track], `${label}.${track} should exist`).toBeDefined()
    validateGrammarTrack(grammar[track] as Record<string, unknown>, `${label}.${track}`)
  }
}

// ---------------------------------------------------------------------------
// Quiz validation
// ---------------------------------------------------------------------------

function validateQuizQuestion(question: Record<string, unknown>, label: string) {
  expect(VALID_QUIZ_TYPES, `${label}.type`).toContain(question.type)
  assertNonEmptyString(question.question, `${label}.question`)
  assertNonEmptyString(question.correctAnswer, `${label}.correctAnswer`)
  assertNonEmptyString(question.explanation, `${label}.explanation`)

  if (question.type === 'multipleChoice') {
    assertNonEmptyArray(question.options, `${label}.options (required for multipleChoice)`)
    for (const [index, option] of (question.options as unknown[]).entries()) {
      assertNonEmptyString(option, `${label}.options[${index}]`)
    }
    expect(
      (question.options as string[]).includes(question.correctAnswer as string),
      `${label}.correctAnswer should be one of the options`,
    ).toBe(true)
  }

  if (question.targetWord !== undefined) {
    assertNonEmptyString(question.targetWord, `${label}.targetWord`)
  }
}

function validateQuizSection(quiz: Record<string, unknown>, label: string) {
  for (const track of ['standard', 'advanced'] as const) {
    assertNonEmptyArray(quiz[track], `${label}.${track}`)
    for (const [index, question] of (quiz[track] as unknown[]).entries()) {
      validateQuizQuestion(question as Record<string, unknown>, `${label}.${track}[${index}]`)
    }
  }
}

// ---------------------------------------------------------------------------
// Speak validation
// ---------------------------------------------------------------------------

function validateSpeakTrack(track: Record<string, unknown>, label: string) {
  assertNonEmptyString(track.scenario, `${label}.scenario`)
  assertNonEmptyArray(track.keyPhrases, `${label}.keyPhrases`)
  for (const [index, phrase] of (track.keyPhrases as unknown[]).entries()) {
    assertNonEmptyString(phrase, `${label}.keyPhrases[${index}]`)
  }
  assertNonEmptyString(track.modelAnswer, `${label}.modelAnswer`)
  assertNonEmptyString(track.modelAnswerExplanation, `${label}.modelAnswerExplanation`)

  // tip: must be a string if present (can be empty for advanced)
  if (track.tip !== undefined) {
    expect(typeof track.tip, `${label}.tip should be a string`).toBe('string')
  }
}

function validateSpeakSection(speak: Record<string, unknown>, label: string) {
  for (const track of ['standard', 'advanced'] as const) {
    expect(speak[track], `${label}.${track} should exist`).toBeDefined()
    validateSpeakTrack(speak[track] as Record<string, unknown>, `${label}.${track}`)
  }
}

// ---------------------------------------------------------------------------
// Top-level day content validation
// ---------------------------------------------------------------------------

function validateDayContent(data: Record<string, unknown>, label: string) {
  // Top-level fields
  expect(typeof data.day, `${label}.day should be a number`).toBe('number')
  expect(Number.isInteger(data.day), `${label}.day should be an integer`).toBe(true)
  expect(data.day as number, `${label}.day should be positive`).toBeGreaterThan(0)

  expect(typeof data.phase, `${label}.phase should be a number`).toBe('number')
  expect([1, 2, 3], `${label}.phase should be 1, 2, or 3`).toContain(data.phase)

  assertNonEmptyString(data.topic, `${label}.topic`)

  // Sections
  expect(data.vocab, `${label}.vocab should exist`).toBeDefined()
  validateVocabSection(data.vocab as Record<string, unknown>, `${label}.vocab`)

  expect(data.listen, `${label}.listen should exist`).toBeDefined()
  validateListenSection(data.listen as Record<string, unknown>, `${label}.listen`)

  expect(data.grammar, `${label}.grammar should exist`).toBeDefined()
  validateGrammarSection(data.grammar as Record<string, unknown>, `${label}.grammar`)

  expect(data.quiz, `${label}.quiz should exist`).toBeDefined()
  validateQuizSection(data.quiz as Record<string, unknown>, `${label}.quiz`)

  expect(data.speak, `${label}.speak should exist`).toBeDefined()
  validateSpeakSection(data.speak as Record<string, unknown>, `${label}.speak`)
}

// ---------------------------------------------------------------------------
// Revision stub validation
// ---------------------------------------------------------------------------

function validateRevisionStub(data: Record<string, unknown>, label: string) {
  expect(typeof data.day, `${label}.day should be a number`).toBe('number')
  expect(Number.isInteger(data.day), `${label}.day should be an integer`).toBe(true)
  expect(data.day as number, `${label}.day should be positive`).toBeGreaterThan(0)
  expect((data.day as number) % 4, `${label}.day should be a multiple of 4`).toBe(0)

  expect(typeof data.phase, `${label}.phase should be a number`).toBe('number')
  expect([1, 2, 3], `${label}.phase should be 1, 2, or 3`).toContain(data.phase)

  expect(data.isRevision, `${label}.isRevision should be true`).toBe(true)
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('curriculum JSON validation', () => {
  it('should find at least one curriculum file', () => {
    expect(curriculumFiles.length, 'No curriculum files found').toBeGreaterThan(0)
  })

  it('should only contain files matching dayNNN.json naming', () => {
    for (const { phase } of curriculumFiles) {
      const phasePath = join(CURRICULUM_DIR, phase)
      const allFiles = readdirSync(phasePath)
      for (const file of allFiles) {
        if (file.endsWith('.json')) {
          expect(file, `${phase}/${file} does not match dayNNN.json pattern`).toMatch(
            /^day\d{3}\.json$/,
          )
        }
      }
    }
  })

  it('should have no duplicate day numbers within a phase', () => {
    const daysByPhase = new Map<string, number[]>()
    for (const { phase, path: filePath } of curriculumFiles) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      const days = daysByPhase.get(phase) ?? []
      days.push(data.day)
      daysByPhase.set(phase, days)
    }
    for (const [phase, days] of daysByPhase) {
      const unique = new Set(days)
      expect(unique.size, `${phase} has duplicate day numbers: ${days}`).toBe(days.length)
    }
  })

  it('should have day field match filename number', () => {
    for (const { phase, file, path: filePath } of curriculumFiles) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      const fileNumber = parseInt(file.replace('day', '').replace('.json', ''), 10)
      const expectedPhase = parseInt(phase.replace('phase', ''), 10)
      expect(data.phase, `${phase}/${file} phase field should match folder`).toBe(expectedPhase)
      expect(data.day, `${phase}/${file} day field should match filename number`).toBe(fileNumber)
    }
  })

  it('should have contiguous day numbers with no gaps', () => {
    const daysByPhase = new Map<string, number[]>()

    for (const { phase, path: filePath } of curriculumFiles) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      const days = daysByPhase.get(phase) ?? []
      days.push(data.day as number)
      daysByPhase.set(phase, days)
    }

    for (const [phase, days] of daysByPhase) {
      const sorted = [...days].sort((a, b) => a - b)
      const maxDay = sorted[sorted.length - 1]

      // Every day from 1 to maxDay should have a file
      for (let d = 1; d <= maxDay; d++) {
        expect(sorted.includes(d), `${phase} is missing day ${d}`).toBe(true)
      }
    }
  })

  it('revision day files should have isRevision: true', () => {
    for (const { phase, file, path: filePath } of curriculumFiles) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      const dayNumber = data.day as number
      if (dayNumber % 4 === 0) {
        expect(
          data.isRevision,
          `${phase}/${file} day ${dayNumber} is a revision day and should have isRevision: true`,
        ).toBe(true)
      }
    }
  })

  it('content day files should not have isRevision', () => {
    for (const { phase, file, path: filePath } of curriculumFiles) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      const dayNumber = data.day as number
      if (dayNumber % 4 !== 0) {
        expect(
          data.isRevision,
          `${phase}/${file} day ${dayNumber} is a content day and should not have isRevision`,
        ).toBeUndefined()
      }
    }
  })

  describe.each(curriculumFiles)('$phase/$file', ({ phase, file, path: filePath }) => {
    const label = `${phase}/${file}`
    let data: Record<string, unknown>

    it('should parse as valid JSON', () => {
      const raw = readFileSync(filePath, 'utf-8')
      expect(() => JSON.parse(raw)).not.toThrow()
      data = JSON.parse(raw)
    })

    it('should pass full schema validation', () => {
      data = JSON.parse(readFileSync(filePath, 'utf-8'))
      if (isRevisionStub(data)) {
        validateRevisionStub(data, label)
      } else {
        validateDayContent(data, label)
      }
    })

    it('multipleChoice questions should have >= 3 options', () => {
      data = JSON.parse(readFileSync(filePath, 'utf-8'))
      if (isRevisionStub(data)) return

      const quiz = data.quiz as Record<string, unknown[]>
      for (const track of ['standard', 'advanced'] as const) {
        for (const [index, question] of (quiz[track] as Record<string, unknown>[]).entries()) {
          if (question.type === 'multipleChoice') {
            expect(
              (question.options as unknown[]).length,
              `${label}.quiz.${track}[${index}] multipleChoice should have >= 3 options`,
            ).toBeGreaterThanOrEqual(3)
          }
        }
      }

      const grammar = data.grammar as Record<string, Record<string, unknown>>
      for (const track of ['standard', 'advanced'] as const) {
        for (const [index, drill] of (
          grammar[track].drills as Record<string, unknown>[]
        ).entries()) {
          if (drill.type === 'multipleChoice') {
            expect(
              (drill.options as unknown[]).length,
              `${label}.grammar.${track}.drills[${index}] multipleChoice should have >= 3 options`,
            ).toBeGreaterThanOrEqual(3)
          }
        }
      }
    })

    it('advanced track should have more or equal content than standard', () => {
      data = JSON.parse(readFileSync(filePath, 'utf-8'))
      if (isRevisionStub(data)) return

      const vocab = data.vocab as Record<string, unknown[]>
      expect(
        vocab.advanced.length,
        `${label} advanced vocab should be >= standard vocab`,
      ).toBeGreaterThanOrEqual(vocab.standard.length)
    })
  })
})
