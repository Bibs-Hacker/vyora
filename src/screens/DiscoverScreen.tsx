import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/ui'
import { PostCard } from '../components/PostCard'
import { Search, Compass } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { searchUsers, suggestedUsers } from '../lib/social'
import * as api from '../lib/api'
import type { Profile, Post } from '../lib/types'

export function DiscoverScreen() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [tab, setTab] = useState<'people' | 'posts'>('people')
  const [users, setUsers] = useState<Profile[] | null>(null)
  const [results, setResults] = useState<Profile[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [suggested, setSuggested] = useState<Profile[]>([])
  const [recent, setRecent] = useState<Post[] | null>(null)
  const [searching, setSearching] = useState(false)
  const deb = useRef<number>()

  useEffect(() => {
    if (userId) suggestedUsers(userId).then(setSuggested)
    api.fetchDiscover(userId, 0).then(setRecent)
  }, [userId])

  useEffect(() => {
    window.clearTimeout(deb.current)
    if (!term.trim()) { setResults([]); setPostResults([]); return }
    setSearching(true)
    deb.current = window.setTimeout(async () => {
      const [u, posts] = await Promise.all([
        searchUsers(term.trim()),
        api.fetchDiscover(userId, 0)
      ])
      setResults(u)
      const q = term.trim().toLowerCase()
      setPostResults(posts.filter(p => (p.content ?? '').toLowerCase().includes(q)))
      setSearching(false)
    }, 350)
    return () => window.clearTimeout(deb.current)
  }, [term, userId])

  const searchingActive = term.trim().length > 0

  return (
    <div className='view'>
      <h2 className='section-title'>Discover</h2>
      <div className='input-wrap' style={{ marginBottom: 16 }}>
        <input className='input' style={{ paddingLeft: 42 }} placeholder='Search people and posts'
          value={term} onChange={e => setTerm(e.target.value)} />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}><Search /></span>
      </div>

      {searchingActive ? (
        <>
          <div className='seg'>
            <button className={tab === 'people' ? 'active' : ''} onClick={() => setTab('people')}>People</button>
            <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Posts</button>
          </div>
          {searching ? <div className='skel' style={{ height: 60 }} /> :
            tab === 'people' ? (
              results.length === 0 ? <div className='empty'><h4>No people found</h4><p>Try a different name or username.</p></div> :
                results.map(u => <UserRow key={u.id} user={u} onClick={() => navigate(`/u/${u.id}`)} />)
            ) : (
              postResults.length === 0 ? <div className='empty'><h4>No posts found</h4></div> :
                postResults.map(p => <PostCard key={p.id} post={p} onChanged={() => {}} onOpenProfile={id => navigate(`/u/${id}`)} />)
            )}
        </>
      ) : (
        <>
          {suggested.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 className='muted' style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em' }}>Suggested for you</h4>
              {suggested.map(u => <UserRow key={u.id} user={u} onClick={() => navigate(`/u/${u.id}`)} />)}
            </div>
          )}
          <h4 className='muted' style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em' }}>Recent posts</h4>
          {recent === null ? <div className='skel' style={{ height: 120 }} /> :
            recent.length === 0 ? <div className='empty'><Compass className='glyph' /><h4>Nothing here yet</h4><p>Public posts will appear here as the community grows.</p></div> :
            recent.map(p => <PostCard key={p.id} post={p} onChanged={() => {}} onOpenProfile={id => navigate(`/u/${id}`)} />)}
        </>
      )}
    </div>
  )
}

function UserRow({ user, onClick }: { user: Profile; onClick: () => void }) {
  return (
    <button className='list-row' style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', borderBottom: '1px solid var(--border)' }} onClick={onClick}>
      <Avatar profile={user} size={44} />
      <div className='col'><span className='name'>{user.full_name}</span>
        <span className='meta'>@{user.username}</span></div>
    </button>
  )
}
