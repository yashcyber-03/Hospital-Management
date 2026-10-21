import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const day = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

// Clearly labeled synthetic data, shown only when the database has no appointments or payments yet.
const DEMO = {
  workload: [{ name: 'Dr. A', count: 18 }, { name: 'Dr. B', count: 12 }, { name: 'Dr. C', count: 7 }],
  trend: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => ({ name, count: [5, 8, 6, 9, 7, 4][i] })),
  revenue: ['Jul', 'Aug', 'Sep', 'Oct'].map((name, i) => ({ name, total: [42000, 51000, 47500, 60000][i] })),
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-brand-700">{value ?? '…'}</p>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="mb-3 font-semibold text-brand-900">{title}</h2>
      <div className="h-64">{children}</div>
    </section>
  )
}

export default function Analytics() {
  const { profile } = useAuth()
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (profile?.role !== 'admin') return
    async function load() {
      const nowIso = new Date().toISOString()
      const count = (q) => q.then(({ count: c, error }) => { if (error) throw error; return c ?? 0 })
      try {
        const [patients, doctors, upcoming, completed, cancelled, appts, pays] = await Promise.all([
          count(supabase.from('patients').select('id', { count: 'exact', head: true })),
          count(supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('approved', true)),
          count(supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'booked').gte('starts_at', nowIso)),
          count(supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed')),
          count(supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'cancelled')),
          supabase.from('appointments').select('starts_at,status,doctors(profiles(full_name))').limit(2000),
          supabase.from('payments').select('amount,paid_at').limit(2000),
        ])
        if (appts.error) throw appts.error
        if (pays.error) throw pays.error
        const byDoc = {}, byDay = {}, byMonth = {}
        appts.data.forEach((a) => {
          if (a.status === 'cancelled') return
          const n = a.doctors?.profiles?.full_name || 'Unknown'
          byDoc[n] = (byDoc[n] || 0) + 1
          const k = day(a.starts_at); byDay[k] = (byDay[k] || 0) + 1
        })
        pays.data.forEach((p) => { const k = day(p.paid_at).slice(0, 7); byMonth[k] = (byMonth[k] || 0) + Number(p.amount) })
        const empty = appts.data.length === 0 && pays.data.length === 0
        setD({
          stats: { patients, doctors, upcoming, completed, cancelled }, empty,
          workload: Object.entries(byDoc).map(([name, c]) => ({ name, count: c })),
          trend: Object.entries(byDay).sort().slice(-14).map(([name, c]) => ({ name: name.slice(5), count: c })),
          revenue: Object.entries(byMonth).sort().map(([name, total]) => ({ name, total })),
        })
      } catch (e) { setErr(e.message) }
    }
    load()
  }, [profile?.role])

  if (profile && profile.role !== 'admin') return <p className="text-slate-600">Analytics is available to administrators only.</p>
  const s = d?.stats || {}
  const w = d?.empty ? DEMO.workload : d?.workload
  const t = d?.empty ? DEMO.trend : d?.trend
  const r = d?.empty ? DEMO.revenue : d?.revenue

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Hospital analytics</h1>
      {err && <p role="alert" className="mt-4 text-red-600">{err}</p>}
      {d?.empty && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        The charts below show <strong>synthetic demonstration data</strong> because the database has no appointments or payments yet. The counts above are real.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Patients" value={s.patients} /><Stat label="Doctors" value={s.doctors} />
        <Stat label="Upcoming" value={s.upcoming} /><Stat label="Completed" value={s.completed} /><Stat label="Cancelled" value={s.cancelled} />
      </div>
      {d && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card title="Doctor workload (appointments)">
            <ResponsiveContainer><BarChart data={w}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0e7490" /></BarChart></ResponsiveContainer></Card>
          <Card title="Appointment trend (last 14 days)">
            <ResponsiveContainer><LineChart data={t}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="count" stroke="#0891b2" strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
          <div className="lg:col-span-2"><Card title="Monthly revenue (₹, from recorded payments)">
            <ResponsiveContainer><BarChart data={r}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#155e75" /></BarChart></ResponsiveContainer></Card></div>
        </div>)}
    </div>
  )
}
