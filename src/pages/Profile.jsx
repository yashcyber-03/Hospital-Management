import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const box = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'

export default function Profile() {
  const { profile, session } = useAuth()
  const isPatient = profile?.role === 'patient'
  const [f, setF] = useState({ name: '', phone: '', dob: '', gender: '' })
  const [pid, setPid] = useState(null)
  const [m, setM] = useState({ t: '', m: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!profile) return
    setF((x) => ({ ...x, name: profile.full_name || '', phone: profile.phone || '' }))
    if (isPatient) {
      supabase.from('patients').select('id,dob,gender').eq('profile_id', session.user.id).single()
        .then(({ data }) => { if (data) { setPid(data.id); setF((x) => ({ ...x, dob: data.dob || '', gender: data.gender || '' })) } })
    }
  }, [profile, isPatient, session])

  async function save(e) {
    e.preventDefault(); setM({ t: '', m: '' })
    if (f.name.trim().length < 2) return setM({ t: 'err', m: 'Enter your full name.' })
    if (f.phone && !/^\+?\d{7,15}$/.test(f.phone.replace(/[\s-]/g, ''))) return setM({ t: 'err', m: 'Enter a valid phone number.' })
    if (f.dob && new Date(f.dob) > new Date()) return setM({ t: 'err', m: 'Date of birth cannot be in the future.' })
    const a = await supabase.from('profiles').update({ full_name: f.name.trim(), phone: f.phone || null }).eq('id', session.user.id)
    if (a.error) return setM({ t: 'err', m: a.error.message })
    if (isPatient && pid) {
      const b = await supabase.from('patients').update({ full_name: f.name.trim(), phone: f.phone || null, dob: f.dob || null, gender: f.gender || null }).eq('id', pid)
      if (b.error) return setM({ t: 'err', m: b.error.message })
    }
    setM({ t: 'ok', m: 'Profile saved. The top bar updates the next time you log in.' })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">My profile</h1>
      <form onSubmit={save} className="mt-6 max-w-lg space-y-4 rounded-xl bg-white p-6 ring-1 ring-slate-200">
        <div><label htmlFor="n" className="text-sm font-medium">Full name</label><input id="n" className={box} value={f.name} onChange={set('name')} /></div>
        <div><label htmlFor="p" className="text-sm font-medium">Phone</label><input id="p" className={box} value={f.phone} onChange={set('phone')} /></div>
        {isPatient && (<div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="d" className="text-sm font-medium">Date of birth</label><input id="d" type="date" className={box} value={f.dob} onChange={set('dob')} /></div>
          <div><label htmlFor="g" className="text-sm font-medium">Gender</label>
            <select id="g" className={box} value={f.gender} onChange={set('gender')}><option value="">—</option><option>Female</option><option>Male</option><option>Other</option></select></div>
        </div>)}
        <p className="text-sm text-slate-500">Role: <span className="capitalize">{profile?.role}</span> (only an administrator can change it)</p>
        {m.m && <p role={m.t === 'err' ? 'alert' : 'status'} className={m.t === 'err' ? 'text-red-600' : 'text-green-700'}>{m.m}</p>}
        <button className="btn-primary">Save profile</button>
      </form>
    </div>
  )
}
