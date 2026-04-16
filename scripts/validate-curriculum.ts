import fs from 'fs'
import path from 'path'
import type { DayContent, RevisionDay, VocabWord, VerbForms, GenderForms } from '$types/curriculum'

const PHASE1_DIR = path.resolve('public/curriculum/phase1')

function isVerbForms(forms: VerbForms | GenderForms): forms is VerbForms {
  return 'je' in forms
}

function isGenderForms(forms: VerbForms | GenderForms): forms is GenderForms {
  return 'masculine' in forms
}

function validateVocabWord(word: VocabWord, label: string): string[] {
  const errors: string[] = []

  if (!word.word || typeof word.word !== 'string') errors.push(`${label}: missing word`)
  if (!word.partOfSpeech) errors.push(`${label}: missing partOfSpeech`)
  if (!word.pronunciation || typeof word.pronunciation !== 'string')
    errors.push(`${label}: missing pronunciation`)
  if (!word.meaning || typeof word.meaning !== 'string') errors.push(`${label}: missing meaning`)
  if (word.notes !== undefined && (typeof word.notes !== 'string' || word.notes.trim().length === 0))
    errors.push(`${label}: notes must be a non-empty string when present`)
  if (typeof word.special !== 'string') errors.push(`${label}: special must be a string`)
  if (!Array.isArray(word.examples) || word.examples.length === 0)
    errors.push(`${label}: examples must be non-empty array`)
  if (!word.forms) {
    errors.push(`${label}: missing forms`)
    return errors
  }

  const forms = word.forms as VerbForms | GenderForms

  if (word.partOfSpeech === 'verb') {
    if (!isVerbForms(forms)) {
      errors.push(`${label}: verb must have VerbForms (je/tu/il/nous/vous/ils)`)
    } else {
      for (const key of ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const) {
        if (!forms[key] || typeof forms[key] !== 'string' || forms[key].trim().length === 0)
          errors.push(`${label}.forms.${key} must be a non-empty string`)
      }
    }
  } else {
    if (!isGenderForms(forms)) {
      errors.push(`${label}: non-verb must have GenderForms (masculine/feminine/masculinePlural/femininePlural)`)
    } else {
      const genderKeys = ['masculine', 'feminine', 'masculinePlural', 'femininePlural'] as const
      for (const key of genderKeys) {
        if (typeof forms[key] !== 'string')
          errors.push(`${label}.forms.${key} must be a string`)
      }
      if (word.partOfSpeech === 'noun' || word.partOfSpeech === 'adjective') {
        if (word.gender === 'male') {
          if (!forms.masculine || forms.masculine.trim().length === 0)
            errors.push(`${label}.forms.masculine must be non-empty for male noun`)
          if (!forms.masculinePlural || forms.masculinePlural.trim().length === 0)
            errors.push(`${label}.forms.masculinePlural must be non-empty for male noun`)
          if (forms.feminine !== '')
            errors.push(`${label}.forms.feminine must be "" for male-only noun`)
          if (forms.femininePlural !== '')
            errors.push(`${label}.forms.femininePlural must be "" for male-only noun`)
        } else if (word.gender === 'female') {
          if (!forms.feminine || forms.feminine.trim().length === 0)
            errors.push(`${label}.forms.feminine must be non-empty for female noun`)
          if (!forms.femininePlural || forms.femininePlural.trim().length === 0)
            errors.push(`${label}.forms.femininePlural must be non-empty for female noun`)
          if (forms.masculine !== '')
            errors.push(`${label}.forms.masculine must be "" for female-only noun`)
          if (forms.masculinePlural !== '')
            errors.push(`${label}.forms.masculinePlural must be "" for female-only noun`)
        } else {
          for (const key of genderKeys) {
            if (!forms[key] || forms[key].trim().length === 0)
              errors.push(`${label}.forms.${key} must be non-empty for dual-gender noun`)
          }
        }
      } else {
        // adverb / expression: all four must be non-empty
        for (const key of genderKeys) {
          if (!forms[key] || forms[key].trim().length === 0)
            errors.push(`${label}.forms.${key} must be non-empty for adverb/expression`)
        }
      }
    }
  }

  return errors
}

