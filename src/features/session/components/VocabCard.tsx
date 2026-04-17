import { useState } from 'react'
import type { VocabWord, VerbForms, GenderForms, QuizQuestion } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spkV } from '$lib/speech'
import {
  countAnswered,
  countCorrect,
  extractFlaggedWords,
  quizQuestionToDrill,
} from '../utils/quiz'
import type { DrillQuestion } from '../utils/quiz'
import { genderLabel } from '../utils/vocab'
import QuizItem from './QuizItem'
import ProgressBar from './ProgressBar'
import styles from './VocabCard.module.css'

interface VocabCardProps {
  words: VocabWord[]
  quizQuestions: QuizQuestion[]
  track: Track
  difficulty: number
  hidePronunciation: boolean
  onDone: (result: { score: number; total: number; flaggedWords: string[] }) => void
}

function ListenButton({
  text,
  rate = 0.75,
  small,
}: {
  text: string
  rate?: number
  small?: boolean
}) {
  const [active, setActive] = useState(false)
  function handleClick() {
    setActive(true)
    spkV(text, 'f', rate)
    setTimeout(() => setActive(false), 1800)
  }
  return (
    <button
      className={small ? styles.listenBtnSmall : styles.listenBtn}
      onClick={handleClick}
      aria-label="Listen"
    >
      {active ? '🔊' : '🔈'}
    </button>
  )
}

function VerbFormsTable({ forms }: { forms: VerbForms }) {
  const rows: [string, string][] = [
    ['je', forms.je],
    ['tu', forms.tu],
    ['il / elle / on', forms.il],
    ['nous', forms.nous],
    ['vous', forms.vous],
    ['ils / elles', forms.ils],
  ]
  return (
    <div>
      <div className={styles.fieldLabel}>Conjugation</div>
      <table className={styles.formsTable}>
        <tbody>
          {rows.map(([pronoun, conjugated]) => (
            <tr key={pronoun}>
              <td className={styles.formsPronoun}>{pronoun}</td>
              <td className={styles.formsValue}>
                <span>{conjugated}</span>
                <ListenButton text={conjugated} rate={0.7} small />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GenderFormsTable({ forms }: { forms: GenderForms }) {
  const rows: [string, string][] = (
    [
      ['masculine', forms.masculine],
      ['feminine', forms.feminine],
      ['masc. plural', forms.masculinePlural],
      ['fem. plural', forms.femininePlural],
    ] as [string, string][]
  ).filter(([, value]) => value !== '')

  if (rows.length === 0) return null
  return (
    <div>
      <div className={styles.fieldLabel}>Forms</div>
      <table className={styles.formsTable}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className={styles.formsPronoun}>{label}</td>
              <td className={styles.formsValue}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WordCard({
  word,
  index,
  total,
  showPronunciation,
  showHints,
  onPrev,
  onNext,
  isLast,
  onStartQuiz,
}: {
  word: VocabWord
  index: number
  total: number
  showPronunciation: boolean
  showHints: boolean
  onPrev: () => void
  onNext: () => void
  isLast: boolean
  onStartQuiz: () => void
}) {
  const label = genderLabel(word.gender)

  return (
    <div>
      <ProgressBar current={index + 1} total={total} label={`Word ${index + 1} of ${total}`} />
      <div className={styles.card} key={word.word}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.wordTitle}>{word.word}</h2>
            <div className={styles.badges}>
              {label && <span className={styles.badge + ' ' + styles.badgeGender}>{label}</span>}
              <span className={styles.badge + ' ' + styles.badgePos}>{word.partOfSpeech}</span>
              {word.special && (
                <span className={styles.badge + ' ' + styles.badgeSpecial}>{word.special}</span>
              )}
            </div>
          </div>
          <ListenButton text={word.word} rate={0.7} />
        </div>

        {showPronunciation && (
          <div style={{ marginBottom: 14 }}>
            <div className={styles.fieldLabel}>Pronunciation</div>
            <div className={styles.pronunciation}>[{word.pronunciation}]</div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div className={styles.fieldLabel}>Meaning</div>
          <div className={styles.meaning}>{word.meaning}</div>
        </div>

        {showHints && word.notes && <div className={styles.notesBox}>💡 {word.notes}</div>}

        {word.partOfSpeech === 'verb' && <VerbFormsTable forms={word.forms as VerbForms} />}
        {(word.partOfSpeech === 'noun' || word.partOfSpeech === 'adjective') && (
          <GenderFormsTable forms={word.forms as GenderForms} />
        )}

        <div className={styles.fieldLabel} style={{ marginBottom: 8 }}>
          Examples
        </div>
        <div className={styles.examples}>
          {word.examples.map(([fr, en], i) => (
            <div key={i} className={styles.exampleItem}>
              <div className={styles.exampleRow}>
                <span className={styles.exampleFr}>{fr}</span>
                <ListenButton text={fr} rate={0.75} small />
              </div>
              <div className={styles.exampleEn}>{en}</div>
            </div>
          ))}
        </div>

        <div className={styles.sayAloud}>
          <span className={styles.sayAloudText}>🎙 {word.examples[0][0]}</span>
          <ListenButton text={word.examples[0][0]} rate={0.7} />
        </div>

        <div className={styles.navRow}>
          {index > 0 && (
            <button className={styles.btnSecondary} onClick={onPrev}>
              ← Back
            </button>
          )}
          {isLast ? (
            <button className={styles.btnPrimary} onClick={onStartQuiz}>
              Quiz 📝
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={onNext}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VocabCard({
  words,
  quizQuestions,
  track,
  difficulty,
  hidePronunciation,
  onDone,
}: VocabCardProps) {
  const scaffolding = getScaffolding('vocab', difficulty, track)
  const activeWords = words.slice(0, scaffolding.wordCount)
  const showPronunciation = scaffolding.showPronunciation && !hidePronunciation
  const showHints = scaffolding.showHints

  const [phase, setPhase] = useState<'cards' | 'quiz'>('cards')
  const [cardIndex, setCardIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})

  const quizItems: DrillQuestion[] = quizQuestions.map(quizQuestionToDrill)

  const answeredCount = countAnswered(answers)
  const allAnswered = answeredCount === quizItems.length

  if (phase === 'quiz') {
    const score = countCorrect(answers)
    return (
      <div className={styles.section}>
        <ProgressBar current={answeredCount} total={quizItems.length} label="Vocab Quiz" />
        {quizItems.map((q, i) => (
          <QuizItem
            key={i}
            question={q}
            index={i}
            onAnswer={(correct) => setAnswers((prev) => ({ ...prev, [i]: correct }))}
          />
        ))}
        {allAnswered && (
          <div className={styles.scoreBox}>
            <div className={styles.scoreNum}>
              {score} / {quizItems.length}
            </div>
            <div className={styles.scoreSub}>
              {score === quizItems.length
                ? 'Perfect!'
                : score >= quizItems.length * 0.8
                  ? 'Great work!'
                  : 'Keep practising!'}
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() =>
                onDone({
                  score,
                  total: quizItems.length,
                  flaggedWords: extractFlaggedWords(quizQuestions, answers),
                })
              }
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <WordCard
        word={activeWords[cardIndex]}
        index={cardIndex}
        total={activeWords.length}
        showPronunciation={showPronunciation}
        showHints={showHints}
        onPrev={() => setCardIndex((i) => i - 1)}
        onNext={() => setCardIndex((i) => i + 1)}
        isLast={cardIndex === activeWords.length - 1}
        onStartQuiz={() => setPhase('quiz')}
      />
    </div>
  )
}
