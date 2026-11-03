import { useEffect, useState, useRef } from 'react'
import { Avatar, Modal, timeAgo } from './ui'
import { Plus, Close, Trash, Eye } from './Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { uploadFile, validateFile } from '../lib/upload'
import * as st from '../lib/stories'
import type { Story, Profile } from '../lib/types'

export function StoriesRail() {
  const { userId, profile } = useAuth()
  const toast = useToast()
  const [stories, setStories] = useState<Story[]>([])
  const [grouped, setGrouped] = useState<Record<string, Story[]>>({})
  const [viewing, setViewing] = useState<Story[] | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    if (!userId) return
    const all = await st.fetchStories(userId)
    setStories(all)
    const g: Record<string, Story[]> = {}
    all.forEach(s => { (g[s.author_id] ||= []).push(s) })
    setGrouped(g)
  }
  useEffect(() => { load() }, [userId])

  const authors = Object.keys(grouped)

  return (
    <div className='stories'>
      <button className='story-chip' onClick={() => setCreating(true)} style={{ background: 'none', border: 'none' }}>
        <span className='story-ring' style={{ display: 'grid', placeItems: 'center' }}>
          <span className='avatar avatar-fallback' style={{ width: '100%', height: '100%' }}><Plus /></span>
        </span>
        <span>Your story</span>
      </button>
      {authors.map(aid => {
        const grp = grouped[aid]; const author = grp[0].author
        return (
          <button key={aid} className='story-chip' style={{ background: 'none', border: 'none' }}
            onClick={() => setViewing(grp)}>
            <span className='story-ring'><Avatar profile={author} size={59} /></span>
            <span>{aid === userId ? 'You' : author?.username}</span>
          </button>
        )
      })}
      {creating && <CreateStory onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />}
      {viewing && <StoryViewer group={viewing} onClose={() => { setViewing(null); load() }} />}
    </div>
  )
}

function CreateStory({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { userId } = useAuth(); const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)

  function pick(f?: File) {
    if (!f) return
    try { validateFile(f) } catch (e: any) { toast.show(e.message, 'err'); return }
    setFile(f); setPreview(URL.createObjectURL(f))
  }
  async function submit() {
    if (!userId || !file) return
    setBusy(true)
    try {
      const url = await uploadFile('stories', userId, file)
      const type = file.type.startsWith('video') ? 'video' : 'image'
      await st.createStory(userId, url, type, caption)
      toast.show('Story shared', 'ok'); onCreated()
    } catch (e: any) { toast.show(e.message || 'Upload failed', 'err') }
    finally { setBusy(false) }
  }
  return (
    <Modal title='Add to your story' onClose={onClose}>
      {!preview ? (
        <label className='btn block'>Choose photo or video
          <input type='file' accept='image/*,video/mp4' hidden onChange={e => pick(e.target.files?.[0])} />
        </label>
      ) : (
        <>
          {file?.type.startsWith('video')
            ? <video src={preview} controls style={{ width: '100%', borderRadius: 14, maxHeight: 360 }} />
            : <img src={preview} style={{ width: '100%', borderRadius: 14, maxHeight: 360, objectFit: 'cover' }} />}
          <input className='input' placeholder='Add a caption…' style={{ marginTop: 12 }}
            value={caption} onChange={e => setCaption(e.target.value)} />
          <button className='btn primary block' style={{ marginTop: 12 }} disabled={busy} onClick={submit}>
            {busy ? 'Sharing…' : 'Share story'}</button>
        </>
      )}
    </Modal>
  )
}

function StoryViewer({ group, onClose }: { group: Story[]; onClose: () => void }) {
  const { userId } = useAuth()
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [viewers, setViewers] = useState<Profile[] | null>(null)
  const timer = useRef<number>()
  const cur = group[idx]
  const mine = cur.author_id === userId

  useEffect(() => {
    if (userId) st.recordView(cur.id, userId)
    if (paused || cur.media_type === 'video') return
    timer.current = window.setTimeout(() => {
      if (idx < group.length - 1) setIdx(idx + 1); else onClose()
    }, 5000)
    return () => window.clearTimeout(timer.current)
  }, [idx, paused, cur, group.length, onClose, userId])

  async function showViewers() { setViewers(await st.storyViewers(cur.id)) }
  async function del() { await st.deleteStory(cur.id); onClose() }

  return (
    <div className='scrim' onClick={onClose} style={{ placeItems: 'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 'min(420px, 94vw)', maxHeight: '90vh', position: 'relative' }}
        onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {group.map((_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= idx ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>
        <div className='row' style={{ marginBottom: 8, color: '#fff' }}>
          <Avatar profile={cur.author} size={34} />
          <div className='col'><b style={{ fontSize: 14 }}>@{cur.author?.username}</b>
            <span style={{ fontSize: 11, opacity: .8 }}>{timeAgo(cur.created_at)}</span></div>
          <div className='spacer' />
          <button className='icon-btn' onClick={onClose}><Close /></button>
        </div>
        {cur.media_type === 'video'
          ? <video src={cur.media_url} autoPlay controls style={{ width: '100%', borderRadius: 16, maxHeight: '64vh' }} />
          : <img src={cur.media_url} style={{ width: '100%', borderRadius: 16, maxHeight: '64vh', objectFit: 'contain', background: '#000' }} />}
        {cur.caption && <p style={{ color: '#fff', textAlign: 'center', marginTop: 10 }}>{cur.caption}</p>}
        <div className='row' style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <button className='btn sm ghost' onClick={() => idx > 0 && setIdx(idx - 1)} disabled={idx === 0}>Prev</button>
          {mine && <button className='btn sm ghost' onClick={showViewers}><Eye /> Viewers</button>}
          {mine && <button className='btn sm danger' onClick={del}><Trash /></button>}
          <button className='btn sm ghost' onClick={() => idx < group.length - 1 ? setIdx(idx + 1) : onClose()}>Next</button>
        </div>
        {viewers && (
          <div className='card' style={{ marginTop: 10, maxHeight: 160, overflowY: 'auto' }}>
            <b style={{ fontSize: 13 }}>Viewed by {viewers.length}</b>
            {viewers.map(v => <div key={v.id} className='row' style={{ marginTop: 8 }}>
              <Avatar profile={v} size={28} /><span style={{ fontSize: 13 }}>@{v.username}</span></div>)}
          </div>
        )}
      </div>
    </div>
  )
}
