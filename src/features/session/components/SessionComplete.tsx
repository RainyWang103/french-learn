import type { UserProfile } from '$types/profile'
import { SectionType } from '$lib/difficulty'
import type { SectionResults, SectionScore } from '$session/types'
import styles from './SessionComplete.module.css'

interface SessionCompleteProps {
  profile: UserProfile
  priorProfile: UserProfile
  results: SectionResults
  skippedAsKnown: boolean
  onReturnHome: () => void
}

interface DifficultyShift {
  section: SectionType
  from: number
  to: number
}

const SECTION_LABELS: Record<SectionType, string> = {
  [SectionType.Vocab]: 'Vocab',
  [SectionType.Grammar]: 'Grammar',
  [SectionType.Listening]: 'Listening',
  [SectionType.Speaking]: 'Speaking',
}

const DIFFICULTY_SECTIONS: readonly SectionType[] = [
  SectionType.Vocab,
  SectionType.Grammar,
  SectionType.Listening,
  SectionType.Speaking,
]

function difficultyShifts(prior: UserProfile, after: UserProfile): DifficultyShift[] {
  return DIFFICULTY_SECTIONS.flatMap((section) => {
    const key = `difficulty_${section}` as const
    const from = prior[key]
    const to = after[key]
    if (Math.abs(from - to) < 0.05) {
      return []
    }
    return [{ section, from, to }]
  })
}

function milestoneFor(streak: number): string | null {
  if (streak === 7) {
    return '🎉 One-week streak!'
  }
  if (streak === 30) {
    return '🔥 30 days in a row!'
  }
  if (streak === 100) {
    return '🏆 100-day streak!'
  }
  if (streak > 0 && streak % 50 === 0) {
    return `🏆 ${streak}-day streak!`
  }
  return null
}

export default function SessionComplete({
  profile,
  priorProfile,
  results,
  skippedAsKnown,
  onReturnHome,
}: SessionCompleteProps) {
  const shifts = difficultyShifts(priorProfile, profile)
  const milestone = milestoneFor(profile.streak)
  const scoreEntries = (Object.entries(results) as [SectionType, SectionScore][]).filter(
    ([, score]) => score.total > 0,
  )

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.card}>
          <div className={styles.celebration}>{skippedAsKnown ? '✨' : '☕'}</div>
          <h1 className={styles.title}>{skippedAsKnown ? 'Day skipped' : 'Séance terminée!'}</h1>
          <p className={styles.subtitle}>
            {skippedAsKnown
              ? "You marked today's topic as already known — day advanced."
              : 'Nicely done. Come back tomorrow for the next lesson.'}
          </p>

          {milestone && <div className={styles.milestone}>{milestone}</div>}

          {scoreEntries.length > 0 && (
            <div className={styles.scoreGrid}>
              {scoreEntries.map(([section, score]) => (
                <div key={section} className={styles.scoreTile}>
                  <div className={styles.scoreTileLabel}>{SECTION_LABELS[section]}</div>
                  <div className={styles.scoreTileValue}>
                    {score.score}/{score.total}
                  </div>
                </div>
              ))}
            </div>
          )}

          {shifts.length > 0 && (
            <div className={styles.adjustment}>
              <div>Difficulty adjusted:</div>
              {shifts.map(({ section, from, to }) => (
                <div key={section} className={styles.adjustmentItem}>
                  <span className={styles.adjustmentLabel}>{SECTION_LABELS[section]}</span>
                  <span className={to < from ? styles.adjustmentEasier : styles.adjustmentHarder}>
                    {from.toFixed(1)} → {to.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className={styles.farewell}>
            Streak: {profile.streak} · Next: Jour {profile.current_day}
          </p>

          <button className={styles.primaryBtn} onClick={onReturnHome}>
            À demain ☕
          </button>
        </div>
      </div>
    </div>
  )
}
