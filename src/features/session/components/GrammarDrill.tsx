import { useState } from 'react'
import type { GrammarContent } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spk } from '$lib/speech'
import { grammarDrillItemToDrill } from '$session/utils/quiz'
import type { DrillQuestion } from '$session/utils/quiz'
import { useQuizAnswers } from '$session/hooks/useQuizAnswers'
import { GrammarPhase } from '$session/constants'
import QuizItem from './QuizItem'
import ProgressBar from './ProgressBar'
import styles from './GrammarDrill.module.css'

interface GrammarDrillProps {
  grammar: GrammarContent
  difficulty: number
  track: Track
  onDone: (result: { score: number; total: number }) => void
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

  const [phase, setPhase] = useState<GrammarPhase>(GrammarPhase.LEARN)

  const activeDrills: DrillQuestion[] = grammar.drills
    .slice(0, drillCount)
    .map(grammarDrillItemToDrill)

  const { answeredCount, allAnswered, score, recordAnswer } = useQuizAnswers(activeDrills.length)

  if (phase === GrammarPhase.LEARN) {
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

          <button className={styles.startDrillsBtn} onClick={() => setPhase(GrammarPhase.DRILL)}>
            Start Drills →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <ProgressBar current={answeredCount} total={activeDrills.length} label="Grammar Drills" />
      {activeDrills.map((q, i) => (
        <QuizItem key={i} question={q} index={i} onAnswer={(correct) => recordAnswer(i, correct)} />
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
