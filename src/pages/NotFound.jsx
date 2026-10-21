import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-brand-900">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </main>
  )
}
