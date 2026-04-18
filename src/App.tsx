import { ProtectedRoute } from '$features/auth'
import styles from './App.module.css'

function MainApp() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>French Learn</h1>
        <p>Your cozy French learning companion</p>
      </header>
      <main className={styles.main}>
        <p className={styles.notice}>Setting up… Connect Supabase credentials to get started.</p>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  )
}
