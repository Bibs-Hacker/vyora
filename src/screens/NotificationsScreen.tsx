import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, timeAgo } from '../components/ui'
import { Bell, Heart, Comment, User, Chat, Check } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import * as n from '../lib/notifications'
import type { AppNotification } from '../lib/types'

const label: Record<string, string> = {
  follow: 'started following you', follow_request: 'requested to follow you',
  like: 'liked your post', comment: 'commented on your post',
  message: 'sent you a message', story_view: 'viewed your story', mention: 'mentioned you'
}
function Glyph({ type }: { type: string }) {
  if (type === 'like') return <Heart />
  if (type === 'comment') return <Comment />
  if (type === 'message') return <Chat />
  if (type.startsWith('follow')) return <User />
  return <Bell />
}

export function NotificationsScreen() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[] | null>(null)

  async function load() { if (userId) setItems(await n.listNotifications(userId)) }
  useEffect(() => {
    load()
    if (!userId) return
    const off = n.subscribeNotifications(userId, load)
    return off
  }, [userId])

  async function open(item: AppNotification) {
    if (!item.read) { await n.markRead(item.id); load() }
    if (item.conversation_id) navigate(`/messages/${item.conversation_id}`)
    else if (item.post_id) navigate('/')
    else if (item.actor_id) navigate(`/u/${item.actor_id}`)
  }
  async function allRead() { if (userId) { await n.markAllRead(userId); load() } }

  return (
    <div className='view'>
      <div className='row'>
        <h2 className='section-title' style={{ margin: 0 }}>Notifications</h2>
        <div className='spacer' />
        <button className='btn sm ghost' onClick={allRead}><Check /> Mark all read</button>
      </div>
      {items === null ? <div className='skel' style={{ height: 60, marginTop: 16 }} /> :
        items.length === 0 ? <div className='empty'><Bell className='glyph' /><h4>No notifications yet</h4>
          <p>When people interact with you, it'll show up here.</p></div> :
        <div style={{ marginTop: 12 }}>{items.map(item => (
          <button key={item.id} className='list-row' onClick={() => open(item)}
            style={{ width: '100%', background: item.read ? 'none' : 'var(--surface)', border: 'none',
              borderRadius: 12, textAlign: 'left', marginBottom: 4, padding: 12 }}>
            <div style={{ position: 'relative' }}>
              <Avatar profile={item.actor} size={44} />
              <span style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--accent)',
                borderRadius: '50%', width: 20, height: 20, display: 'grid', placeItems: 'center', color: '#fff' }}>
                <Glyph type={item.type} /></span>
            </div>
            <div className='col' style={{ flex: 1 }}>
              <span style={{ fontSize: 14 }}><b>@{item.actor?.username ?? 'Someone'}</b> {label[item.type]}</span>
              <span className='meta'>{timeAgo(item.created_at)}</span>
            </div>
            {!item.read && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)' }} />}
          </button>
        ))}</div>}
    </div>
  )
}
