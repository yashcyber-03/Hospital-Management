import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'

export default function AuditLog() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [names, setNames] = useState({})
  const [err, setErr] = useState('')
  useEffect(() => {
    if (profile?.role !== 'admin') return
    async function load() {
      const { data, error } = await supabase.from('audit_logs').select('id,actor,action,table_name,row_id,created_at').order('created_at', { ascending: false }).limit(100)
      if (error) return setErr(error.message)
      setRows(data)
      const ids = [...new Set(data.map((r) => r.actor).filter(Boolean))]
      if (ids.length) {
        const p = await supabase.from('profiles').select('id,full_name').in('id', ids)
        setNames(Object.fromEntries((p.data || []).map((x) => [x.id, x.full_name])))
      }
    }
    load()
  }, [profile?.role])
  if (profile && profile.role !== 'admin') return <p className="text-slate-600">Available to administrators only.</p>
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Audit log</h1>
      <p className="mt-1 text-sm text-slate-500">Latest 100 events: bookings, cancellations, payments and doctor creation.</p>
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Time</th><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Table</th><th className="p-3">Record</th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td className="p-3 text-slate-500" colSpan={5}>No events yet.</td></tr> :
            rows.map((r) => (<tr key={r.id} className="border-t border-slate-100"><td className="p-3">{fmt(r.created_at)}</td>
              <td className="p-3">{names[r.actor] || (r.actor ? r.actor.slice(0, 8) : 'system')}</td><td className="p-3">{r.action}</td>
              <td className="p-3">{r.table_name}</td><td className="p-3 font-mono text-xs">{(r.row_id || '').slice(0, 12)}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