function validateContentFile(data: DayContent, filename: string): string[] {
  const errors: string[] = []
  const label = filename

  if (typeof data.day !== 'number') errors.push(`${label}: day must be a number`)
  if (typeof data.phase !== 'number') errors.push(`${label}: phase must be a number`)
  if (data.isRevision !== false) errors.push(`${label}: content file must have isRevision: false`)
  if (!data.topic || typeof data.topic !== 'string') errors.push(`${label}: missing topic`)

  // vocab
  if (!data.vocab?.standard || !data.vocab?.advanced) {
    errors.push(`${label}: missing vocab.standard or vocab.advanced`)
  } else {
    if (data.vocab.standard.length !== 5)
      errors.push(`${label}: vocab.standard must have exactly 5 words (got ${data.vocab.standard.length})`)
    if (data.vocab.advanced.length !== 7)
      errors.push(`${label}: vocab.advanced must have exactly 7 words (got ${data.vocab.advanced.length})`)
    data.vocab.standard.forEach((w, i) => {
      errors.push(...validateVocabWord(w, `${label}.vocab.standard[${i}]`))
    })
    data.vocab.advanced.forEach((w, i) => {
      errors.push(...validateVocabWord(w, `${label}.vocab.advanced[${i}]`))
    })
  }

  // listen
  for (const track of ['standard', 'advanced'] as const) {
    const listen = data.listen?.[track]
    if (!listen) {
      errors.push(`${label}: missing listen.${track}`)
      continue
    }
    if (!Array.isArray(listen.dialogue) || listen.dialogue.length === 0)
      errors.push(`${label}.listen.${track}: dialogue must be non-empty array`)
    for (const [i, line] of (listen.dialogue ?? []).entries()) {
      if (!Array.isArray(line) || line.length !== 2)
        errors.push(`${label}.listen.${track}.dialogue[${i}]: must be [speaker, text]`)
      else if (line[0] !== 'A' && line[0] !== 'B')
        errors.push(`${label}.listen.${track}.dialogue[${i}][0]: speaker must be "A" or "B"`)
    }
    if (!Array.isArray(listen.questions) || listen.questions.length === 0)
      errors.push(`${label}.listen.${track}: questions must be non-empty array`)
    if (!listen.summary || typeof listen.summary !== 'string')
      errors.push(`${label}.listen.${track}: missing summary`)
  }

  // grammar
  for (const track of ['standard', 'advanced'] as const) {
    const grammar = data.grammar?.[track]
    if (!grammar) {
      errors.push(`${label}: missing grammar.${track}`)
      continue
    }
    if (!grammar.title || typeof grammar.title !== 'string')
      errors.push(`${label}.grammar.${track}: missing title`)
    if (!grammar.explanation || typeof grammar.explanation !== 'string')
      errors.push(`${label}.grammar.${track}: missing explanation`)
    if (!Array.isArray(grammar.examples) || grammar.examples.length === 0)
      errors.push(`${label}.grammar.${track}: examples must be non-empty array`)
    for (const [i, ex] of (grammar.examples ?? []).entries()) {
      const obj = ex as Record<string, unknown>
      if (typeof obj !== 'object' || !obj.french || !obj.english)
        errors.push(`${label}.grammar.${track}.examples[${i}]: must have {french, english}`)
    }
    if (!Array.isArray(grammar.drills) || grammar.drills.length === 0)
      errors.push(`${label}.grammar.${track}: drills must be non-empty array`)
  }

  // quiz
  for (const track of ['standard', 'advanced'] as const) {
    const quiz = data.quiz?.[track]
    if (!Array.isArray(quiz) || quiz.length === 0) {
      errors.push(`${label}: missing quiz.${track}`)
      continue
    }
    for (const [i, q] of quiz.entries()) {
      if (!q.type) errors.push(`${label}.quiz.${track}[${i}]: missing type`)
      if (!q.question) errors.push(`${label}.quiz.${track}[${i}]: missing question`)
      if (!q.correctAnswer) errors.push(`${label}.quiz.${track}[${i}]: missing correctAnswer`)
      if (!q.explanation) errors.push(`${label}.quiz.${track}[${i}]: missing explanation`)
      if (!q.targetWord) errors.push(`${label}.quiz.${track}[${i}]: missing targetWord`)
    }
  }

  // speak
  for (const track of ['standard', 'advanced'] as const) {
    const speak = data.speak?.[track]
    if (!speak) {
      errors.push(`${label}: missing speak.${track}`)
      continue
    }
    if (!speak.scenario) errors.push(`${label}.speak.${track}: missing scenario`)
    if (!Array.isArray(speak.keyPhrases) || speak.keyPhrases.length === 0)
      errors.push(`${label}.speak.${track}: keyPhrases must be non-empty array`)
    if (!speak.modelAnswer) errors.push(`${label}.speak.${track}: missing modelAnswer`)
    if (!speak.modelAnswerExplanation)
      errors.push(`${label}.speak.${track}: missing modelAnswerExplanation`)
  }

  return errors
}

