import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { fmtTime } from '../utils/format'

function BookModal({ doctor, onClose }) {
  const { session } = useAuth()
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  useEffect(() => {
    if (!date) return
    setSlot(''); setSlots([])
    supabase.rpc('get_available_slots', { p_doctor: doctor.id, p_date: date })
      .then(({ data, error }) => error ? setMsg({ type: 'err', text: error.message }) : setSlots(data))
  }, [date, doctor.id])

  async function book() {
    setMsg({ type: '', text: '' })
    const { data: pt, error: e1 } = await supabase.from('patients').select('id').eq('profile_id', session.user.id).single()
    if (e1) return setMsg({ type: 'err', text: 'Patient profile not found.' })
    const { error } = await supabase.rpc('book_appointment', { p_doctor: doctor.id, p_patient: pt.id, p_start: slot, p_reason: reason || null })
    if (error) return setMsg({ type: 'err', text: error.message })
    setMsg({ type: 'ok', text: 'Appointment booked!' }); setSlots([]); setSlot('')
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Book appointment" className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold text-brand-900">Book with {doctor.profiles?.full_name}</h2>
        <div><label htmlFor="d" className="text-sm font-medium">Date</label>
          <input id="d" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" /></div>
        {date && (slots.length === 0 ? <p className="text-sm text-slate-500">No free slots on this date.</p> :
          <div className="flex flex-wrap gap-2">{slots.map((s) => (
            <button key={s.slot_start} type="button" onClick={() => setSlot(s.slot_start)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${slot === s.slot_start ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:bg-slate-100'}`}>{fmtTime(s.slot_start)}</button>))}</div>)}
        <div><label htmlFor="r" className="text-sm font-medium">Reason (optional)</label>
          <input id="r" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
        {msg.text && <p role={msg.type === 'err' ? 'alert' : 'status'} className={msg.type === 'err' ? 'text-red-600' : 'text-green-700'}>{msg.text}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Close</button>
          <button className="btn-primary" disabled={!slot} onClick={book}>Confirm booking</button>
        </div>
      </div>
    </div>
  )
}

export default function Doctors() {
  const [docs, setDocs] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(null)

  useEffect(() => {
    supabase.from('doctors').select('id,specialization,consultation_fee,departments(name),profiles(full_name)')
      .then(({ data, error }) => { if (error) setErr(error.message); else setDocs(data); setLoading(false) })
  }, [])

  const list = docs.filter((d) => `${d.profiles?.full_name} ${d.specialization} ${d.departments?.name}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Find a doctor</h1>
      <label htmlFor="s" className="sr-only">Search doctors</label>
      <input id="s" placeholder="Search by name, specialization or department" value={q} onChange={(e) => setQ(e.target.value)}
        className="mt-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2" />
      {loading && <p className="mt-6 text-slate-500">Loading…</p>}
      {err && <p role="alert" className="mt-6 text-red-600">{err}</p>}
      {!loading && !err && list.length === 0 && <p className="mt-6 text-slate-500">No doctors found. An admin must add doctors first (see README).</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <article key={d.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold">{d.profiles?.full_name}</h2>
            <p className="text-sm text-slate-600">{d.specialization} · {d.departments?.name}</p>
            <p className="mt-1 text-sm">Fee: ₹{d.consultation_fee}</p>
            <button className="btn-primary mt-4" onClick={() => setSel(d)}>Book appointment</button>
          </article>))}
      </div>
      {sel && <BookModal doctor={sel} onClose={() => setSel(null)} />}
    </div>
  )
}
