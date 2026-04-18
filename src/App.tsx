import { useState } from 'react'
import { ProtectedRoute } from '$features/auth'
import { ProfileSelect, Settings, useProfile } from '$features/profile'
import styles from './App.module.css'

function Home() {
  const { profile } = useProfile()
  const [showSettings, setShowSettings] = useState(false)

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Bonjour, {profile?.display_name ?? 'friend'} ☕</h1>
        <p>
          Day {profile?.current_day ?? 1} · Phase {profile?.phase ?? 1}
        </p>
      </header>
      <main className={styles.main}>
        <p className={styles.notice}>Session UI coming in the next phase.</p>
        <button className={styles.settingsButton} onClick={() => setShowSettings(true)}>
          Open settings
        </button>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ProtectedRoute>
      <ProfileSelect>
        <Home />
      </ProfileSelect>
    </ProtectedRoute>
  )
}
