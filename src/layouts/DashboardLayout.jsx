import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { HeartPulse, LayoutDashboard, Stethoscope, CalendarDays, FileText, CreditCard, BarChart3, Users, ClipboardList, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const nav = useNavigate()
  const role = profile?.role
  const links = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    ...(role === 'patient' ? [{ to: '/app/doctors', label: 'Find doctors', icon: Stethoscope }] : []),
    { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
    ...(['patient', 'doctor', 'admin'].includes(role) ? [{ to: '/app/records', label: 'Records', icon: FileText }] : []),
    ...(['patient', 'receptionist', 'admin'].includes(role) ? [{ to: '/app/billing', label: 'Billing', icon: CreditCard }] : []),
    ...(['receptionist', 'admin'].includes(role) ? [{ to: '/app/reception', label: 'Reception desk', icon: ClipboardList }] : []),
    ...(role === 'admin' ? [{ to: '/app/analytics', label: 'Analytics', icon: BarChart3 }] : []),
    ...(role === 'admin' ? [{ to: '/app/manage-doctors', label: 'Manage doctors', icon: Users }] : []),
  ]
  const cls = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center gap-2 font-bold text-brand-700"><HeartPulse className="h-5 w-5" aria-hidden="true" /> MediCare</div>
        <nav className="flex flex-wrap gap-2 md:flex-col" aria-label="Dashboard">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={cls}><Icon className="h-4 w-4" aria-hidden="true" />{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm text-slate-600">{profile?.full_name || 'User'} · <span className="capitalize">{role}</span></span>
          <button className="btn-outline" onClick={async () => { await signOut(); nav('/') }}><LogOut className="h-4 w-4" aria-hidden="true" />Log out</button>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  )
}
