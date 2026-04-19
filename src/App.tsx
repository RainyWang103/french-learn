import { ProtectedRoute } from '$features/auth'
import { ProfileSelect } from '$features/profile'
import { Session } from '$features/session'

export default function App() {
  return (
    <ProtectedRoute>
      <ProfileSelect>
        <Session />
      </ProfileSelect>
    </ProtectedRoute>
  )
}
