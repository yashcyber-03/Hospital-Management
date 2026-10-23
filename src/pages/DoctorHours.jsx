import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const box = 'rounded-lg border border-slate-300 px-3 py-2'
const hm = (t) => t.slice(0, 5)

export default function DoctorHours() {
  const { session, profile } = useAuth()
  const [did, setDid] = useState(null)
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ weekday: '1', start: '09:00', end: '13:00', mins: '30' })
  const [m, setM] = useState({ t: '', m: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const load = useCallback(async () => {
    const d = await supabase.from('doctors').select('id').eq('profile_id', session.user.id).single()
    if (d.error) return setM({ t: 'err', m: 'Doctor profile not found.' })
    setDid(d.data.id)
    const s = await supabase.from('doctor_schedules').select('*').eq('doctor_id', d.data.id).order('weekday').order('start_time')
    if (s.error) setM({ t: 'err', m: s.error.message }); else setRows(s.data)
  }, [session])
  useEffect(() => { if (profile?.role === 'doctor') load() }, [load, profile?.role])

  if (profile && profile.role !== 'doctor') return <p className="text-slate-600">Available to doctors only.</p>

  async function add(e) {
    e.preventDefault(); setM({ t: '', m: '' })
    if (f.end <= f.start) return setM({ t: 'err', m: 'End time must be after start time.' })
    const clash = rows.some((r) => String(r.weekday) === f.weekday && f.start < hm(r.end_time) && f.end > hm(r.start_time))
    if (clash) return setM({ t: 'err', m: 'This overlaps an existing working period on that day.' })
    const { error } = await supabase.from('doctor_schedules').insert({ doctor_id: did, weekday: Number(f.weekday), start_time: f.start, end_time: f.end, slot_minutes: Number(f.mins) })
    if (error) return setM({ t: 'err', m: error.message })
    setM({ t: 'ok', m: 'Working hours added.' }); load()
  }
  async function del(id) {
    if (!window.confirm('Remove this working period? Existing appointments are not affected.')) return
    const { error } = await supabase.from('doctor_schedules').delete().eq('id', id)
    if (error) setM({ t: 'err', m: error.message }); else load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">My working hours</h1>
      <form onSubmit={add} className="mt-6 flex max-w-3xl flex-wrap items-end gap-3 rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <div><label htmlFor="wd" className="block text-sm font-medium">Day</label>
          <select id="wd" className={box} value={f.weekday} onChange={set('weekday')}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
        <div><label htmlFor="ws" className="block text-sm font-medium">From</label><input id="ws" type="time" className={box} value={f.start} onChange={set('start')} /></div>
        <div><label htmlFor="we" className="block text-sm font-medium">To</label><input id="we" type="time" className={box} value={f.end} onChange={set('end')} /></div>
        <div><label htmlFor="wm" className="block text-sm font-medium">Slot (min)</label>
          <select id="wm" className={box} value={f.mins} onChange={set('mins')}>{[15, 20, 30, 45, 60].map((n) => <option key={n}>{n}</option>)}</select></div>
        <button className="btn-primary">Add</button>
        {m.m && <p role={m.t === 'err' ? 'alert' : 'status'} className={`w-full ${m.t === 'err' ? 'text-red-600' : 'text-green-700'}`}>{m.m}</p>}
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Day</th><th className="p-3">Hours</th><th className="p-3">Slot</th><th className="p-3">Action</th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td className="p-3 text-slate-500" colSpan={4}>No working hours set. Patients cannot book you until you add some.</td></tr> :
            rows.map((r) => (<tr key={r.id} className="border-t border-slate-100"><td className="p-3">{DAYS[r.weekday]}</td><td className="p-3">{hm(r.start_time)} – {hm(r.end_time)}</td>
              <td className="p-3">{r.slot_minutes} min</td><td className="p-3"><button className="text-red-600 underline" onClick={() => del(r.id)}>Remove</button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
