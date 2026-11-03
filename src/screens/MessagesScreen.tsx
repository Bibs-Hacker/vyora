import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, timeAgo } from '../components/ui'
import { Chat, Back, Send, Search as SearchIcon, Trash } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import * as m from '../lib/messages'
import { getProfile } from '../lib/social'
import type { Conversation, Message, Profile } from '../lib/types'

export function MessagesScreen() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [convs, setConvs] = useState<Conversation[] | null>(null)
  const [term, setTerm] = useState('')

  async function load() { if (userId) setConvs(await m.listConversations(userId)) }
  useEffect(() => { load() }, [userId])

  const filtered = (convs ?? []).filter(c =>
    !term || c.members?.some(mem => (mem.username + mem.full_name).toLowerCase().includes(term.toLowerCase())))

  async function del(id: string) { if (!userId) return; await m.leaveConversation(id, userId); load() }

  return (
    <div className='view'>
      <h2 className='section-title'>Messages</h2>
      <div className='input-wrap' style={{ marginBottom: 12 }}>
        <input className='input' style={{ paddingLeft: 42 }} placeholder='Search conversations'
          value={term} onChange={e => setTerm(e.target.value)} />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}><SearchIcon /></span>
      </div>
      {convs === null ? <div className='skel' style={{ height: 70 }} /> :
        filtered.length === 0 ? (
          <div className='empty'><Chat className='glyph' /><h4>No conversations yet</h4>
            <p>Open someone's profile and tap Message to start chatting.</p></div>
        ) : filtered.map(c => {
          const other = c.members?.[0]
          return (
            <div key={c.id} className='list-row'>
              <button className='row' style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', gap: 12 }}
                onClick={() => navigate(`/messages/${c.id}`)}>
                <Avatar profile={other} size={48} />
                <div className='col' style={{ flex: 1 }}>
                  <span className='name'>{other?.full_name ?? 'Conversation'}</span>
                  <span className='meta' style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.last_message?.content ?? (c.last_message?.image_url ? 'Photo' : 'No messages yet')}</span>
                </div>
                {!!c.unread && <span className='badge' style={{ position: 'static' }}>{c.unread}</span>}
              </button>
              <button className='icon-btn' onClick={() => del(c.id)} aria-label='Delete'><Trash /></button>
            </div>
          )
        })}
    </div>
  )
}

export function ChatScreen() {
  const { id } = useParams()
  const { userId } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [other, setOther] = useState<Profile | null>(null)
  const [text, setText] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id || !userId) return
    let active = true
    m.fetchMessages(id).then(msgs => { if (active) setMessages(msgs) })
    m.markConversationRead(id, userId)
    // Resolve the other member for the header.
    import('../lib/supabase').then(({ supabase }) =>
      supabase.from('conversation_members').select('user_id').eq('conversation_id', id).then(async ({ data }) => {
        const oid = (data ?? []).map((r: any) => r.user_id).find((x: string) => x !== userId)
        if (oid && active) setOther(await getProfile(oid))
      }))
    const off = m.subscribeMessages(id, msg => {
      setMessages(prev => prev.some(p => p.id === msg.id) ? prev : [...prev, msg])
      if (userId) m.markConversationRead(id, userId)
    })
    return () => { active = false; off() }
  }, [id, userId])

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }) }, [messages])

  async function send() {
    if (!id || !userId || !text.trim()) return
    const body = text.trim(); setText('')
    try { await m.sendMessage(id, userId, body) }
    catch { toast.show('Message not sent', 'err'); setText(body) }
  }

  return (
    <div className='chat'>
      <div className='chat-head'>
        <button className='icon-btn' onClick={() => navigate('/messages')}><Back /></button>
        <Avatar profile={other} size={38} />
        <div className='col'><b>{other?.full_name ?? ''}</b>
          <span className='meta'>@{other?.username ?? ''}</span></div>
      </div>
      <div className='chat-body' ref={bodyRef}>
        {messages.length === 0 && <p className='muted' style={{ textAlign: 'center', marginTop: 40 }}>Say hello to start the conversation.</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`bubble ${msg.sender_id === userId ? 'me' : 'them'}`}>
            {msg.image_url && <img src={msg.image_url} style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 4 }} />}
            {msg.content}
            <span className='t'>{timeAgo(msg.created_at)}</span>
          </div>
        ))}
      </div>
      <div className='chat-input'>
        <input className='input' placeholder='Message…' value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button className='btn primary' onClick={send} aria-label='Send'><Send /></button>
      </div>
    </div>
  )
}
