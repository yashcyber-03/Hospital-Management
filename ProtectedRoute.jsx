import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="p-10 text-center text-slate-500" role="status">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}
