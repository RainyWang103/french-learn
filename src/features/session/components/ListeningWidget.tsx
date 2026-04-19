import { useState } from 'react'
import clsx from 'clsx'
import type { ListenContent } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spkV } from '$lib/speech'
import { listeningQuestionToDrill } from '$session/utils/quiz'
import type { DrillQuestion } from '$session/utils/quiz'
import { useQuizAnswers } from '$session/hooks/useQuizAnswers'
import { useDialoguePlayer } from '$session/hooks/useDialoguePlayer'
import { ListeningPhase } from '$session/constants'
import QuizItem from '$session/components/QuizItem'
import ProgressBar from '$session/components/ProgressBar'
import styles from './ListeningWidget.module.css'

interface ListeningWidgetProps {
  listen: ListenContent
  difficulty: number
  track: Track
  onDone: (result: { score: number; total: number }) => void
}

export default function ListeningWidget({
  listen,
  difficulty,
  track,
  onDone,
}: ListeningWidgetProps) {
  const scaffolding = getScaffolding('listening', difficulty, track)
  const { speed, questionCount, maxReplays, showTranscriptUpfront } = scaffolding

  const activeQuestions: DrillQuestion[] = listen.questions
    .slice(0, questionCount)
    .map(listeningQuestionToDrill)

  const initialPhase = showTranscriptUpfront ? ListeningPhase.TRANSCRIPT : ListeningPhase.LISTEN
  const [phase, setPhase] = useState<ListeningPhase>(initialPhase)
  const [replaysUsed, setReplaysUsed] = useState(0)
  const { isPlaying, play } = useDialoguePlayer(listen.dialogue, speed)
  const { answeredCount, allAnswered, score, recordAnswer } = useQuizAnswers(activeQuestions.length)

  const replaysRemaining = maxReplays === -1 ? Infinity : maxReplays - replaysUsed
  const canReplay = replaysRemaining > 0

  function handleReplay() {
    if (!canReplay) {
      return
    }
    setReplaysUsed((n) => n + 1)
    play()
  }

  if (phase === ListeningPhase.LISTEN) {
    return (
      <div className={styles.section}>
        <div className={styles.card}>
          <div className={styles.sectionBadge}>🎧 Listening</div>
          <h3 className={styles.title}>Listen to the dialogue</h3>
          <p className={styles.hint}>
            Press play and listen carefully. You can adjust the speed below.
          </p>
          <div className={styles.playControls}>
            <button className={styles.btnPrimary} onClick={() => play()} disabled={isPlaying}>
              {isPlaying ? '▶ Playing…' : '▶ Play'}
            </button>
            {speed > 0.65 && (
              <button
                className={styles.btnGhost}
                onClick={() => play(speed * 0.75)}
                disabled={isPlaying}
              >
                🐢 Slower
              </button>
            )}
          </div>
          <button
            className={styles.btnSecondary}
            onClick={() => setPhase(ListeningPhase.QUESTIONS)}
          >
            Answer Questions →
          </button>
        </div>
      </div>
    )
  }

  if (phase === ListeningPhase.QUESTIONS) {
    return (
      <div className={styles.section}>
        <ProgressBar current={answeredCount} total={activeQuestions.length} label="Comprehension" />
        <div
          style={{
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            className={styles.btnGhost}
            onClick={handleReplay}
            disabled={!canReplay || isPlaying}
          >
            🔈 Replay{maxReplays !== -1 && ` (${Math.max(0, replaysRemaining)} left)`}
          </button>
        </div>
        {activeQuestions.map((q, i) => (
          <QuizItem
            key={i}
            question={q}
            index={i}
            onAnswer={(correct) => recordAnswer(i, correct)}
          />
        ))}
        {allAnswered && (
          <div className={styles.scoreBox}>
            <div className={styles.scoreNum}>
              {score} / {activeQuestions.length}
            </div>
            <div className={styles.scoreSub}>
              {score === activeQuestions.length
                ? 'Excellent listening!'
                : 'See the full transcript below.'}
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => setPhase(ListeningPhase.TRANSCRIPT)}
            >
              View Transcript →
            </button>
          </div>
        )}
      </div>
    )
  }

  // Transcript phase
  return (
    <div className={styles.section}>
      <div className={styles.transcriptCard}>
        <div className={styles.sectionBadge}>📜 Transcript</div>
        <div className={styles.dialogueList}>
          {listen.dialogue.map(([speaker, text], i) => (
            <div key={i} className={clsx(styles.dialogueLine, { [styles.lineB]: speaker === 'B' })}>
              <span
                className={clsx(
                  styles.speakerBadge,
                  speaker === 'A' ? styles.speakerBadgeA : styles.speakerBadgeB,
                )}
              >
                {speaker}
              </span>
              <div
                className={clsx(styles.bubble, speaker === 'A' ? styles.bubbleA : styles.bubbleB)}
              >
                {text}
                <div className={styles.bubbleActions}>
                  <button
                    className={styles.listenBubbleBtn}
                    onClick={() => spkV(text, speaker === 'A' ? 'f' : 'm', speed)}
                    aria-label="Listen"
                  >
                    🔈
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {listen.summary && <p className={styles.summary}>{listen.summary}</p>}
      </div>
      <div className={styles.doneRow}>
        <button
          className={styles.btnPrimary}
          onClick={() => onDone({ score, total: activeQuestions.length })}
        >
          Complete ✓
        </button>
      </div>
    </div>
  )
}
