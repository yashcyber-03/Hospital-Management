import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'

const STATUSES = ['booked', 'checked_in', 'completed', 'no_show']

export default function Appointments() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('appointments')
      .select('id,starts_at,status,reason,patients(full_name),doctors(profiles(full_name))')
      .order('starts_at', { ascending: false })
    if (error) setErr(error.message); else setRows(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function cancel(id) {
    if (!window.confirm('Cancel this appointment?')) return
    const { error } = await supabase.rpc('cancel_appointment', { p_id: id })
    if (error) setErr(error.message); else { setErr(''); load() }
  }
  async function setStatus(id, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) setErr(error.message); else { setErr(''); load() }
  }
  const canManage = profile?.role !== 'patient'

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Appointments</h1>
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      {loading ? <p className="mt-6 text-slate-500">Loading…</p> : rows.length === 0 ? <p className="mt-6 text-slate-500">No appointments yet.</p> : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              <th className="p-3">When</th><th className="p-3">Patient</th><th className="p-3">Doctor</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{fmt(r.starts_at)}</td>
                <td className="p-3">{r.patients?.full_name}</td>
                <td className="p-3">{r.doctors?.profiles?.full_name}</td>
                <td className="p-3">{canManage && r.status !== 'cancelled' ? (
                  <select aria-label="Status" value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded border border-slate-300 px-2 py-1">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>) : r.status}</td>
                <td className="p-3">{r.status === 'booked' && <button className="text-red-600 underline" onClick={() => cancel(r.id)}>Cancel</button>}</td>
              </tr>))}</tbody>
          </table>
        </div>)}
    </div>
  )
}
