import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { fmtTime } from '../utils/format'

const box = 'w-full rounded-lg border border-slate-300 px-3 py-2'
const Msg = ({ m }) => m.m ? <p role={m.t === 'err' ? 'alert' : 'status'} className={m.t === 'err' ? 'text-red-600' : 'text-green-700'}>{m.m}</p> : null

function NewPatient({ onSaved }) {
  const [f, setF] = useState({ name: '', phone: '', dob: '', gender: '' })
  const [m, setM] = useState({ t: '', m: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function save(e) {
    e.preventDefault(); setM({ t: '', m: '' })
    if (f.name.trim().length < 2) return setM({ t: 'err', m: 'Enter the patient name.' })
    if (f.phone && !/^\+?\d{7,15}$/.test(f.phone.replace(/[\s-]/g, ''))) return setM({ t: 'err', m: 'Enter a valid phone number.' })
    if (f.dob && new Date(f.dob) > new Date()) return setM({ t: 'err', m: 'Date of birth cannot be in the future.' })
    const { error } = await supabase.from('patients').insert({ full_name: f.name.trim(), phone: f.phone || null, dob: f.dob || null, gender: f.gender || null })
    if (error) return setM({ t: 'err', m: error.message })
    setM({ t: 'ok', m: 'Patient registered.' }); setF({ name: '', phone: '', dob: '', gender: '' }); onSaved()
  }
  return (
    <form onSubmit={save} className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="font-semibold text-brand-900">Register walk-in patient</h2>
      <div><label htmlFor="pn" className="text-sm font-medium">Full name</label><input id="pn" className={box} value={f.name} onChange={set('name')} /></div>
      <div><label htmlFor="pp" className="text-sm font-medium">Phone (optional)</label><input id="pp" className={box} value={f.phone} onChange={set('phone')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="pd" className="text-sm font-medium">Date of birth</label><input id="pd" type="date" className={box} value={f.dob} onChange={set('dob')} /></div>
        <div><label htmlFor="pg" className="text-sm font-medium">Gender</label>
          <select id="pg" className={box} value={f.gender} onChange={set('gender')}><option value="">—</option><option>Female</option><option>Male</option><option>Other</option></select></div>
      </div>
      <Msg m={m} /><button className="btn-primary">Register patient</button>
    </form>
  )
}

function BookForPatient({ patients, doctors }) {
  const [q, setQ] = useState('')
  const [pid, setPid] = useState('')
  const [did, setDid] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [reason, setReason] = useState('')
  const [m, setM] = useState({ t: '', m: '' })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const list = patients.filter((p) => p.full_name.toLowerCase().includes(q.toLowerCase())).slice(0, 50)

  useEffect(() => {
    setSlot(''); setSlots([])
    if (!did || !date) return
    supabase.rpc('get_available_slots', { p_doctor: did, p_date: date })
      .then(({ data, error }) => error ? setM({ t: 'err', m: error.message }) : setSlots(data))
  }, [did, date])

  async function book() {
    setM({ t: '', m: '' })
    const { error } = await supabase.rpc('book_appointment', { p_doctor: did, p_patient: pid, p_start: slot, p_reason: reason || null })
    if (error) return setM({ t: 'err', m: error.message })
    setM({ t: 'ok', m: 'Appointment booked.' }); setSlot(''); setSlots([]); setDate('')
  }
  return (
    <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="font-semibold text-brand-900">Book for a patient</h2>
      <div><label htmlFor="bq" className="text-sm font-medium">Search patient</label><input id="bq" className={box} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div><label htmlFor="bp" className="text-sm font-medium">Patient</label>
        <select id="bp" className={box} value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">Select…</option>{list.map((p) => <option key={p.id} value={p.id}>{p.full_name}{p.phone ? ` · ${p.phone}` : ''}</option>)}</select></div>
      <div><label htmlFor="bd" className="text-sm font-medium">Doctor</label>
        <select id="bd" className={box} value={did} onChange={(e) => setDid(e.target.value)}>
          <option value="">Select…</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.profiles?.full_name} · {d.specialization}</option>)}</select></div>
      <div><label htmlFor="bt" className="text-sm font-medium">Date</label><input id="bt" type="date" min={today} className={box} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      {did && date && (slots.length === 0 ? <p className="text-sm text-slate-500">No free slots on this date.</p> :
        <div className="flex flex-wrap gap-2">{slots.map((s) => (
          <button key={s.slot_start} type="button" onClick={() => setSlot(s.slot_start)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${slot === s.slot_start ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:bg-slate-100'}`}>{fmtTime(s.slot_start)}</button>))}</div>)}
      <div><label htmlFor="br" className="text-sm font-medium">Reason (optional)</label><input id="br" className={box} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <Msg m={m} /><button className="btn-primary" disabled={!pid || !slot} onClick={book}>Confirm booking</button>
    </section>
  )
}

export default function ReceptionDesk() {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const [p, d] = await Promise.all([
      supabase.from('patients').select('id,full_name,phone').order('full_name').limit(500),
      supabase.from('doctors').select('id,specialization,profiles(full_name)').eq('approved', true),
    ])
    if (p.error || d.error) setErr((p.error || d.error).message)
    setPatients(p.data || []); setDoctors(d.data || [])
  }, [])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Reception desk</h1>
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><NewPatient onSaved={load} /><BookForPatient patients={patients} doctors={doctors} /></div>
    </div>
  )
}
