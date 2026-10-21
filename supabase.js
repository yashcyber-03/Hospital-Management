import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when both public env vars are present.
export const isSupabaseConfigured = Boolean(url && key)

// null when not configured, so the app shows a setup message instead of crashing.
export const supabase = isSupabaseConfigured ? createClient(url, key) : null
