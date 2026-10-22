import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { fmt } from '../utils/format'

export default function Notifications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('notifications').select('id,message,read,created_at').order('created_at', { ascending: false }).limit(50)
    if (error) setErr(error.message); else setRows(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  async function mark(ids) {
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids)
    if (error) setErr(error.message); else load()
  }
  const unread = rows.filter((r) => !r.read).map((r) => r.id)
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Notifications</h1>
        <button className="btn-outline py-1" disabled={!unread.length} onClick={() => mark(unread)}>Mark all as read</button>
      </div>
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      {loading ? <p className="mt-6 text-slate-500">Loading…</p> : rows.length === 0 ? <p className="mt-6 text-slate-500">No notifications yet.</p> : (
        <ul className="mt-6 space-y-2">{rows.map((r) => (
          <li key={r.id} className={`flex items-start justify-between gap-3 rounded-xl p-4 ring-1 ring-slate-200 ${r.read ? 'bg-white' : 'bg-brand-50'}`}>
            <div><p className={r.read ? 'text-slate-600' : 'font-medium'}>{r.message}</p><p className="text-xs text-slate-500">{fmt(r.created_at)}</p></div>
            {!r.read && <button className="text-sm text-brand-600 underline" onClick={() => mark([r.id])}>Mark read</button>}
          </li>))}</ul>)}
    </div>
  )
}
