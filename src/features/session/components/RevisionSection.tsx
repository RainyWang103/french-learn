import type { DrillQuestion } from '../utils/quiz'
import { useQuizAnswers } from '../hooks/useQuizAnswers'
import QuizItem from './QuizItem'
import ProgressBar from './ProgressBar'
import styles from './RevisionSection.module.css'

interface RevisionSectionProps {
  flaggedWords: string[]
  onDone: (masteredWords: string[]) => void
}

const MAX_REVISION_WORDS = 5

export default function RevisionSection({ flaggedWords, onDone }: RevisionSectionProps) {
  const activeWords = flaggedWords.slice(0, MAX_REVISION_WORDS)
  const quizItems: DrillQuestion[] = activeWords.map((word) => ({
    type: 'fillInTheBlank',
    question: `Spell the French word: "${word}"`,
    correctAnswer: word,
  }))

  const { answers, answeredCount, allAnswered, score, recordAnswer } = useQuizAnswers(
    quizItems.length,
  )

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
        <QuizItem key={i} question={q} index={i} onAnswer={(correct) => recordAnswer(i, correct)} />
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
            onClick={() => onDone(activeWords.filter((_, i) => answers[i] === true))}
          >
            Done →
          </button>
        </div>
      )}
    </div>
  )
}
