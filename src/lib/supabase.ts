import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// The app is considered configured only when both values exist and the URL
// looks like a real https endpoint.
export const isConfigured = Boolean(url && anon && /^https?:\/\//.test(url))

if (!isConfigured) {
  console.error(
    '[VYORA] Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\n' +
    'Create a .env.local file in the project root (copy it from .env.example),\n' +
    'fill in your Supabase Project URL and anon key, then RESTART `npm run dev`.'
  )
}

// IMPORTANT: supabase-js throws "supabaseUrl is required" if it receives an
// empty url. That would crash the whole app at import time and show a blank
// white screen. To avoid that, we pass a syntactically valid placeholder when
// the env vars are absent, so the module always loads and the app can instead
// render a friendly "Setup required" screen (see App.tsx, which checks
// `isConfigured`). No real network calls are made until it is configured.
export const supabase = createClient(
  isConfigured ? (url as string) : 'https://placeholder.supabase.co',
  isConfigured ? (anon as string) : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'vyora.auth'
    },
    realtime: { params: { eventsPerSecond: 10 } }
  }
)
