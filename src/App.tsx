import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { getPreferences } from './lib/prefs'
import { Layout } from './components/Layout'
import { IntroScreen } from './screens/IntroScreen'
import { AuthScreen } from './screens/AuthScreen'
import { HomeScreen } from './screens/HomeScreen'
import { DiscoverScreen } from './screens/DiscoverScreen'
import { CreateScreen } from './screens/CreateScreen'
import { MessagesScreen, ChatScreen } from './screens/MessagesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LegalScreen } from './screens/LegalScreen'
import { VyoraMark } from './components/Icons'
import { isConfigured } from './lib/supabase'

// Shown when the Supabase env vars are missing/invalid, instead of a blank
// white screen. This is the #1 cause of "it just loads blank": .env.local was
// not created, had the wrong variable names, or the dev server was not
// restarted after adding it.
function SetupScreen() {
  return (
    <div className='setup-wrap'>
      <div className='setup-card'>
        <VyoraMark className='setup-mark' />
        <h1 className='setup-title'>VYORA needs to be connected</h1>
        <p className='setup-sub'>
          The app loaded, but it can't reach a backend yet. VYORA requires your
          own Supabase project — it has no bundled server.
        </p>
        <ol className='setup-steps'>
          <li>In the project root, copy <code>.env.example</code> to <code>.env.local</code>.</li>
          <li>Open <code>.env.local</code> and set both values from Supabase &rarr; Project Settings &rarr; API:
            <pre>VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key</pre>
          </li>
          <li><strong>Stop and restart</strong> <code>npm run dev</code> (Vite only reads env files at startup).</li>
        </ol>
        <p className='setup-note'>
          Note: opening <code>index.html</code> directly from your file manager will
          always be blank — this is a Vite app and must be run with
          <code>npm run dev</code> (or built with <code>npm run build</code> and served).
        </p>
      </div>
    </div>
  )
}

function Splash() {
  return <div className='auth-wrap'><div className='intro-inner'>
    <VyoraMark className='intro-mark' /><h1 className='intro-title'>VYORA</h1></div></div>
}

function LegalRoute() {
  const { page } = useParams(); const navigate = useNavigate()
  return <LegalScreen page={page ?? 'terms'} onBack={() => navigate(-1)} />
}

function SettingsRoute() {
  const navigate = useNavigate()
  return <SettingsScreen onLegal={p => navigate(`/legal/${p}`)} />
}

function Gate() {
  const { loading, userId } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const [introSeen, setIntroSeen] = useState(() => !!localStorage.getItem('vyora.introSeen'))

  // Load the user's saved theme once authenticated.
  useEffect(() => {
    if (userId) getPreferences(userId).then(p => { if (p?.theme) setTheme(p.theme as any) })
  }, [userId, setTheme])

  if (loading) return <Splash />

  if (!userId) {
    return (
      <Routes>
        <Route path='/legal/:page' element={<LegalRoute />} />
        <Route path='/auth/:page' element={<AuthRouteWrapper />} />
        <Route path='*' element={
          !introSeen
            ? <IntroScreen onDone={target => { setIntroSeen(true); navigate(`/auth/${target}`) }} />
            : <AuthScreen initial='login' onLegal={p => navigate(`/legal/${p}`)} />
        } />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path='/' element={<HomeScreen />} />
        <Route path='/discover' element={<DiscoverScreen />} />
        <Route path='/create' element={<CreateScreen />} />
        <Route path='/messages' element={<MessagesScreen />} />
        <Route path='/messages/:id' element={<ChatScreen />} />
        <Route path='/me' element={<ProfileScreen self />} />
        <Route path='/u/:id' element={<ProfileScreen />} />
        <Route path='/notifications' element={<NotificationsScreen />} />
        <Route path='/settings' element={<SettingsRoute />} />
        <Route path='/legal/:page' element={<LegalRoute />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Layout>
  )
}

function AuthRouteWrapper() {
  const navigate = useNavigate()
  const { page } = useParams()
  const mode = page === 'register' ? 'register' : 'login'
  return <AuthScreen initial={mode} onLegal={p => navigate(`/legal/${p}`)} />
}

function OfflineBar() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return <div className='offline-bar'>You're offline. Some features are unavailable until you reconnect.</div>
}

export default function App() {
  if (!isConfigured) return <SetupScreen />
  return (
    <BrowserRouter>
      <OfflineBar />
      <Gate />
    </BrowserRouter>
  )
}
