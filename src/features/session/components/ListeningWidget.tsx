import { useState } from 'react'
import type { ListenContent } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spkV } from '$lib/speech'
import { listeningQuestionToDrill } from '../utils/quiz'
import type { DrillQuestion } from '../utils/quiz'
import { useQuizAnswers } from '../hooks/useQuizAnswers'
import { useDialoguePlayer } from '../hooks/useDialoguePlayer'
import QuizItem from './QuizItem'
import ProgressBar from './ProgressBar'
import styles from './ListeningWidget.module.css'

interface ListeningWidgetProps {
  listen: ListenContent
  difficulty: number
  track: Track
  onDone: (result: { score: number; total: number }) => void
}

type Phase = 'listen' | 'questions' | 'transcript'

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

  const [phase, setPhase] = useState<Phase>(showTranscriptUpfront ? 'transcript' : 'listen')
  const [replaysUsed, setReplaysUsed] = useState(0)
  const { isPlaying, play } = useDialoguePlayer(listen.dialogue, speed)
  const { answeredCount, allAnswered, score, recordAnswer } = useQuizAnswers(activeQuestions.length)

  const replaysRemaining = maxReplays === -1 ? Infinity : maxReplays - replaysUsed
  const canReplay = replaysRemaining > 0

  function handleReplay() {
    if (!canReplay) return
    setReplaysUsed((n) => n + 1)
    play()
  }

  if (phase === 'listen') {
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
          <button className={styles.btnSecondary} onClick={() => setPhase('questions')}>
            Answer Questions →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'questions') {
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
            <button className={styles.btnPrimary} onClick={() => setPhase('transcript')}>
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
            <div
              key={i}
              className={[styles.dialogueLine, speaker === 'B' ? styles.lineB : ''].join(' ')}
            >
              <span
                className={[
                  styles.speakerBadge,
                  speaker === 'A' ? styles.speakerBadgeA : styles.speakerBadgeB,
                ].join(' ')}
              >
                {speaker}
              </span>
              <div
                className={[styles.bubble, speaker === 'A' ? styles.bubbleA : styles.bubbleB].join(
                  ' ',
                )}
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
