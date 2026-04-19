import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { SectionType } from '$lib/difficulty'
import { Settings, useProfile } from '$features/profile'
import type { UserProfile } from '$types/profile'
import { useDayContent } from '$session/hooks/useDayContent'
import { useSession } from '$session/hooks/useSession'
import { SessionSectionKey, SessionStep } from '$session/constants'
import type { SectionResults } from '$session/types'
import { getEffectiveDifficulty } from '$features/profile/hooks/useProfile'
import { DB_NOT_CONNECTED_MSG, supabase } from '$lib/supabase'
import VocabCard from '$session/components/VocabCard'
import ListeningWidget from '$session/components/ListeningWidget'
import GrammarDrill from '$session/components/GrammarDrill'
import SpeakingChallenge from '$session/components/SpeakingChallenge'
import RevisionSection from '$session/components/RevisionSection'
import SessionComplete from '$session/components/SessionComplete'
import styles from './Session.module.css'

interface SectionMeta {
  key: SessionSectionKey
  title: string
  hint: string
  icon: string
}

const CONTENT_SECTIONS: SectionMeta[] = [
  { key: SessionSectionKey.Vocab, title: 'Vocabulary', hint: 'Words & quick quiz', icon: '📚' },
  {
    key: SessionSectionKey.Listening,
    title: 'Listening',
    hint: 'Dialogue & comprehension',
    icon: '🎧',
  },
  { key: SessionSectionKey.Grammar, title: 'Grammar', hint: 'Explanation & drills', icon: '✍️' },
  { key: SessionSectionKey.Speaking, title: 'Speaking', hint: 'Scenario practice', icon: '🗣️' },
]

const REVISION_SECTION: SectionMeta = {
  key: SessionSectionKey.Revision,
  title: 'Revision',
  hint: 'Review flagged words',
  icon: '🔁',
}

function isRevisionDayNumber(day: number): boolean {
  return day % 4 === 0
}

function contentIndexFor(day: number): number {
  return day - Math.floor(day / 4)
}

export default function Session() {
  const { profile } = useProfile()
  const [showSettings, setShowSettings] = useState(false)
  const [priorProfile, setPriorProfile] = useState<UserProfile | null>(null)
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null)
  const [sessionNonce, setSessionNonce] = useState(0)

  const effectiveProfile = localProfile ?? profile

  if (!effectiveProfile) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.loadingCard}>Chargement…</div>
        </div>
      </div>
    )
  }

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  return (
    <SessionInner
      key={effectiveProfile.id + ':' + sessionNonce}
      profile={effectiveProfile}
      priorProfile={priorProfile ?? effectiveProfile}
      onProfileSaved={(next) => setLocalProfile(next)}
      onSessionStart={() => setPriorProfile(effectiveProfile)}
      onReturnHome={() => {
        setPriorProfile(null)
        setSessionNonce((n) => n + 1)
      }}
      onOpenSettings={() => setShowSettings(true)}
    />
  )
}

interface SessionInnerProps {
  profile: UserProfile
  priorProfile: UserProfile
  onProfileSaved: (next: UserProfile) => void
  onSessionStart: () => void
  onReturnHome: () => void
  onOpenSettings: () => void
}

function SessionInner({
  profile,
  priorProfile,
  onProfileSaved,
  onSessionStart,
  onReturnHome,
  onOpenSettings,
}: SessionInnerProps) {
  const revisionDay = isRevisionDayNumber(profile.current_day)
  const fetchDay = revisionDay ? profile.current_day : contentIndexFor(profile.current_day)
  const { content, loading, error, isRevisionDay } = useDayContent(profile.phase, fetchDay)

  const session = useSession({
    profile,
    dayContent: content,
    isRevisionDay: revisionDay || isRevisionDay,
    onProfileSaved,
  })

  const { step } = session
  const dbDisconnected = !supabase

  if (loading || session.hydrating) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.loadingCard}>Préparation de la séance…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={clsx(styles.notice, styles.errorNotice)}>
            Couldn't load today's lesson: {error}
          </div>
        </div>
      </div>
    )
  }

  if (step === SessionStep.Complete) {
    return (
      <SessionComplete
        profile={profile}
        priorProfile={priorProfile}
        results={session.results}
        skippedAsKnown={session.skippedAsKnown}
        onReturnHome={onReturnHome}
      />
    )
  }

  if (step === SessionStep.Error) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={clsx(styles.notice, styles.errorNotice)}>
            Couldn't save your progress: {session.saveError ?? 'unknown error'}
          </div>
          <button className={styles.retryBtn} onClick={() => void session.actions.retryCommit()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (step === SessionStep.Saving) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.loadingCard}>Enregistrement de la séance…</div>
        </div>
      </div>
    )
  }

  if (step === SessionStep.Home) {
    return (
      <HomeScreen
        profile={profile}
        dbDisconnected={dbDisconnected}
        saveError={session.saveError}
        isRevisionDay={revisionDay || isRevisionDay}
        canSkipKnown={session.canSkipKnown}
        results={session.results}
        onStart={() => {
          onSessionStart()
          session.actions.start()
        }}
        onSkipKnown={() => {
          onSessionStart()
          void session.actions.skipKnown()
        }}
        onOpenSettings={onOpenSettings}
      />
    )
  }

  // Active section rendering.
  if (step === SessionStep.Revision) {
    return (
      <ActiveSection profile={profile}>
        <RevisionSection
          flaggedWords={session.flaggedWords}
          onDone={(mastered) => void session.actions.completeRevision(mastered)}
        />
      </ActiveSection>
    )
  }

  if (!content) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={clsx(styles.notice, styles.errorNotice)}>
            Content unavailable for this day.
          </div>
        </div>
      </div>
    )
  }

  if (step === SessionStep.Vocab) {
    return (
      <ActiveSection profile={profile}>
        <VocabCard
          words={content.vocab[profile.track]}
          quizQuestions={content.quiz[profile.track]}
          track={profile.track}
          difficulty={getEffectiveDifficulty(profile, SectionType.Vocab)}
          hidePronunciation={profile.hide_pronunciation}
          onDone={(result) => void session.actions.completeSection(SectionType.Vocab, result)}
        />
      </ActiveSection>
    )
  }

  if (step === SessionStep.Listening) {
    return (
      <ActiveSection profile={profile}>
        <ListeningWidget
          listen={content.listen[profile.track]}
          difficulty={getEffectiveDifficulty(profile, SectionType.Listening)}
          track={profile.track}
          onDone={(result) => void session.actions.completeSection(SectionType.Listening, result)}
        />
      </ActiveSection>
    )
  }

  if (step === SessionStep.Grammar) {
    return (
      <ActiveSection profile={profile}>
        <GrammarDrill
          grammar={content.grammar[profile.track]}
          difficulty={getEffectiveDifficulty(profile, SectionType.Grammar)}
          track={profile.track}
          onDone={(result) => void session.actions.completeSection(SectionType.Grammar, result)}
        />
      </ActiveSection>
    )
  }

  if (step === SessionStep.Speaking) {
    return (
      <ActiveSection profile={profile}>
        <SpeakingChallenge
          speak={content.speak[profile.track]}
          difficulty={getEffectiveDifficulty(profile, SectionType.Speaking)}
          track={profile.track}
          onDone={() =>
            void session.actions.completeSection(SectionType.Speaking, { score: 0, total: 0 })
          }
        />
      </ActiveSection>
    )
  }

  return null
}

