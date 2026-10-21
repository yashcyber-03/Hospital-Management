import { Link } from 'react-router-dom'
import { CalendarCheck, Stethoscope, FileText, CreditCard, ShieldCheck, Bot, HeartPulse, Phone, Clock } from 'lucide-react'

const features = [
  { icon: CalendarCheck, title: 'Smart appointments', text: 'Real-time slots with conflict-free booking, rescheduling and cancellation.' },
  { icon: Stethoscope, title: 'Find the right doctor', text: 'Search by name, department or specialization and see fees up front.' },
  { icon: FileText, title: 'Records & prescriptions', text: 'Visit history and prescriptions, visible only to you and your doctor.' },
  { icon: CreditCard, title: 'Transparent billing', text: 'Invoices and payment status in one place.' },
  { icon: Bot, title: 'Hospital assistant', text: 'Ask about departments, services and visiting hours any time.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'Role-based access enforced in the database, not just on screen.' },
]
const departments = ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Dermatology', 'General Medicine']

export default function Landing() {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Main">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
            <HeartPulse className="h-6 w-6" aria-hidden="true" /> MediCare
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline">Log in</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </div>
        </nav>
      </header>

      <section className="bg-gradient-to-br from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
              Online Hospital Management System
            </p>
            <h1 className="text-4xl font-bold leading-tight text-brand-900 md:text-5xl">Care that fits your schedule.</h1>
            <p className="mt-4 text-lg text-slate-600">
              Book appointments, view prescriptions and manage billing with one secure account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" /> Book an appointment
              </Link>
              <a href="#departments" className="btn-outline">Explore departments</a>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="mb-4 font-semibold text-brand-900">Hospital information</h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-3"><Clock className="h-5 w-5 text-brand-600" aria-hidden="true" /> OPD: Mon–Sat, 9:00 AM – 5:00 PM</li>
              <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-brand-600" aria-hidden="true" /> Emergency: 24 × 7</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">Sample details for demonstration. Edit in Landing.jsx.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="features">
        <h2 id="features" className="mb-8 text-center text-2xl font-bold text-brand-900">Everything in one platform</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <Icon className="mb-3 h-7 w-7 text-brand-600" aria-hidden="true" />
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="departments" className="bg-white py-16" aria-labelledby="dept">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="dept" className="mb-8 text-center text-2xl font-bold text-brand-900">Our departments</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {departments.map((d) => (
              <span key={d} className="rounded-full bg-brand-50 px-4 py-2 font-medium text-brand-700 ring-1 ring-brand-100">{d}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MediCare Hospital — final-year B.Tech project (demo data only)
      </footer>
    </div>
  )
}
