import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  HeartPulse, LayoutDashboard, Stethoscope, CalendarDays, FileText, CreditCard, BarChart3, Users,
  ClipboardList, Bell, User, Clock, ScrollText, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const role = profile?.role

  // Close the phone menu after navigating, and when Escape is pressed.
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const links = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    ...(role === 'patient' ? [{ to: '/app/doctors', label: 'Find doctors', icon: Stethoscope }] : []),
    { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/app/notifications', label: 'Notifications', icon: Bell },
    { to: '/app/profile', label: 'My profile', icon: User },
    ...(role === 'doctor' ? [{ to: '/app/hours', label: 'Working hours', icon: Clock }] : []),
    ...(['patient', 'doctor', 'admin'].includes(role) ? [{ to: '/app/records', label: 'Records', icon: FileText }] : []),
    ...(['patient', 'receptionist', 'admin'].includes(role) ? [{ to: '/app/billing', label: 'Billing', icon: CreditCard }] : []),
    ...(['receptionist', 'admin'].includes(role) ? [{ to: '/app/reception', label: 'Reception desk', icon: ClipboardList }] : []),
    ...(role === 'admin' ? [{ to: '/app/analytics', label: 'Analytics', icon: BarChart3 }] : []),
    ...(role === 'admin' ? [{ to: '/app/manage-doctors', label: 'Manage doctors', icon: Users }] : []),
    ...(role === 'admin' ? [{ to: '/app/audit', label: 'Audit log', icon: ScrollText }] : []),
  ]
  const cls = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`

  return (
    <div className="min-h-screen md:flex">
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Laptop: normal sidebar. Phone: slide-in menu opened by the three-line button. */}
      <aside id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform duration-200 md:static md:w-60 md:shrink-0 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-brand-700"><HeartPulse className="h-5 w-5" aria-hidden="true" /> MediCare</div>
          <button className="rounded p-1 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Dashboard">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={cls}><Icon className="h-4 w-4" aria-hidden="true" />{label}</NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Open menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" aria-hidden="true" /></button>
            <span className="text-sm text-slate-600">{profile?.full_name || 'User'} · <span className="capitalize">{role}</span></span>
          </div>
          <button className="btn-outline" onClick={async () => { await signOut(); nav('/') }}>
            <LogOut className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Log out</span></button>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
