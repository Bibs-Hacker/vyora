import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Modal } from '../components/ui'
import { Logout, Switch as SwitchIcon, Trash, Shield, Globe, Plus } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useTheme, THEMES } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { getPreferences, savePreferences, deleteMyAccount } from '../lib/prefs'
import { updateProfile, listBlocked, unblock } from '../lib/social'
import { listAccounts, removeAccount, switchAccount } from '../lib/accounts'
import { supabase } from '../lib/supabase'
import type { Preferences, Profile } from '../lib/types'

const SWATCHES: Record<string, string[]> = {
  midnight: ['#0b0b14', '#7c5cff', '#22d3ee'], aurora: ['#07121a', '#2dd4bf', '#a855f7'],
  ocean: ['#061222', '#3b82f6', '#06b6d4'], rose: ['#1a0a12', '#fb7185', '#f472b6'],
  emerald: ['#06160f', '#10b981', '#34d399'], lavender: ['#120f1f', '#a78bfa', '#c084fc'],
  sunset: ['#1a0f08', '#fb923c', '#f43f5e'], minimal: ['#f5f6fa', '#6b4dff', '#0ea5b7']
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />
}

export function SettingsScreen({ onLegal }: { onLegal: (p: string) => void }) {
  const { userId, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [blocked, setBlocked] = useState<Profile[]>([])
  const [showDelete, setShowDelete] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (!userId) return
    getPreferences(userId).then(setPrefs)
    listBlocked(userId).then(setBlocked)
  }, [userId])

  async function patchPref(p: Partial<Preferences>) {
    if (!userId || !prefs) return
    setPrefs({ ...prefs, ...p }); await savePreferences(userId, p)
  }
  async function chooseTheme(t: string) {
    setTheme(t as any)
    if (userId) await savePreferences(userId, { theme: t })
  }
  async function togglePrivate(v: boolean) {
    if (!userId) return
    await updateProfile(userId, { is_private: v }); toast.show('Privacy updated', 'ok')
  }
  async function doUnblock(id: string) {
    if (!userId) return
    await unblock(userId, id); setBlocked(await listBlocked(userId))
  }
  async function logoutAll() { await supabase.auth.signOut({ scope: 'global' } as any); navigate('/') }

  const accounts = listAccounts()

  return (
    <div className='view'>
      <h2 className='section-title'>Settings</h2>

      <div className='settings-group'>
        <h4>Appearance</h4>
        <div className='theme-grid'>
          {THEMES.map(t => (
            <button key={t.id} className={`theme-swatch ${theme === t.id ? 'active' : ''}`} onClick={() => chooseTheme(t.id)}>
              <span className='dots'>{SWATCHES[t.id].map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className='row' style={{ gap: 8, marginTop: 10 }}>
          <button className='btn sm' onClick={() => chooseTheme('system' as any)}>Match system</button>
        </div>
      </div>

      <div className='settings-group'>
        <h4>Accounts on this device</h4>
        {accounts.map(a => (
          <div key={a.id} className='setting-item'>
            <Avatar profile={{ avatar_url: a.avatar_url, full_name: a.full_name, username: a.username } as any} size={38} />
            <div className='label'>{a.full_name}<small>@{a.username}</small></div>
            {a.id === userId ? <span className='muted' style={{ fontSize: 12 }}>Active</span> :
              <button className='btn sm' onClick={async () => { (await switchAccount(a.id)) ? location.assign('/') : toast.show('Session expired, sign in again', 'err') }}><SwitchIcon /> Switch</button>}
            {a.id !== userId && <button className='icon-btn' onClick={() => { removeAccount(a.id); location.reload() }} aria-label='Remove'><Trash /></button>}
          </div>
        ))}
        <button className='btn block ghost' onClick={signOut}><Plus /> Add another account</button>
        <p className='muted' style={{ fontSize: 12, marginTop: 6 }}>Removing an account here only signs it out on this device. It does not delete the account.</p>
      </div>

      {prefs && (
        <div className='settings-group'>
          <h4>Privacy & safety</h4>
          <div className='setting-item'><div className='label'>Private account<small>Only approved followers see your posts</small></div>
            <Toggle on={!!profile?.is_private} onChange={togglePrivate} /></div>
          <div className='setting-item'><div className='label'>Who can message you</div>
            <select className='input' style={{ width: 150 }} value={prefs.message_perm}
              onChange={e => patchPref({ message_perm: e.target.value as any })}>
              <option value='everyone'>Everyone</option><option value='followers'>Followers</option><option value='no_one'>No one</option></select></div>
          <div className='setting-item'><div className='label'>Story visibility</div>
            <select className='input' style={{ width: 150 }} value={prefs.story_visibility}
              onChange={e => patchPref({ story_visibility: e.target.value as any })}>
              <option value='followers'>Followers</option><option value='everyone'>Everyone</option><option value='close'>Close friends</option></select></div>
          {blocked.length > 0 && <>
            <h4 style={{ marginTop: 14 }}>Blocked accounts</h4>
            {blocked.map(b => <div key={b.id} className='setting-item'><Avatar profile={b} size={34} />
              <div className='label'>@{b.username}</div><button className='btn sm' onClick={() => doUnblock(b.id)}>Unblock</button></div>)}
          </>}
        </div>
      )}

      {prefs && (
        <div className='settings-group'>
          <h4>Notifications</h4>
          <div className='setting-item'><div className='label'>In-app notifications<small>Likes, comments, follows and messages</small></div>
            <Toggle on={prefs.notif_in_app} onChange={v => patchPref({ notif_in_app: v })} /></div>
          <p className='muted' style={{ fontSize: 12 }}>Email and push notifications are not enabled in this deployment.</p>
        </div>
      )}

      <div className='settings-group'>
        <h4>Storage & data</h4>
        <div className='setting-item'><div className='label'>Offline cache<small>App shell and recently viewed media</small></div>
          <button className='btn sm' onClick={async () => {
            if ('caches' in window) { for (const k of await caches.keys()) await caches.delete(k) }
            toast.show('Cache cleared', 'ok') }}>Clear cache</button></div>
        <p className='muted' style={{ fontSize: 12 }}>Your profile, posts, messages and media are stored securely on the backend. Clearing the cache never deletes your account or content.</p>
      </div>

      <div className='settings-group'>
        <h4>Account security</h4>
        <button className='btn block' style={{ marginBottom: 8 }} onClick={() => setShowPw(true)}><Shield /> Change password</button>
        <button className='btn block' style={{ marginBottom: 8 }} onClick={signOut}><Logout /> Log out</button>
        <button className='btn block ghost' onClick={logoutAll}><Globe /> Log out of all sessions</button>
      </div>

      <div className='settings-group'>
        <h4>Legal</h4>
        {['terms', 'privacy', 'guidelines', 'safety'].map(p => (
          <button key={p} className='btn block ghost' style={{ marginBottom: 8, justifyContent: 'flex-start' }} onClick={() => onLegal(p)}>
            {p === 'terms' ? 'Terms of Service' : p === 'privacy' ? 'Privacy Policy' : p === 'guidelines' ? 'Community Guidelines' : 'Reporting & Safety'}</button>
        ))}
      </div>

      <div className='settings-group'>
        <h4 style={{ color: 'var(--danger)' }}>Danger zone</h4>
        <button className='btn block danger' onClick={() => setShowDelete(true)}><Trash /> Delete account</button>
      </div>

      <p className='muted' style={{ textAlign: 'center', fontSize: 12, marginTop: 20 }}>VYORA — A world made for connection · Created by Dev Brian</p>

      {showPw && <ChangePassword onClose={() => setShowPw(false)} />}
      {showDelete && <DeleteAccount onClose={() => setShowDelete(false)} />}
    </div>
  )
}

function ChangePassword({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false)
  async function save() {
    if (pw.length < 8) { toast.show('Password must be at least 8 characters.', 'err'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) toast.show(error.message, 'err'); else { toast.show('Password changed', 'ok'); onClose() }
  }
  return (
    <Modal title='Change password' onClose={onClose}>
      <div className='field'><label>New password</label>
        <input className='input' type='password' value={pw} onChange={e => setPw(e.target.value)} /></div>
      <button className='btn primary block' disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Update password'}</button>
    </Modal>
  )
}

function DeleteAccount({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [phrase, setPhrase] = useState('')
  const [busy, setBusy] = useState(false)
  async function confirm() {
    setBusy(true)
    try { await deleteMyAccount(); await signOut(); location.assign('/') }
    catch (e: any) { toast.show(e.message || 'Deletion failed', 'err'); setBusy(false) }
  }
  return (
    <Modal title='Delete account' onClose={onClose}>
      {step === 1 && <>
        <p style={{ lineHeight: 1.5 }}>This permanently deletes your profile, posts, media, comments, likes, stories, messages, followers and preferences. This cannot be undone.</p>
        <button className='btn block danger' style={{ marginTop: 12 }} onClick={() => setStep(2)}>I understand, continue</button>
        <button className='btn block ghost' style={{ marginTop: 8 }} onClick={onClose}>Cancel</button>
      </>}
      {step === 2 && <>
        <p>Type <b>DELETE MY ACCOUNT</b> to confirm.</p>
        <input className='input' value={phrase} onChange={e => setPhrase(e.target.value)} />
        <button className='btn block danger' style={{ marginTop: 12 }} disabled={phrase !== 'DELETE MY ACCOUNT'} onClick={() => setStep(3)}>Continue</button>
      </>}
      {step === 3 && <>
        <p>Final confirmation. Your session will be used to re-authenticate the deletion request on the backend.</p>
        <button className='btn block danger' style={{ marginTop: 12 }} disabled={busy} onClick={confirm}>{busy ? 'Deleting…' : 'Permanently delete my account'}</button>
        <button className='btn block ghost' style={{ marginTop: 8 }} onClick={onClose}>Keep my account</button>
      </>}
    </Modal>
  )
}
