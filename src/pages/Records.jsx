import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'

const emptyRx = { medicine: '', dosage: '', duration: '' }
const box = 'rounded-lg border border-slate-300 px-3 py-2'

function ConsultForm({ onSaved }) {
  const { session } = useAuth()
  const [appts, setAppts] = useState([])
  const [apptId, setApptId] = useState('')
  const [notes, setNotes] = useState('')
  const [rx, setRx] = useState([{ ...emptyRx }])
  const [msg, setMsg] = useState({ t: '', m: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('appointments').select('id,patient_id,starts_at,status,patients(full_name)')
      .in('status', ['booked', 'checked_in', 'completed']).order('starts_at', { ascending: false })
      .then(({ data }) => setAppts(data || []))
  }, [])

  const setRow = (i, k, v) => setRx(rx.map((r, j) => (j === i ? { ...r, [k]: v } : r)))

  async function save(e) {
    e.preventDefault()
    setMsg({ t: '', m: '' })
    const appt = appts.find((a) => a.id === apptId)
    if (!appt) return setMsg({ t: 'err', m: 'Select an appointment.' })
    if (notes.trim().length < 3) return setMsg({ t: 'err', m: 'Enter consultation notes.' })
    const items = rx.filter((r) => r.medicine.trim())
    if (items.some((r) => !r.dosage.trim())) return setMsg({ t: 'err', m: 'Every medicine needs a dosage.' })
    setBusy(true)
    const { data: doc, error: e0 } = await supabase.from('doctors').select('id').eq('profile_id', session.user.id).single()
    if (e0) { setBusy(false); return setMsg({ t: 'err', m: e0.message }) }
    const { data: rec, error: e1 } = await supabase.from('medical_records')
      .insert({ patient_id: appt.patient_id, doctor_id: doc.id, appointment_id: appt.id, notes: notes.trim() }).select('id').single()
    if (e1) { setBusy(false); return setMsg({ t: 'err', m: e1.message }) }
    if (items.length) {
      const { data: p, error: e2 } = await supabase.from('prescriptions')
        .insert({ record_id: rec.id, patient_id: appt.patient_id, doctor_id: doc.id }).select('id').single()
      if (e2) { setBusy(false); return setMsg({ t: 'err', m: e2.message }) }
      const { error: e3 } = await supabase.from('prescription_items')
        .insert(items.map((r) => ({ prescription_id: p.id, medicine: r.medicine.trim(), dosage: r.dosage.trim(), duration: r.duration.trim() || null })))
      if (e3) { setBusy(false); return setMsg({ t: 'err', m: e3.message }) }
    }
    setBusy(false)
    setMsg({ t: 'ok', m: 'Consultation saved.' }); setNotes(''); setRx([{ ...emptyRx }]); setApptId(''); onSaved()
  }

  return (
    <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-xl bg-white p-6 ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-brand-900">New consultation note</h2>
      <div><label htmlFor="ap" className="text-sm font-medium">Appointment</label>
        <select id="ap" value={apptId} onChange={(e) => setApptId(e.target.value)} className={`mt-1 block w-full ${box}`}>
          <option value="">Select…</option>
          {appts.map((a) => <option key={a.id} value={a.id}>{a.patients?.full_name} · {fmt(a.starts_at)} · {a.status}</option>)}
        </select></div>
      <div><label htmlFor="nt" className="text-sm font-medium">Notes</label>
        <textarea id="nt" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className={`mt-1 block w-full ${box}`} /></div>
      <fieldset><legend className="text-sm font-medium">Prescription (optional)</legend>
        {rx.map((r, i) => (
          <div key={i} className="mt-2 grid gap-2 sm:grid-cols-3">
            <input aria-label="Medicine" placeholder="Medicine" value={r.medicine} onChange={(e) => setRow(i, 'medicine', e.target.value)} className={box} />
            <input aria-label="Dosage" placeholder="Dosage" value={r.dosage} onChange={(e) => setRow(i, 'dosage', e.target.value)} className={box} />
            <input aria-label="Duration" placeholder="Duration" value={r.duration} onChange={(e) => setRow(i, 'duration', e.target.value)} className={box} />
          </div>))}
        <button type="button" className="mt-2 text-sm text-brand-600 underline" onClick={() => setRx([...rx, { ...emptyRx }])}>+ Add medicine</button>
      </fieldset>
      {msg.m && <p role={msg.t === 'err' ? 'alert' : 'status'} className={msg.t === 'err' ? 'text-red-600' : 'text-green-700'}>{msg.m}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save consultation'}</button>
    </form>
  )
}

export default function Records() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('medical_records')
      .select('id,notes,created_at,patients(full_name),doctors(profiles(full_name)),prescriptions(id,prescription_items(id,medicine,dosage,duration))')
      .order('created_at', { ascending: false })
    if (error) setErr(error.message); else setRows(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Medical records &amp; prescriptions</h1>
      {profile?.role === 'doctor' && <ConsultForm onSaved={load} />}
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      {loading ? <p className="mt-6 text-slate-500">Loading…</p> : rows.length === 0 ? <p className="mt-6 text-slate-500">No records yet.</p> : (
        <div className="mt-6 space-y-4">{rows.map((r) => (
          <article key={r.id} className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{fmt(r.created_at)} · {r.patients?.full_name} · Dr. {r.doctors?.profiles?.full_name}</p>
            <p className="mt-2 whitespace-pre-wrap">{r.notes}</p>
            {r.prescriptions?.map((p) => (
              <ul key={p.id} className="mt-3 list-disc pl-5 text-sm text-slate-700">
                {p.prescription_items?.map((it) => <li key={it.id}>{it.medicine} — {it.dosage}{it.duration ? `, ${it.duration}` : ''}</li>)}
              </ul>))}
          </article>))}</div>)}
    </div>
  )
}
