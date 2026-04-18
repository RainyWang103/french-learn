import { useState } from 'react'
import { supabase } from '$lib/supabase'
import { useAuth } from '$features/auth/hooks/useAuth'
import styles from './GoogleSignIn.module.css'

export default function GoogleSignIn() {
  const { signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const dbConnected = supabase !== null

  async function handleSignIn() {
    setSigningIn(true)
    await signInWithGoogle()
    setSigningIn(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>French Tutor ☕</h1>
        <p className={styles.subtitle}>
          Your cozy daily French companion. Sign in to track your progress and keep your streak
          alive.
        </p>
        <button
          className={styles.button}
          onClick={handleSignIn}
          disabled={!dbConnected || signingIn}
        >
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {!dbConnected && <p className={styles.notice}>Database not configured yet</p>}
      </div>
    </div>
  )
}
