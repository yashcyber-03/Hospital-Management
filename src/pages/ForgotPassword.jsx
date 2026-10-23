import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

const box = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [m, setM] = useState({ t: '', m: '' })
  async function send(e) {
    e.preventDefault(); setM({ t: '', m: '' })
    if (!supabase) return setM({ t: 'err', m: 'Supabase is not configured yet.' })
    if (!/^\S+@\S+\.\S+$/.test(email)) return setM({ t: 'err', m: 'Enter a valid email address.' })
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })
    if (error) return setM({ t: 'err', m: error.message })
    setM({ t: 'ok', m: 'If that email has an account, a reset link has been sent.' })
  }
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={send} className="space-y-4 rounded-2xl bg-white p-8 shadow ring-1 ring-slate-200" noValidate>
        <h1 className="text-2xl font-bold text-brand-900">Forgot password</h1>
        <div><label htmlFor="fe" className="text-sm font-medium">Email</label><input id="fe" type="email" className={box} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {m.m && <p role={m.t === 'err' ? 'alert' : 'status'} className={m.t === 'err' ? 'text-red-600' : 'text-green-700'}>{m.m}</p>}
        <button className="btn-primary w-full justify-center">Send reset link</button>
        <p className="text-center text-sm"><Link className="text-brand-600 underline" to="/login">Back to log in</Link></p>
      </form>
    </main>
  )
}

export function ResetPassword() {
  const [pw, setPw] = useState('')
  const [m, setM] = useState({ t: '', m: '' })
  async function save(e) {
    e.preventDefault(); setM({ t: '', m: '' })
    if (pw.length < 8) return setM({ t: 'err', m: 'Password must be at least 8 characters.' })
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return setM({ t: 'err', m: error.message + ' (open this page from the link in your email)' })
    setM({ t: 'ok', m: 'Password updated. You can now continue.' })
  }
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={save} className="space-y-4 rounded-2xl bg-white p-8 shadow ring-1 ring-slate-200" noValidate>
        <h1 className="text-2xl font-bold text-brand-900">Set a new password</h1>
        <div><label htmlFor="np" className="text-sm font-medium">New password</label><input id="np" type="password" autoComplete="new-password" className={box} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {m.m && <p role={m.t === 'err' ? 'alert' : 'status'} className={m.t === 'err' ? 'text-red-600' : 'text-green-700'}>{m.m}</p>}
        <button className="btn-primary w-full justify-center">Update password</button>
        <p className="text-center text-sm"><Link className="text-brand-600 underline" to="/app">Go to dashboard</Link></p>
      </form>
    </main>
  )
}
