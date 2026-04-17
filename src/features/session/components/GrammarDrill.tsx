import { useState } from 'react'
import type { GrammarContent } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spk } from '$lib/speech'
import QuizItem, { type DrillQuestion } from './QuizItem'
import styles from './GrammarDrill.module.css'

interface GrammarDrillProps {
  grammar: GrammarContent
  difficulty: number
  track: Track
  onDone: (result: { score: number; total: number }) => void
}

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

function ListenBtnSmall({ text }: { text: string }) {
  const [active, setActive] = useState(false)
  function handleClick() {
    setActive(true)
    spk(text, 0.75)
    setTimeout(() => setActive(false), 1600)
  }
  return (
    <button className={styles.listenBtnSmall} onClick={handleClick} aria-label="Listen">
      {active ? '🔊' : '🔈'}
    </button>
  )
}

export default function GrammarDrill({ grammar, difficulty, track, onDone }: GrammarDrillProps) {
  const scaffolding = getScaffolding('grammar', difficulty, track)
  const { showExplanation, drillCount, showWorkedExamples } = scaffolding

  const [phase, setPhase] = useState<'learn' | 'drill'>('learn')
  const [answers, setAnswers] = useState<Record<number, boolean>>({})

  const activeDrills: DrillQuestion[] = grammar.drills.slice(0, drillCount).map((d) => ({
    type: d.type,
    question: d.question,
    options: d.options,
    correctAnswer: d.correctAnswer,
    explanation: d.explanation,
  }))

  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === activeDrills.length

  if (phase === 'learn') {
    return (
      <div className={styles.section}>
        <div className={styles.card}>
          <div className={styles.sectionBadge}>✏️ Grammar</div>
          <h2 className={styles.grammarTitle}>{grammar.title}</h2>

          {showExplanation && <p className={styles.explanation}>{grammar.explanation}</p>}

          <div className={styles.fieldLabel}>Examples</div>
          <div className={styles.examplesList}>
            {grammar.examples.map((example, i) => (
              <div key={i} className={styles.exampleRow}>
                <div className={styles.exampleContent}>
                  <div className={styles.exampleFr}>{example.french}</div>
                  {showWorkedExamples && <div className={styles.exampleEn}>{example.english}</div>}
                </div>
                <ListenBtnSmall text={example.french} />
              </div>
            ))}
          </div>

          <button className={styles.startDrillsBtn} onClick={() => setPhase('drill')}>
            Start Drills →
          </button>
        </div>
      </div>
    )
  }

  const score = Object.values(answers).filter(Boolean).length
  return (
    <div className={styles.section}>
      <ProgressBar current={answeredCount} total={activeDrills.length} label="Grammar Drills" />
      {activeDrills.map((q, i) => (
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
            {score} / {activeDrills.length}
          </div>
          <div className={styles.scoreSub}>
            {score === activeDrills.length
              ? 'Parfait!'
              : score >= activeDrills.length * 0.8
                ? 'Très bien!'
                : 'Continuez à pratiquer!'}
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => onDone({ score, total: activeDrills.length })}
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
