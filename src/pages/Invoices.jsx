import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/format'

const box = 'rounded-lg border border-slate-300 px-3 py-2'
const paidOf = (inv) => (inv.payments || []).reduce((s, p) => s + Number(p.amount), 0)

function NewInvoice({ onSaved }) {
  const [appts, setAppts] = useState([])
  const [id, setId] = useState('')
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState({ t: '', m: '' })
  useEffect(() => {
    supabase.from('appointments').select('id,patient_id,starts_at,patients(full_name),doctors(consultation_fee)')
      .in('status', ['checked_in', 'completed']).order('starts_at', { ascending: false })
      .then(({ data }) => setAppts(data || []))
  }, [])
  function pick(v) { setId(v); setAmount(appts.find((a) => a.id === v)?.doctors?.consultation_fee ?? '') }
  async function create(e) {
    e.preventDefault(); setMsg({ t: '', m: '' })
    const a = appts.find((x) => x.id === id)
    if (!a) return setMsg({ t: 'err', m: 'Select an appointment.' })
    if (!(Number(amount) > 0)) return setMsg({ t: 'err', m: 'Enter a valid amount.' })
    const { error } = await supabase.from('invoices').insert({ patient_id: a.patient_id, appointment_id: a.id, amount: Number(amount) })
    if (error) return setMsg({ t: 'err', m: error.message })
    setMsg({ t: 'ok', m: 'Invoice created.' }); setId(''); setAmount(''); onSaved()
  }
  return (
    <form onSubmit={create} className="mt-6 flex max-w-3xl flex-wrap items-end gap-3 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <div><label htmlFor="ia" className="block text-sm font-medium">Appointment</label>
        <select id="ia" value={id} onChange={(e) => pick(e.target.value)} className={box}>
          <option value="">Select…</option>
          {appts.map((a) => <option key={a.id} value={a.id}>{a.patients?.full_name} · {fmt(a.starts_at)}</option>)}</select></div>
      <div><label htmlFor="am" className="block text-sm font-medium">Amount (₹)</label>
        <input id="am" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-32 ${box}`} /></div>
      <button className="btn-primary">Create invoice</button>
      {msg.m && <p role={msg.t === 'err' ? 'alert' : 'status'} className={msg.t === 'err' ? 'text-red-600' : 'text-green-700'}>{msg.m}</p>}
    </form>
  )
}

function PayForm({ inv, onDone, onError }) {
  const due = Number(inv.amount) - paidOf(inv)
  const [amt, setAmt] = useState(due)
  const [method, setMethod] = useState('cash')
  async function pay() {
    const { error } = await supabase.rpc('record_payment', { p_invoice: inv.id, p_amount: Number(amt), p_method: method })
    if (error) onError(error.message); else { onError(''); onDone() }
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input aria-label="Payment amount" type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} className={`w-24 ${box} py-1`} />
      <select aria-label="Method" value={method} onChange={(e) => setMethod(e.target.value)} className={`${box} py-1`}>
        <option>cash</option><option>card</option><option>upi</option></select>
      <button className="text-brand-600 underline" onClick={pay}>Record payment</button>
    </span>
  )
}

export default function Invoices() {
  const { profile } = useAuth()
  const staff = ['admin', 'receptionist'].includes(profile?.role)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('invoices')
      .select('id,amount,status,created_at,patients(full_name),payments(id,amount,method,paid_at)')
      .order('created_at', { ascending: false })
    if (error) setErr(error.message); else setRows(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Billing</h1>
      {staff && <NewInvoice onSaved={load} />}
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      {loading ? <p className="mt-6 text-slate-500">Loading…</p> : rows.length === 0 ? <p className="mt-6 text-slate-500">No invoices yet.</p> : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              <th className="p-3">Date</th><th className="p-3">Patient</th><th className="p-3">Amount</th><th className="p-3">Paid</th><th className="p-3">Status</th>{staff && <th className="p-3">Action</th>}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{fmt(r.created_at)}</td><td className="p-3">{r.patients?.full_name}</td>
                <td className="p-3">₹{r.amount}</td><td className="p-3">₹{paidOf(r)}</td>
                <td className="p-3 capitalize">{r.status}</td>
                {staff && <td className="p-3">{r.status !== 'paid' && <PayForm inv={r} onDone={load} onError={setErr} />}</td>}
              </tr>))}</tbody>
          </table>
        </div>)}
    </div>
  )
}
