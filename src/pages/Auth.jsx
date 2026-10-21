import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../services/supabase'

export default function Auth({ mode }) {
  const isRegister = mode === 'register'
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (!isSupabaseConfigured) return setErr('Supabase is not configured yet.')
    if (isRegister && f.name.trim().length < 2) return setErr('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address.')
    if (f.password.length < 8) return setErr('Password must be at least 8 characters.')
    setBusy(true)
    const { data, error } = isRegister ? await signUp(f.email, f.password, f.name.trim()) : await signIn(f.email, f.password)
    setBusy(false)
    if (error) return setErr(error.message)
    if (isRegister && !data.session) return setMsg('Account created. Check your email to confirm, then log in.')
    nav('/app')
  }

  const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-8 shadow ring-1 ring-slate-200" noValidate>
        <h1 className="text-2xl font-bold text-brand-900">{isRegister ? 'Create patient account' : 'Log in'}</h1>
        {isRegister && (<div><label htmlFor="n" className="text-sm font-medium">Full name</label>
          <input id="n" className={input} value={f.name} onChange={set('name')} autoComplete="name" /></div>)}
        <div><label htmlFor="e" className="text-sm font-medium">Email</label>
          <input id="e" type="email" className={input} value={f.email} onChange={set('email')} autoComplete="email" /></div>
        <div><label htmlFor="p" className="text-sm font-medium">Password</label>
          <input id="p" type="password" className={input} value={f.password} onChange={set('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'} /></div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        {msg && <p role="status" className="text-sm text-green-700">{msg}</p>}
        <button className="btn-primary w-full justify-center" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}</button>
        <p className="text-center text-sm text-slate-600">
          {isRegister ? <>Have an account? <Link className="text-brand-600 underline" to="/login">Log in</Link></>
            : <>New here? <Link className="text-brand-600 underline" to="/register">Register</Link></>}
        </p>
      </form>
    </main>
  )
}
