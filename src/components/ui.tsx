import { ReactNode, useEffect } from 'react'
import { Close } from './Icons'
import type { Profile } from '../lib/types'

export function Avatar({ profile, size = 40 }: { profile?: Profile | null; size?: number }) {
  const s = { width: size, height: size, fontSize: size * 0.4 }
  if (profile?.avatar_url) return <img className='avatar' style={s} src={profile.avatar_url} alt={profile.username} />
  const initial = (profile?.full_name || profile?.username || '?').charAt(0).toUpperCase()
  return <div className='avatar avatar-fallback' style={s}>{initial}</div>
}

export function Modal({ title, onClose, children }: { title?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className='scrim' onMouseDown={onClose}>
      <div className='sheet' onMouseDown={e => e.stopPropagation()} role='dialog' aria-modal>
        {title && (
          <div className='sheet-head'>
            <h3 style={{ flex: 1 }}>{title}</h3>
            <button className='icon-btn' onClick={onClose} aria-label='Close'><Close /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return <span className='spinner' aria-label='Loading' />
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
