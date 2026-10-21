import { AlertTriangle } from 'lucide-react'

export default function SetupNotice() {
  return (
    <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto flex max-w-6xl items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>Setup required:</strong> add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in your Vercel project settings (or a local <code>.env</code> file),
          then redeploy. Login and booking stay disabled until then.
        </p>
      </div>
    </div>
  )
}
