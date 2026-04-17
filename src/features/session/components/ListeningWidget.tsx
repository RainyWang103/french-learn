import { useRef, useState } from 'react'
import type { ListenContent } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spkV } from '$lib/speech'
import { countAnswered, countCorrect, listeningQuestionToDrill } from '../utils/quiz'
import { computeLineDuration } from '../utils/dialogue'
import type { DrillQuestion } from '../utils/quiz'
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

  const [phase, setPhase] = useState<Phase>(showTranscriptUpfront ? 'transcript' : 'listen')
  const [replaysUsed, setReplaysUsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const timeoutsRef = useRef<number[]>([])

  const activeQuestions: DrillQuestion[] = listen.questions
    .slice(0, questionCount)
    .map(listeningQuestionToDrill)

  const answeredCount = countAnswered(answers)
  const allAnswered = answeredCount === activeQuestions.length
  const replaysRemaining = maxReplays === -1 ? Infinity : maxReplays - replaysUsed
  const canReplay = replaysRemaining > 0

  function playDialogue(playbackSpeed = speed) {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setIsPlaying(true)

    let delay = 0
    listen.dialogue.forEach(([speaker, text]) => {
      const id = window.setTimeout(() => {
        spkV(text, speaker === 'A' ? 'f' : 'm', playbackSpeed)
      }, delay)
      timeoutsRef.current.push(id)
      delay += computeLineDuration(text)
    })

    const doneId = window.setTimeout(() => setIsPlaying(false), delay + 200)
    timeoutsRef.current.push(doneId)
  }

  function handlePlay() {
    playDialogue()
  }

  function handleReplay() {
    if (!canReplay) return
    setReplaysUsed((n) => n + 1)
    playDialogue()
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
            <button className={styles.btnPrimary} onClick={handlePlay} disabled={isPlaying}>
              {isPlaying ? '▶ Playing…' : '▶ Play'}
            </button>
            {speed > 0.65 && (
              <button
                className={styles.btnGhost}
                onClick={() => playDialogue(speed * 0.75)}
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
    const score = countCorrect(answers)
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
            onAnswer={(correct) => setAnswers((prev) => ({ ...prev, [i]: correct }))}
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
  const score = countCorrect(answers)
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
