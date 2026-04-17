import { useState } from 'react'
import QuizItem, { type DrillQuestion } from './QuizItem'
import styles from './RevisionSection.module.css'

interface RevisionSectionProps {
  flaggedWords: string[]
  onDone: (masteredWords: string[]) => void
}

const MAX_REVISION_WORDS = 5

function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div className={styles.progressWrapper}>
      <div className={styles.progressLabel}>{label}</div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function RevisionSection({ flaggedWords, onDone }: RevisionSectionProps) {
  const [answers, setAnswers] = useState<Record<number, boolean>>({})

  if (flaggedWords.length === 0) {
    return (
      <div className={styles.section}>
        <div className={[styles.card, styles.emptyCard].join(' ')}>
          <div className={styles.emptyIcon}>🌟</div>
          <h3 className={styles.emptyTitle}>Nothing to review!</h3>
          <p className={styles.emptyBody}>You aced everything. Enjoy your rest day!</p>
          <button className={styles.btnPrimary} onClick={() => onDone([])}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  const activeWords = flaggedWords.slice(0, MAX_REVISION_WORDS)
  const quizItems: DrillQuestion[] = activeWords.map((word) => ({
    type: 'fillInTheBlank',
    question: `Spell the French word: "${word}"`,
    correctAnswer: word,
  }))

  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === quizItems.length
  const score = Object.values(answers).filter(Boolean).length

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <div className={styles.sectionBadge}>📖 Revision</div>
        <h3 className={styles.revTitle}>Review flagged words</h3>
        <p className={styles.revSub}>
          {flaggedWords.length} word{flaggedWords.length !== 1 ? 's' : ''} to review
          {flaggedWords.length > MAX_REVISION_WORDS && ` — showing ${MAX_REVISION_WORDS} today`}.
        </p>
      </div>

      <ProgressBar current={answeredCount} total={quizItems.length} label="Revision" />

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
              ? 'All mastered — words cleared from your review list!'
              : `${quizItems.length - score} word${quizItems.length - score !== 1 ? 's' : ''} still need practice.`}
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => {
              const mastered = activeWords.filter((_, i) => answers[i] === true)
              onDone(mastered)
            }}
          >
            Done →
          </button>
        </div>
      )}
    </div>
  )
}
