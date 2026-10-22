import { useCallback, useEffect, useMemo, useState } from 'react'
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

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const PAGE = 10

function printInvoice(r, onError) {
  const w = window.open('', '_blank')
  if (!w) return onError('Allow pop-ups to print the invoice.')
  const paid = paidOf(r)
  w.document.write(`<!doctype html><html><head><title>Invoice ${esc(r.id.slice(0, 8))}</title>
<style>body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;color:#222}h1{color:#155e75}
table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}
.note{margin-top:32px;font-size:12px;color:#777}</style></head><body>
<h1>MediCare Hospital</h1><p>Invoice #${esc(r.id.slice(0, 8).toUpperCase())}<br>Date: ${esc(fmt(r.created_at))}</p>
<p><strong>Patient:</strong> ${esc(r.patients?.full_name)}<br><strong>Doctor:</strong> ${esc(r.appointments?.doctors?.profiles?.full_name || '-')}<br>
<strong>Visit:</strong> ${esc(r.appointments?.starts_at ? fmt(r.appointments.starts_at) : '-')}</p>
<table><tr><th>Description</th><th>Amount</th></tr><tr><td>Consultation fee</td><td>INR ${esc(r.amount)}</td></tr>
<tr><td>Paid</td><td>INR ${esc(paid)}</td></tr><tr><td><strong>Balance due</strong></td><td><strong>INR ${esc(Number(r.amount) - paid)}</strong></td></tr></table>
<p>Status: ${esc(r.status)}</p><p class="note">Sample document generated for a demonstration project.</p></body></html>`)
  w.document.close(); w.focus(); w.print()
}

export default function Invoices() {
  const { profile } = useAuth()
  const staff = ['admin', 'receptionist'].includes(profile?.role)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('invoices')
      .select('id,amount,status,created_at,patients(full_name),appointments(starts_at,doctors(profiles(full_name))),payments(id,amount,method,paid_at)')
      .order('created_at', { ascending: false }).limit(500)
    if (error) setErr(error.message); else setRows(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => rows.filter((r) =>
    (status === 'all' || r.status === status) &&
    (r.patients?.full_name || '').toLowerCase().includes(q.toLowerCase())), [rows, status, q])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const shown = filtered.slice(cur * PAGE, cur * PAGE + PAGE)

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Billing</h1>
      {staff && <NewInvoice onSaved={load} />}
      <div className="mt-6 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="iq">Search patient</label>
        <input id="iq" placeholder="Search patient name" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} className={`w-60 ${box}`} />
        <label className="sr-only" htmlFor="is">Status</label>
        <select id="is" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className={box}>
          {['all', 'unpaid', 'partial', 'paid'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}</select>
      </div>
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      {loading ? <p className="mt-6 text-slate-500">Loading…</p> : filtered.length === 0 ? <p className="mt-6 text-slate-500">No invoices found.</p> : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="p-3">Date</th><th className="p-3">Patient</th><th className="p-3">Amount</th><th className="p-3">Paid</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
              <tbody>{shown.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3">{fmt(r.created_at)}</td><td className="p-3">{r.patients?.full_name}</td>
                  <td className="p-3">₹{r.amount}</td><td className="p-3">₹{paidOf(r)}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                  <td className="space-y-1 p-3">
                    <button className="block text-slate-700 underline" onClick={() => printInvoice(r, setErr)}>Print</button>
                    {staff && r.status !== 'paid' && <PayForm inv={r} onDone={load} onError={setErr} />}</td>
                </tr>))}</tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button className="btn-outline py-1" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button>
            <span>Page {cur + 1} of {pages}</span>
            <button className="btn-outline py-1" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
          </div>
        </>)}
    </div>
  )
}