interface HomeScreenProps {
  profile: UserProfile
  dbDisconnected: boolean
  saveError: string | null
  isRevisionDay: boolean
  canSkipKnown: boolean
  results: SectionResults
  onStart: () => void
  onSkipKnown: () => void
  onOpenSettings: () => void
}

function HomeScreen({
  profile,
  dbDisconnected,
  saveError,
  isRevisionDay,
  canSkipKnown,
  results,
  onStart,
  onSkipKnown,
  onOpenSettings,
}: HomeScreenProps) {
  const sections = useMemo<SectionMeta[]>(
    () => (isRevisionDay ? [REVISION_SECTION] : CONTENT_SECTIONS),
    [isRevisionDay],
  )

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <span className={styles.brand}>☕ Café Français</span>
          <button className={styles.settingsBtn} onClick={onOpenSettings}>
            Settings
          </button>
        </div>

        <div className={styles.heroCard}>
          <span className={styles.dayLabel}>Phase {profile.phase}</span>
          <h1 className={styles.heroTitle}>
            Jour {profile.current_day}
            {isRevisionDay ? ' · Révision' : ''}
          </h1>
          <p className={styles.heroSub}>
            {isRevisionDay
              ? 'Quick review of the words you flagged this week.'
              : `Bonjour, ${profile.display_name}. Ready for today's session?`}
          </p>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{profile.streak}</div>
              <div className={styles.statLabel}>Streak</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{profile.flagged_words.length}</div>
              <div className={styles.statLabel}>Flagged</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{profile.streak_shields}</div>
              <div className={styles.statLabel}>Shields</div>
            </div>
          </div>
        </div>

        {dbDisconnected && <div className={styles.notice}>{DB_NOT_CONNECTED_MSG}</div>}
        {saveError && !dbDisconnected && (
          <div className={clsx(styles.notice, styles.errorNotice)}>{saveError}</div>
        )}

        <div className={styles.sectionList}>
          {sections.map((section, idx) => {
            const done = section.key !== SessionSectionKey.Revision && section.key in results
            const isNext = !done && idx === sections.findIndex((s) => !(s.key in results))
            return (
              <button
                key={section.key}
                className={clsx(styles.sectionCard, {
                  [styles.sectionCardDone]: done,
                  [styles.sectionCardNext]: isNext,
                })}
                onClick={onStart}
              >
                <span className={styles.sectionIcon}>{section.icon}</span>
                <span className={styles.sectionMain}>
                  <span className={styles.sectionTitle}>{section.title}</span>
                  <span className={styles.sectionHint}>{section.hint}</span>
                </span>
                <span
                  className={clsx(styles.sectionStatus, {
                    [styles.sectionStatusDone]: done,
                    [styles.sectionStatusNext]: isNext,
                  })}
                >
                  {done ? 'Done' : isNext ? 'Next' : ''}
                </span>
              </button>
            )
          })}
        </div>

        {canSkipKnown && (
          <div className={styles.skipRow}>
            <button className={styles.skipBtn} onClick={onSkipKnown}>
              Skip — I already know today's topic
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ActiveSectionProps {
  profile: UserProfile
  children: React.ReactNode
}

function ActiveSection({ profile, children }: ActiveSectionProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <span className={styles.brand}>
            ☕ Jour {profile.current_day}
            {isRevisionDayNumber(profile.current_day) ? ' · Révision' : ''}
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

export type { SessionStep }
