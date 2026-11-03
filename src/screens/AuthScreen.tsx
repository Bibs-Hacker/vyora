import { useState } from 'react'
import { VyoraMark, Eye, EyeOff } from '../components/Icons'
import { Avatar } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isUsernameAvailable } from '../lib/social'
import { uploadFile } from '../lib/upload'

type Mode = 'login' | 'register'
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthScreen({ initial, onLegal }: { initial: Mode; onLegal: (p: string) => void }) {
  const { signIn, signUp } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>(initial)
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState<Record<string, string>>({})
  const [f, setF] = useState({ fullName: '', username: '', email: '', password: '', confirm: '', gender: '', agree: false })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [unameOk, setUnameOk] = useState<boolean | null>(null)

  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }))

  async function checkUsername(u: string) {
    set('username', u.toLowerCase())
    setUnameOk(null)
    if (/^[a-z0-9_.]{3,30}$/.test(u.toLowerCase())) {
      try { setUnameOk(await isUsernameAvailable(u)) } catch { /* ignore */ }
    }
  }

  function pickAvatar(file?: File) {
    if (!file) return
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!emailRe.test(f.email)) e.email = 'Enter a valid email address.'
    if (f.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (mode === 'register') {
      if (f.fullName.trim().length < 1) e.fullName = 'Full name is required.'
      if (!/^[a-z0-9_.]{3,30}$/.test(f.username)) e.username = 'Username: 3-30 letters, numbers, _ or .'
      else if (unameOk === false) e.username = 'That username is taken.'
      if (f.confirm !== f.password) e.confirm = 'Passwords do not match.'
      if (!f.agree) e.agree = 'You must accept the Terms and Privacy Policy.'
    }
    setErr(e); return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(f.email, f.password)
      } else {
        let avatarUrl: string | undefined
        await signUp({ fullName: f.fullName, username: f.username, email: f.email,
          password: f.password, gender: f.gender || undefined })
        // Upload avatar after sign-up (needs an authenticated session).
        if (avatarFile) {
          const { data } = await import('../lib/supabase').then(m => m.supabase.auth.getUser())
          if (data.user) {
            try {
              avatarUrl = await uploadFile('avatars', data.user.id, avatarFile, 5 * 1024 * 1024)
              await import('../lib/social').then(m => m.updateProfile(data.user!.id, { avatar_url: avatarUrl! }))
            } catch { /* avatar optional */ }
          }
        }
        toast.show('Account created. Welcome to VYORA.', 'ok')
      }
    } catch (e: any) {
      setErr({ form: e.message || 'Something went wrong. Please try again.' })
    } finally { setBusy(false) }
  }

  return (
    <div className='auth-wrap'>
      <div className='auth-card card'>
        <div className='brand-lg'><VyoraMark /><strong style={{ letterSpacing: '.2em' }}>VYORA</strong></div>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className='muted' style={{ textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
          {mode === 'login' ? 'Sign in to continue' : 'A world made for connection'}</p>

        {err.form && <div className='field'><span className='err'>{err.form}</span></div>}

        {mode === 'register' && (
          <>
            <div className='avatar-pick'>
              <Avatar profile={avatarPreview ? { avatar_url: avatarPreview } as any : null} size={56} />
              <label className='btn sm ghost'>Add photo
                <input type='file' accept='image/*' hidden onChange={e => pickAvatar(e.target.files?.[0])} />
              </label>
            </div>
            <div className='field'><label>Full name</label>
              <input className='input' value={f.fullName} onChange={e => set('fullName', e.target.value)} />
              {err.fullName && <span className='err'>{err.fullName}</span>}</div>
            <div className='field'><label>Username</label>
              <input className='input' value={f.username} onChange={e => checkUsername(e.target.value)} placeholder='yourname' />
              {err.username ? <span className='err'>{err.username}</span> :
                unameOk === true ? <span className='hint-ok'>Username available</span> : null}</div>
          </>
        )}

        <div className='field'><label>Email</label>
          <input className='input' type='email' autoComplete='email' value={f.email}
            onChange={e => set('email', e.target.value)} />
          {err.email && <span className='err'>{err.email}</span>}</div>

        <div className='field'><label>Password</label>
          <div className='input-wrap'>
            <input className='input' type={showPw ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={f.password} onChange={e => set('password', e.target.value)} />
            <button type='button' className='toggle' onClick={() => setShowPw(s => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? <EyeOff /> : <Eye />}</button>
          </div>
          {err.password && <span className='err'>{err.password}</span>}</div>

        {mode === 'register' && (
          <>
            <div className='field'><label>Confirm password</label>
              <input className='input' type={showPw ? 'text' : 'password'} value={f.confirm}
                onChange={e => set('confirm', e.target.value)} />
              {err.confirm && <span className='err'>{err.confirm}</span>}</div>
            <div className='field'><label>Gender (optional)</label>
              <select className='input' value={f.gender} onChange={e => set('gender', e.target.value)}>
                <option value=''>Prefer not to say</option>
                <option value='female'>Female</option><option value='male'>Male</option>
                <option value='nonbinary'>Non-binary</option><option value='other'>Other</option>
              </select></div>
            <div className='field'>
              <label className='checkbox'>
                <input type='checkbox' checked={f.agree} onChange={e => set('agree', e.target.checked)} />
                <span>I agree to the <button type='button' className='link' onClick={() => onLegal('terms')} style={{ color: 'var(--accent)', background: 'none', border: 'none', padding: 0 }}>Terms</button> and <button type='button' onClick={() => onLegal('privacy')} style={{ color: 'var(--accent)', background: 'none', border: 'none', padding: 0 }}>Privacy Policy</button>.</span>
              </label>
              {err.agree && <span className='err'>{err.agree}</span>}
            </div>
          </>
        )}

        <button className='btn primary block' disabled={busy} onClick={submit}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>

        <div className='auth-switch'>
          {mode === 'login' ? <>New here? <button onClick={() => { setMode('register'); setErr({}) }}>Create account</button></>
            : <>Already have an account? <button onClick={() => { setMode('login'); setErr({}) }}>Sign in</button></>}
        </div>
      </div>
    </div>
  )
}
