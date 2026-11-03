import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import { StoriesRail } from '../components/StoriesRail'
import { Home as HomeIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import * as api from '../lib/api'
import type { Post } from '../lib/types'

export function HomeScreen() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [page, setPage] = useState(0)
  const [done, setDone] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (p: number, replace = false) => {
    if (!userId) return
    const batch = await api.fetchFeed(userId, p)
    setPosts(prev => replace || !prev ? batch : [...prev, ...batch])
    if (batch.length < 10) setDone(true)
  }, [userId])

  useEffect(() => { load(0, true) }, [load])

  useEffect(() => {
    const el = sentinel.current
    if (!el || done) return
    const io = new IntersectionObserver(async ([e]) => {
      if (e.isIntersecting && !loadingMore) {
        setLoadingMore(true)
        const next = page + 1
        await load(next); setPage(next); setLoadingMore(false)
      }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [page, done, loadingMore, load])

  const refresh = () => { setPage(0); setDone(false); setPosts(null); load(0, true) }

  return (
    <div className='view'>
      <StoriesRail />
      <div className='row' style={{ marginBottom: 12 }}>
        <h2 className='section-title' style={{ margin: 0 }}>Home</h2>
        <div className='spacer' />
        <button className='btn sm ghost' onClick={refresh}>Refresh</button>
      </div>

      {posts === null ? (
        <>{[1, 2, 3].map(i => <div key={i} className='card'>
          <div className='row' style={{ gap: 10 }}><div className='skel' style={{ width: 42, height: 42, borderRadius: '50%' }} />
            <div className='col' style={{ gap: 6 }}><div className='skel' style={{ width: 120, height: 12 }} />
              <div className='skel' style={{ width: 80, height: 10 }} /></div></div>
          <div className='skel' style={{ height: 60, marginTop: 12 }} /></div>)}</>
      ) : posts.length === 0 ? (
        <div className='empty'>
          <HomeIcon className='glyph' />
          <h4>Your feed is quiet</h4>
          <p>Follow people in Discover, or share your first post to get started.</p>
          <button className='btn primary' style={{ marginTop: 12 }} onClick={() => navigate('/create')}>Create a post</button>
        </div>
      ) : (
        <>
          {posts.map(p => <PostCard key={p.id} post={p} onChanged={refresh}
            onOpenProfile={id => navigate(`/u/${id}`)} />)}
          {!done && <div ref={sentinel} className='skel' style={{ height: 40 }} />}
          {done && <p className='muted' style={{ textAlign: 'center', padding: 16 }}>You're all caught up.</p>}
        </>
      )}
    </div>
  )
}
