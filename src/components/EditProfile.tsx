import { useState } from 'react'
import { Modal, Avatar } from './ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile, isUsernameAvailable } from '../lib/social'
import { uploadFile } from '../lib/upload'

export function EditProfile({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { userId, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({
    full_name: profile?.full_name ?? '', username: profile?.username ?? '',
    bio: profile?.bio ?? '', gender: profile?.gender ?? ''
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? '')
  const [coverPreview, setCoverPreview] = useState(profile?.cover_url ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    if (!userId) return
    const uname = f.username.toLowerCase()
    if (!/^[a-z0-9_.]{3,30}$/.test(uname)) { setErr('Username: 3-30 letters, numbers, _ or .'); return }
    if (f.full_name.trim().length < 1) { setErr('Full name is required.'); return }
    setBusy(true); setErr('')
    try {
      if (uname !== profile?.username && !(await isUsernameAvailable(uname))) {
        setErr('That username is taken.'); setBusy(false); return
      }
      const patch: any = { full_name: f.full_name.trim(), username: uname, bio: f.bio.trim() || null, gender: f.gender || null }
      if (avatar) patch.avatar_url = await uploadFile('avatars', userId, avatar, 5 * 1024 * 1024)
      if (cover) patch.cover_url = await uploadFile('covers', userId, cover, 8 * 1024 * 1024)
      await updateProfile(userId, patch)
      await refreshProfile()
      toast.show('Profile updated', 'ok'); onSaved()
    } catch (e: any) { setErr(e.message || 'Could not save changes.') }
    finally { setBusy(false) }
  }

  return (
    <Modal title='Edit profile' onClose={onClose}>
      <div className='profile-cover' style={{ height: 110, marginBottom: 12 }}>
        {coverPreview && <img src={coverPreview} alt='' />}
        <label className='btn sm' style={{ position: 'absolute', bottom: 8, right: 8 }}>Change cover
          <input type='file' accept='image/*' hidden onChange={e => {
            const file = e.target.files?.[0]; if (file) { setCover(file); setCoverPreview(URL.createObjectURL(file)) } }} />
        </label>
      </div>
      <div className='avatar-pick'>
        <Avatar profile={{ avatar_url: avatarPreview } as any} size={60} />
        <label className='btn sm ghost'>Change photo
          <input type='file' accept='image/*' hidden onChange={e => {
            const file = e.target.files?.[0]; if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)) } }} />
        </label>
      </div>
      <div className='field'><label>Full name</label>
        <input className='input' value={f.full_name} onChange={e => set('full_name', e.target.value)} /></div>
      <div className='field'><label>Username</label>
        <input className='input' value={f.username} onChange={e => set('username', e.target.value)} /></div>
      <div className='field'><label>Bio</label>
        <textarea className='input' rows={3} maxLength={300} value={f.bio} onChange={e => set('bio', e.target.value)} /></div>
      <div className='field'><label>Gender</label>
        <select className='input' value={f.gender} onChange={e => set('gender', e.target.value)}>
          <option value=''>Prefer not to say</option><option value='female'>Female</option>
          <option value='male'>Male</option><option value='nonbinary'>Non-binary</option><option value='other'>Other</option>
        </select></div>
      {err && <span className='err'>{err}</span>}
      <div className='row' style={{ gap: 8, marginTop: 14 }}>
        <button className='btn primary' style={{ flex: 1 }} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
        <button className='btn ghost' onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  )
}
