// ProtectedRoute.jsx — redirects to /login if the user is not signed in
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Still checking session — show nothing to avoid a flash
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="h-8 w-8 border-4 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in — send to login page
  if (!user) return <Navigate to="/login" replace />

  return children
}
