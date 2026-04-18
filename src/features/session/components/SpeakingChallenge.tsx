import { useState } from 'react'
import type { SpeakContent } from '$types/curriculum'
import type { Track } from '$types/profile'
import { getScaffolding } from '$lib/difficulty'
import { spkV } from '$lib/speech'
import styles from './SpeakingChallenge.module.css'

interface SpeakingChallengeProps {
  speak: SpeakContent
  difficulty: number
  track: Track
  onDone: () => void
}

export default function SpeakingChallenge({
  speak,
  difficulty,
  track,
  onDone,
}: SpeakingChallengeProps) {
  const scaffolding = getScaffolding('speaking', difficulty, track)
  const { modelAnswerVisibility, showSentenceStarters } = scaffolding

  const [attempted, setAttempted] = useState(false)
  const [modelVisible, setModelVisible] = useState(modelAnswerVisibility === 'upfront')
  const [listenActive, setListenActive] = useState(false)

  function handleListen() {
    setListenActive(true)
    spkV(speak.modelAnswer, 'f', 0.75)
    setTimeout(() => setListenActive(false), 2500)
  }

  const showStarters = showSentenceStarters || modelAnswerVisibility === 'upfront'
  const showAttemptBtn = !modelVisible && modelAnswerVisibility === 'after_attempt' && !attempted
  const showRevealBtn = !modelVisible && (attempted || modelAnswerVisibility === 'on_request')
  const canComplete = modelVisible

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <div className={styles.sectionBadge}>🎙 Speaking</div>

        <div className={styles.scenarioLabel}>Scenario</div>
        <p className={styles.scenario}>{speak.scenario}</p>

        <div className={styles.taskBox}>
          <div className={styles.taskLabel}>Your task</div>
          <ul className={styles.keyPhrases}>
            {speak.keyPhrases.map((phrase, i) => (
              <li key={i} className={styles.keyPhrase}>
                {phrase}
              </li>
            ))}
          </ul>
        </div>

        {showStarters && (
          <div className={styles.startersBox}>
            <div className={styles.startersLabel}>💡 Sentence starters</div>
            <ul className={styles.startersList}>
              {speak.keyPhrases.map((phrase, i) => (
                <li key={i} className={styles.starterItem}>
                  {phrase}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!modelVisible && (
          <p className={styles.trySpeaking}>Try speaking aloud before checking the model answer.</p>
        )}

        <div className={styles.actionRow}>
          {showAttemptBtn && (
            <button className={styles.btnSecondary} onClick={() => setAttempted(true)}>
              I've tried speaking
            </button>
          )}
          {showRevealBtn && (
            <button className={styles.btnSecondary} onClick={() => setModelVisible(true)}>
              Show Model Answer
            </button>
          )}
        </div>

        {modelVisible && (
          <div className={styles.modelCard}>
            <div className={styles.modelLabel}>Model Answer</div>
            <p className={styles.modelFrench}>{speak.modelAnswer}</p>
            <div className={styles.modelListenRow}>
              <button className={styles.listenBtn} onClick={handleListen}>
                {listenActive ? '🔊 Playing…' : '🔈 Listen'}
              </button>
            </div>
            <p className={styles.modelEnglish}>{speak.modelAnswerExplanation}</p>
            {speak.tip && <div className={styles.tipBox}>💡 {speak.tip}</div>}
          </div>
        )}
      </div>

      {canComplete && (
        <div className={styles.doneRow}>
          <button className={styles.btnPrimary} onClick={onDone}>
            Complete ✓
          </button>
        </div>
      )}
    </div>
  )
}
