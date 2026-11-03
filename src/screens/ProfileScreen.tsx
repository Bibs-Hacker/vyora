import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Modal } from '../components/ui'
import { PostCard } from '../components/PostCard'
import { Settings, Bookmark, Share, More, User } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import * as social from '../lib/social'
import * as api from '../lib/api'
import { getOrCreateDM } from '../lib/messages'
import { EditProfile } from '../components/EditProfile'
import type { Profile, Post } from '../lib/types'

export function ProfileScreen({ self }: { self?: boolean }) {
  const { id } = useParams()
  const { userId, profile: me } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const targetId = self ? userId! : id!
  const isMe = targetId === userId

  const [profile, setProfile] = useState<Profile | null>(null)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })
  const [state, setState] = useState<'none' | 'pending' | 'accepted'>('none')
  const [tab, setTab] = useState<'posts' | 'saved'>('posts')
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [saved, setSaved] = useState<Post[] | null>(null)
  const [editing, setEditing] = useState(false)
  const [menu, setMenu] = useState(false)
  const [listModal, setListModal] = useState<'followers' | 'following' | null>(null)
  const [list, setList] = useState<Profile[]>([])

  async function load() {
    const p = isMe ? me : await social.getProfile(targetId)
    setProfile(p)
    setCounts(await social.followCounts(targetId))
    if (!isMe && userId) setState(await social.followState(userId, targetId))
    setPosts(await api.fetchUserPosts(targetId, userId))
    if (isMe && userId) setSaved(await api.fetchBookmarks(userId))
  }
  useEffect(() => { load() }, [targetId, me])

  async function toggleFollow() {
    if (!userId || !profile) return
    if (state === 'none') { await social.follow(userId, targetId, profile.is_private); setState(profile.is_private ? 'pending' : 'accepted') }
    else { await social.unfollow(userId, targetId); setState('none') }
    setCounts(await social.followCounts(targetId))
  }
  async function message() {
    if (!userId) return
    try { const cid = await getOrCreateDM(targetId); navigate(`/messages/${cid}`) }
    catch { toast.show('Unable to start conversation', 'err') }
  }
  async function openList(kind: 'followers' | 'following') {
    setListModal(kind)
    setList(kind === 'followers' ? await social.listFollowers(targetId) : await social.listFollowing(targetId))
  }
  async function blockUser() {
    if (!userId) return
    await social.block(userId, targetId); setMenu(false); toast.show('User blocked', 'ok'); navigate('/')
  }
  async function report() {
    if (!userId) return
    await api.reportContent(userId, 'profile', targetId, 'Reported from profile'); setMenu(false); toast.show('Report submitted', 'ok')
  }
  function shareProfile() {
    const url = `${location.origin}/u/${targetId}`
    navigator.clipboard?.writeText(url).then(() => toast.show('Profile link copied', 'ok'))
  }

  if (!profile) return <div className='view'><div className='skel' style={{ height: 150, borderRadius: 18 }} /></div>

  return (
    <div className='view'>
      <div className='profile-cover'>{profile.cover_url && <img src={profile.cover_url} alt='' />}</div>
      <div className='profile-head'>
        <div className='row' style={{ alignItems: 'flex-end' }}>
          <Avatar profile={profile} size={88} />
          <div className='spacer' />
          {isMe ? (
            <>
              <button className='btn sm' onClick={() => setEditing(true)}>Edit profile</button>
              <button className='icon-btn' onClick={() => navigate('/settings')}><Settings /></button>
            </>
          ) : (
            <>
              <button className={`btn sm ${state === 'none' ? 'primary' : ''}`} onClick={toggleFollow}>
                {state === 'accepted' ? 'Following' : state === 'pending' ? 'Requested' : 'Follow'}</button>
              <button className='btn sm' onClick={message}>Message</button>
              <button className='icon-btn' onClick={() => setMenu(true)}><More /></button>
            </>
          )}
        </div>
        <h2 style={{ margin: '12px 0 2px' }}>{profile.full_name}</h2>
        <p className='muted' style={{ margin: 0 }}>@{profile.username}</p>
        {profile.bio && <p style={{ marginTop: 10 }}>{profile.bio}</p>}
        <p className='muted' style={{ fontSize: 12.5 }}>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        <div className='stat-row'>
          <button style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', padding: 0 }} onClick={() => openList('followers')}>
            <b>{counts.followers}</b><span>Followers</span></button>
          <button style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', padding: 0 }} onClick={() => openList('following')}>
            <b>{counts.following}</b><span>Following</span></button>
          <button style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', padding: 0 }} onClick={shareProfile}>
            <b><Share /></b><span>Share</span></button>
        </div>
      </div>

      {isMe && (
        <div className='seg'>
          <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Posts</button>
          <button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}><Bookmark /> Saved</button>
        </div>
      )}

      {tab === 'saved' && isMe ? (
        saved === null ? <div className='skel' style={{ height: 120 }} /> :
          saved.length === 0 ? <div className='empty'><Bookmark className='glyph' /><h4>No saved posts</h4><p>Bookmark posts to find them here later. Only you can see these.</p></div> :
          saved.map(p => <PostCard key={p.id} post={p} onChanged={load} onOpenProfile={uid => navigate(`/u/${uid}`)} />)
      ) : (
        posts === null ? <div className='skel' style={{ height: 120 }} /> :
          posts.length === 0 ? <div className='empty'><User className='glyph' /><h4>No posts yet</h4>{isMe && <p>Share your first moment with VYORA.</p>}</div> :
          posts.map(p => <PostCard key={p.id} post={p} onChanged={load} onOpenProfile={uid => navigate(`/u/${uid}`)} />)
      )}

      {editing && <EditProfile onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load() }} />}
      {menu && (
        <Modal title='Options' onClose={() => setMenu(false)}>
          <button className='btn block' style={{ marginBottom: 8 }} onClick={shareProfile}>Copy profile link</button>
          <button className='btn block danger' style={{ marginBottom: 8 }} onClick={blockUser}>Block @{profile.username}</button>
          <button className='btn block danger' onClick={report}>Report</button>
        </Modal>
      )}
      {listModal && (
        <Modal title={listModal === 'followers' ? 'Followers' : 'Following'} onClose={() => setListModal(null)}>
          {list.length === 0 ? <p className='muted'>Nobody here yet.</p> :
            list.map(u => (
              <button key={u.id} className='list-row' style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                onClick={() => { setListModal(null); navigate(`/u/${u.id}`) }}>
                <Avatar profile={u} size={40} />
                <div className='col'><span className='name'>{u.full_name}</span><span className='meta'>@{u.username}</span></div>
              </button>
            ))}
        </Modal>
      )}
    </div>
  )
}
