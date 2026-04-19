import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { useAuth } from '$features/auth/hooks/useAuth'
import { useProfile } from '$features/profile/hooks/useProfile'
import type { Track } from '$features/profile/types'
import styles from './ProfileSelect.module.css'

interface ProfileSelectProps {
  children: ReactNode
}

export default function ProfileSelect({ children }: ProfileSelectProps) {
  const { user } = useAuth()
  const { profile, loading, error, createProfile } = useProfile()

  const [displayName, setDisplayName] = useState(
    () => (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '',
  )
  const [track, setTrack] = useState<Track>('standard')
  const [startingDay, setStartingDay] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading your profile…</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Setup unavailable</h1>
          <p className={styles.subtitle}>{error}</p>
        </div>
      </div>
    )
  }

  if (profile) {
    return <>{children}</>
  }

  const trimmedName = displayName.trim()
  const dayValid = Number.isInteger(startingDay) && startingDay >= 1 && startingDay <= 84
  const canSubmit = trimmedName.length > 0 && dayValid && !submitting

  async function handleSubmit() {
    if (!canSubmit) {
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createProfile(trimmedName, { track, startingDay })
    } catch (createError) {
      setSubmitError(createError instanceof Error ? createError.message : String(createError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome ☕</h1>
        <p className={styles.subtitle}>Let's set up your French journey.</p>

        <label className={styles.field}>
          <span className={styles.label}>Your name</span>
          <input
            className={styles.input}
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="What should we call you?"
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Track</span>
          <div className={styles.segmented}>
            <button
              type="button"
              className={clsx(styles.segment, { [styles.segmentActive]: track === 'standard' })}
              onClick={() => setTrack('standard')}
            >
              Standard
            </button>
            <button
              type="button"
              className={clsx(styles.segment, { [styles.segmentActive]: track === 'advanced' })}
              onClick={() => setTrack('advanced')}
            >
              Advanced
            </button>
          </div>
          <p className={styles.help}>
            {track === 'standard'
              ? 'Cozy pace — 5 words per session, gentle scaffolding.'
              : 'Stretch yourself — 7 words per session, fewer hints.'}
          </p>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Starting day</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={84}
            value={startingDay}
            onChange={(event) => setStartingDay(Number(event.target.value))}
          />
          <p className={styles.help}>Day 1–84. Use 1 if you're new to French.</p>
        </label>

        {submitError && <p className={styles.error}>{submitError}</p>}

        <button className={styles.primary} onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Start learning'}
        </button>
      </div>
    </div>
  )
}
