import { ReactNode } from 'react'
import { useAuth } from '$features/auth/hooks/useAuth'
import GoogleSignIn from '$features/auth/components/GoogleSignIn'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <GoogleSignIn />
  }

  return <>{children}</>
}