function main() {
  const files = fs.readdirSync(PHASE1_DIR).filter((f) => f.endsWith('.json')).sort()

  let revisionCount = 0
  let contentCount = 0
  const allErrors: string[] = []
  const grammarTitles = new Map<string, string>()
  const vocabWords = new Map<string, string>()

  for (const filename of files) {
    const filepath = path.join(PHASE1_DIR, filename)
    let data: DayContent | RevisionDay

    try {
      data = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as DayContent | RevisionDay
    } catch {
      allErrors.push(`${filename}: invalid JSON`)
      continue
    }

    if (typeof data.day !== 'number' || typeof data.phase !== 'number') {
      allErrors.push(`${filename}: missing day or phase`)
      continue
    }

    if ((data as RevisionDay).isRevision === true) {
      revisionCount++
      continue
    }

    const content = data as DayContent
    contentCount++

    const fileErrors = validateContentFile(content, filename)
    allErrors.push(...fileErrors)

    // check for duplicate grammar titles
    for (const track of ['standard', 'advanced'] as const) {
      const title = content.grammar?.[track]?.title
      if (title) {
        if (grammarTitles.has(title)) {
          allErrors.push(`${filename}: duplicate grammar title "${title}" (first seen in ${grammarTitles.get(title)})`)
        } else {
          grammarTitles.set(title, filename)
        }
      }
    }

    // check for duplicate vocab words
    for (const track of ['standard', 'advanced'] as const) {
      for (const word of content.vocab?.[track] ?? []) {
        const key = word.word?.toLowerCase().trim()
        if (key) {
          if (vocabWords.has(key)) {
            // same word repeated across tracks of the same day is expected — only flag cross-day
            const firstSeen = vocabWords.get(key)!
            const firstFile = firstSeen.split(':')[0]
            if (firstFile !== filename) {
              allErrors.push(`${filename}: duplicate vocab word "${word.word}" (first seen in ${firstSeen})`)
            }
          } else {
            vocabWords.set(key, `${filename}:${track}`)
          }
        }
      }
    }
  }

  if (allErrors.length > 0) {
    console.error('Curriculum validation FAILED:')
    for (const err of allErrors) {
      console.error(`  ✗ ${err}`)
    }
    process.exit(1)
  }

  const total = revisionCount + contentCount
  if (total === 84) {
    console.log(`All 84 A1 days valid ✓  (${revisionCount} revision stubs, ${contentCount} content files)`)
  } else {
    console.log(`Curriculum valid ✓  ${total} files validated (${revisionCount} revision stubs, ${contentCount} content files) — phase 1 complete when 84 total`)
  }
}

main()
