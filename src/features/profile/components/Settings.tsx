import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { difficultyLabel, type SectionType } from '$lib/difficulty'
import { useProfile } from '$features/profile/hooks/useProfile'
import { getEffectiveDifficulty } from '$features/profile/hooks/useProfile'
import type { Track, UserProfile } from '$features/profile/types'
import styles from './Settings.module.css'

const WORD_COUNT_OPTIONS = [3, 5, 7, 10] as const
const SESSIONS_PER_DAY_OPTIONS = [1, 2] as const
const PLAYBACK_SPEED_OPTIONS = [0.6, 0.8, 1.0] as const
const DIFFICULTY_BAND_OPTIONS = [1.0, 2.0, 3.0, 4.0] as const

const DIFFICULTY_SECTIONS: { key: SectionType; label: string }[] = [
  { key: 'vocab', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'listening', label: 'Listening' },
  { key: 'speaking', label: 'Speaking' },
]

interface SettingsProps {
  onClose?: () => void
}

export default function Settings({ onClose }: SettingsProps) {
  const { profile, loading, error, saveProfile } = useProfile()
  const [draft, setDraft] = useState<UserProfile | null>(profile)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    setDraft(profile)
  }, [profile])

  const dirty = useMemo(() => {
    if (!draft || !profile) return false
    return JSON.stringify(draft) !== JSON.stringify(profile)
  }, [draft, profile])

  if (loading) return <p className={styles.muted}>Loading…</p>
  if (error && !profile) return <p className={styles.error}>{error}</p>
  if (!draft) return null

  function patch(update: Partial<UserProfile>) {
    setDraft((current) => (current ? { ...current, ...update } : current))
    setSavedAt(null)
  }

  function setOverride(section: SectionType, value: number) {
    patch({ [`difficulty_${section}_override`]: value } as Partial<UserProfile>)
  }

  function clearOverride(section: SectionType) {
    patch({ [`difficulty_${section}_override`]: null } as Partial<UserProfile>)
  }

  async function handleSave() {
    if (!draft || !dirty) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveProfile(draft)
      setSavedAt(Date.now())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          {onClose && (
            <button type="button" className={styles.closeButton} onClick={onClose}>
              Close
            </button>
          )}
        </header>

        <Section title="Track">
          <div className={styles.segmented}>
            {(['standard', 'advanced'] as Track[]).map((option) => (
              <button
                key={option}
                type="button"
                className={clsx(styles.segment, { [styles.segmentActive]: draft.track === option })}
                onClick={() => patch({ track: option })}
              >
                {option === 'standard' ? 'Standard' : 'Advanced'}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Starting day">
          <input
            className={styles.input}
            type="number"
            min={1}
            max={84}
            value={draft.starting_day}
            onChange={(event) => patch({ starting_day: Number(event.target.value) })}
          />
        </Section>

        <Section title="Words per session">
          <ButtonGroup
            options={WORD_COUNT_OPTIONS}
            value={draft.word_count}
            onChange={(value) => patch({ word_count: value })}
          />
        </Section>

        <Section title="Sessions per day">
          <ButtonGroup
            options={SESSIONS_PER_DAY_OPTIONS}
            value={draft.sessions_per_day}
            onChange={(value) => patch({ sessions_per_day: value })}
          />
        </Section>

        <Section title="Playback speed">
          <ButtonGroup
            options={PLAYBACK_SPEED_OPTIONS}
            value={draft.playback_speed}
            onChange={(value) => patch({ playback_speed: value })}
            format={(value) => `${value.toFixed(1)}×`}
          />
        </Section>

        <Section title="Skip known topics">
          <Toggle
            checked={draft.skip_known_enabled}
            onChange={(value) => patch({ skip_known_enabled: value })}
          />
        </Section>

        <Section title="Hide pronunciation">
          <Toggle
            checked={draft.hide_pronunciation}
            onChange={(value) => patch({ hide_pronunciation: value })}
          />
        </Section>

        <Section title="Difficulty overrides">
          <div className={styles.difficultyTable}>
            {DIFFICULTY_SECTIONS.map(({ key, label }) => {
              const override = draft[`difficulty_${key}_override`]
              const effective = getEffectiveDifficulty(draft, key)
              return (
                <div key={key} className={styles.difficultyRow}>
                  <div className={styles.difficultyLabel}>
                    <span>{label}</span>
                    <span className={styles.difficultyMeta}>
                      {override === null ? 'auto' : 'manual'} · {difficultyLabel(effective)}
                    </span>
                  </div>
                  <div className={styles.difficultyButtons}>
                    {DIFFICULTY_BAND_OPTIONS.map((band) => (
                      <button
                        key={band}
                        type="button"
                        className={clsx(styles.bandButton, {
                          [styles.bandButtonActive]: override === band,
                        })}
                        onClick={() => setOverride(key, band)}
                      >
                        {difficultyLabel(band)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.resetLink}
                    onClick={() => clearOverride(key)}
                    disabled={override === null}
                  >
                    Reset to auto
                  </button>
                </div>
              )
            })}
          </div>
        </Section>

        {saveError && <p className={styles.error}>{saveError}</p>}

        <div className={styles.footer}>
          {savedAt && !dirty && <span className={styles.savedHint}>Saved</span>}
          <button
            type="button"
            className={styles.primary}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

interface ButtonGroupProps<T extends number> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  format?: (value: T) => string
}

function ButtonGroup<T extends number>({ options, value, onChange, format }: ButtonGroupProps<T>) {
  return (
    <div className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={clsx(styles.segment, { [styles.segmentActive]: value === option })}
          onClick={() => onChange(option)}
        >
          {format ? format(option) : option}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={clsx(styles.toggle, { [styles.toggleOn]: checked })}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}
