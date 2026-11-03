import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Close } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { uploadFile, validateFile } from '../lib/upload'
import * as api from '../lib/api'

interface Pending { file: File; url: string }

export function CreateScreen() {
  const { userId } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<Pending[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  function add(list: FileList | null) {
    if (!list) return
    const next: Pending[] = []
    for (const f of Array.from(list).slice(0, 4 - files.length)) {
      try { validateFile(f, 10 * 1024 * 1024); next.push({ file: f, url: URL.createObjectURL(f) }) }
      catch (e: any) { toast.show(e.message, 'err') }
    }
    setFiles(prev => [...prev, ...next])
  }

  async function submit() {
    if (!userId) return
    if (!content.trim() && files.length === 0) { toast.show('Write something or add an image.', 'err'); return }
    setBusy(true); setProgress(0)
    try {
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        urls.push(await uploadFile('posts', userId, files[i].file, 10 * 1024 * 1024))
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      await api.createPost(userId, content.trim(), urls)
      toast.show('Posted', 'ok')
      navigate('/')
    } catch (e: any) { toast.show(e.message || 'Upload failed', 'err') }
    finally { setBusy(false) }
  }

  return (
    <div className='view'>
      <h2 className='section-title'>Create post</h2>
      <div className='card'>
        <textarea className='input' rows={5} placeholder="What's on your mind?"
          value={content} onChange={e => setContent(e.target.value)} maxLength={2000} />
        {files.length > 0 && (
          <div className={`post-media ${files.length > 1 ? 'multi' : ''}`} style={{ marginTop: 12 }}>
            {files.map((f, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={f.url} alt='' />
                <button className='icon-btn' style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}><Close /></button>
              </div>
            ))}
          </div>
        )}
        {busy && progress > 0 && (
          <div style={{ marginTop: 12, height: 6, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
          </div>
        )}
        <div className='row' style={{ marginTop: 14 }}>
          <label className='btn sm ghost' style={{ opacity: files.length >= 4 ? .5 : 1 }}>
            <Image /> Add photos
            <input type='file' accept='image/*' multiple hidden disabled={files.length >= 4}
              onChange={e => add(e.target.files)} />
          </label>
          <span className='muted' style={{ fontSize: 12 }}>{files.length}/4</span>
          <div className='spacer' />
          <button className='btn primary' disabled={busy} onClick={submit}>{busy ? 'Posting…' : 'Post'}</button>
        </div>
      </div>
      <p className='muted' style={{ fontSize: 12.5, textAlign: 'center' }}>
        Up to 4 images per post. Images must be under 10&nbsp;MB.</p>
    </div>
  )
}
