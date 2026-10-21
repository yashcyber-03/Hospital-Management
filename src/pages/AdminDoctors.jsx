import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const box = 'rounded-lg border border-slate-300 px-3 py-2'

export default function AdminDoctors() {
  const { profile } = useAuth()
  const [docs, setDocs] = useState([])
  const [depts, setDepts] = useState([])
  const [f, setF] = useState({ email: '', dept: '', spec: '', fee: '' })
  const [msg, setMsg] = useState({ t: '', m: '' })
  const [fees, setFees] = useState({})

  const load = useCallback(async () => {
    const [d, dp] = await Promise.all([
      supabase.from('doctors').select('id,specialization,consultation_fee,approved,departments(name),profiles(full_name)'),
      supabase.from('departments').select('name').order('name'),
    ])
    if (d.error) setMsg({ t: 'err', m: d.error.message }); else setDocs(d.data)
    setDepts(dp.data || [])
  }, [])
  useEffect(() => { if (profile?.role === 'admin') load() }, [load, profile?.role])

  if (profile && profile.role !== 'admin') return <p className="text-slate-600">Available to administrators only.</p>
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function add(e) {
    e.preventDefault(); setMsg({ t: '', m: '' })
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setMsg({ t: 'err', m: 'Enter a valid email.' })
    if (!f.dept || f.spec.trim().length < 2 || !(Number(f.fee) >= 0) || f.fee === '') return setMsg({ t: 'err', m: 'Fill in department, specialization and fee.' })
    const { error } = await supabase.rpc('admin_make_doctor', { p_email: f.email, p_dept: f.dept, p_spec: f.spec.trim(), p_fee: Number(f.fee) })
    if (error) return setMsg({ t: 'err', m: error.message })
    setMsg({ t: 'ok', m: 'Doctor added. They must log out and in again.' }); setF({ email: '', dept: '', spec: '', fee: '' }); load()
  }
  async function update(id, patch) {
    const { error } = await supabase.from('doctors').update(patch).eq('id', id)
    if (error) setMsg({ t: 'err', m: error.message }); else { setMsg({ t: 'ok', m: 'Saved.' }); load() }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Manage doctors</h1>
      <form onSubmit={add} className="mt-6 grid max-w-3xl gap-3 rounded-xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-2">
        <p className="text-sm text-slate-600 sm:col-span-2">The person must register on the site first. Then enter their email here.</p>
        <div><label htmlFor="de" className="block text-sm font-medium">Registered email</label>
          <input id="de" value={f.email} onChange={set('email')} className={`w-full ${box}`} /></div>
        <div><label htmlFor="dd" className="block text-sm font-medium">Department</label>
          <select id="dd" value={f.dept} onChange={set('dept')} className={`w-full ${box}`}>
            <option value="">Select…</option>{depts.map((d) => <option key={d.name}>{d.name}</option>)}</select></div>
        <div><label htmlFor="ds" className="block text-sm font-medium">Specialization</label>
          <input id="ds" value={f.spec} onChange={set('spec')} className={`w-full ${box}`} /></div>
        <div><label htmlFor="df" className="block text-sm font-medium">Fee (₹)</label>
          <input id="df" type="number" min="0" value={f.fee} onChange={set('fee')} className={`w-full ${box}`} /></div>
        <div className="sm:col-span-2"><button className="btn-primary">Add doctor</button></div>
        {msg.m && <p role={msg.t === 'err' ? 'alert' : 'status'} className={`sm:col-span-2 ${msg.t === 'err' ? 'text-red-600' : 'text-green-700'}`}>{msg.m}</p>}
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>
            <th className="p-3">Doctor</th><th className="p-3">Department</th><th className="p-3">Fee (₹)</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
          <tbody>{docs.map((d) => (
            <tr key={d.id} className="border-t border-slate-100">
              <td className="p-3">{d.profiles?.full_name}<br /><span className="text-slate-500">{d.specialization}</span></td>
              <td className="p-3">{d.departments?.name}</td>
              <td className="p-3"><input aria-label="Fee" type="number" min="0" value={fees[d.id] ?? d.consultation_fee}
                onChange={(e) => setFees({ ...fees, [d.id]: e.target.value })} className={`w-24 ${box} py-1`} />
                <button className="ml-2 text-brand-600 underline" onClick={() => update(d.id, { consultation_fee: Number(fees[d.id] ?? d.consultation_fee) })}>Save</button></td>
              <td className="p-3">{d.approved ? 'Approved' : 'Not approved'}</td>
              <td className="p-3"><button className="text-brand-600 underline" onClick={() => update(d.id, { approved: !d.approved })}>{d.approved ? 'Suspend' : 'Approve'}</button></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
