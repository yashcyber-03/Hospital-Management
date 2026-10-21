import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export default function Overview() {
  const { profile } = useAuth()
  const [n, setN] = useState(null)
  useEffect(() => {
    supabase.from('appointments').select('id', { count: 'exact', head: true })
      .eq('status', 'booked').gte('starts_at', new Date().toISOString())
      .then(({ count }) => setN(count ?? 0))
  }, [])
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Welcome, {profile?.full_name || 'there'}</h1>
      <div className="mt-6 max-w-xs rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Upcoming appointments</p>
        <p className="text-3xl font-bold text-brand-700">{n ?? '…'}</p>
      </div>
    </div>
  )
}
