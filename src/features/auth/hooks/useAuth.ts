import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '$lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithGoogle, signOut }
}
