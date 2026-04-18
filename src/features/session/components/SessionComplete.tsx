import type { UserProfile } from '$types/profile'
import type { SectionType } from '$lib/difficulty'
import type { SectionScore } from '$session/hooks/useSession'
import styles from './SessionComplete.module.css'

interface SessionCompleteProps {
  profile: UserProfile
  priorProfile: UserProfile
  results: Partial<Record<SectionType, SectionScore>>
  skippedAsKnown: boolean
  onReturnHome: () => void
}

interface DifficultyShift {
  section: SectionType
  from: number
  to: number
}

function difficultyShifts(prior: UserProfile, after: UserProfile): DifficultyShift[] {
  const sections: SectionType[] = ['vocab', 'grammar', 'listening', 'speaking']
  return sections.flatMap((section) => {
    const key = `difficulty_${section}` as const
    const from = prior[key]
    const to = after[key]
    if (Math.abs(from - to) < 0.05) return []
    return [{ section, from, to }]
  })
}

function scoreLabel(section: SectionType): string {
  switch (section) {
    case 'vocab':
      return 'Vocab'
    case 'grammar':
      return 'Grammar'
    case 'listening':
      return 'Listening'
    case 'speaking':
      return 'Speaking'
  }
}

function milestoneFor(streak: number): string | null {
  if (streak === 7) return '🎉 One-week streak!'
  if (streak === 30) return '🔥 30 days in a row!'
  if (streak === 100) return '🏆 100-day streak!'
  if (streak > 0 && streak % 50 === 0) return `🏆 ${streak}-day streak!`
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
                  <div className={styles.scoreTileLabel}>{scoreLabel(section)}</div>
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
                  <span className={styles.adjustmentLabel}>{scoreLabel(section)}</span>
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
