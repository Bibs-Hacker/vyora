import { useState } from 'react'
import { Avatar, Modal, timeAgo } from './ui'
import { Heart, Comment, Bookmark, Share, More, Trash, Check } from './Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import * as api from '../lib/api'
import type { Post, Comment as C } from '../lib/types'

export function PostCard({ post, onChanged, onOpenProfile }:
  { post: Post; onChanged: () => void; onOpenProfile?: (id: string) => void }) {
  const { userId } = useAuth()
  const toast = useToast()
  const [liked, setLiked] = useState(!!post.liked_by_me)
  const [likes, setLikes] = useState(post.like_count ?? 0)
  const [marked, setMarked] = useState(!!post.bookmarked_by_me)
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content ?? '')
  const [comments, setComments] = useState<C[] | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [reporting, setReporting] = useState(false)
  const mine = post.author_id === userId

  async function like() {
    if (!userId) return
    setLiked(!liked); setLikes(l => l + (liked ? -1 : 1))
    try { await api.toggleLike(post.id, userId, liked) }
    catch { setLiked(liked); setLikes(post.like_count ?? 0); toast.show('Could not update like', 'err') }
  }
  async function bookmark() {
    if (!userId) return
    setMarked(!marked)
    try { await api.toggleBookmark(post.id, userId, marked); toast.show(marked ? 'Removed' : 'Saved', 'ok') }
    catch { setMarked(marked); toast.show('Could not save', 'err') }
  }
  async function loadComments() {
    setShowComments(true)
    setComments(await api.fetchComments(post.id))
  }
  async function submitComment() {
    if (!userId || !newComment.trim()) return
    await api.addComment(post.id, userId, newComment.trim())
    setNewComment(''); setComments(await api.fetchComments(post.id)); onChanged()
  }
  async function saveEdit() {
    await api.updatePost(post.id, draft); setEditing(false); onChanged(); toast.show('Post updated', 'ok')
  }
  async function remove() {
    await api.deletePost(post.id); setMenu(false); onChanged(); toast.show('Post deleted', 'ok')
  }
  async function share() {
    const url = `${location.origin}/post/${post.id}`
    try { await navigator.clipboard.writeText(url); toast.show('Link copied', 'ok') }
    catch { toast.show(url, 'info') }
  }
  async function submitReport(reason: string) {
    if (!userId) return
    await api.reportContent(userId, 'post', post.id, reason)
    setReporting(false); toast.show('Report submitted', 'ok')
  }

  return (
    <article className='card'>
      <div className='post-head'>
        <button className='row' style={{ background: 'none', border: 'none', padding: 0, gap: 10 }}
          onClick={() => onOpenProfile?.(post.author_id)}>
          <Avatar profile={post.author} size={42} />
          <div className='col' style={{ alignItems: 'flex-start' }}>
            <span className='name'>{post.author?.full_name}</span>
            <span className='meta'>@{post.author?.username} · {timeAgo(post.created_at)}</span>
          </div>
        </button>
        <div className='spacer' />
        <button className='icon-btn' onClick={() => setMenu(true)} aria-label='More'><More /></button>
      </div>

      {editing ? (
        <div>
          <textarea className='input' rows={3} value={draft} onChange={e => setDraft(e.target.value)} />
          <div className='row' style={{ marginTop: 8, gap: 8 }}>
            <button className='btn sm primary' onClick={saveEdit}>Save</button>
            <button className='btn sm ghost' onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : post.content && <div className='post-body'>{post.content}</div>}

      {post.media && post.media.length > 0 && (
        <div className={`post-media ${post.media.length > 1 ? 'multi' : ''}`}>
          {post.media.map(m => <img key={m.id} src={m.url} alt='' loading='lazy' />)}
        </div>
      )}

      <div className='post-actions'>
        <button className={`act like ${liked ? 'on' : ''}`} onClick={like}><Heart /> {likes || ''}</button>
        <button className='act' onClick={loadComments}><Comment /> {post.comment_count || ''}</button>
        <button className='act' onClick={share}><Share /></button>
        <div className='spacer' />
        <button className={`act ${marked ? 'on' : ''}`} onClick={bookmark}><Bookmark /></button>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {comments === null ? <div className='skel' style={{ height: 40 }} /> :
            comments.length === 0 ? <p className='muted' style={{ fontSize: 13 }}>No comments yet.</p> :
            comments.map(c => (
              <div key={c.id} className='row' style={{ alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                <Avatar profile={c.author} size={30} />
                <div className='col'>
                  <span style={{ fontSize: 13.5 }}><b>@{c.author?.username}</b> {c.content}</span>
                  <span className='meta'>{timeAgo(c.created_at)}</span>
                </div>
              </div>
            ))}
          <div className='row' style={{ gap: 8, marginTop: 8 }}>
            <input className='input' placeholder='Add a comment…' value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()} />
            <button className='btn sm primary' onClick={submitComment}><Check /></button>
          </div>
        </div>
      )}

      {menu && (
        <Modal title='Post options' onClose={() => setMenu(false)}>
          {mine && <button className='btn block' style={{ marginBottom: 8 }}
            onClick={() => { setEditing(true); setMenu(false) }}>Edit post</button>}
          {mine && <button className='btn block danger' style={{ marginBottom: 8 }} onClick={remove}><Trash /> Delete post</button>}
          <button className='btn block' style={{ marginBottom: 8 }} onClick={() => { share(); setMenu(false) }}>Copy link</button>
          {!mine && <button className='btn block danger' onClick={() => { setMenu(false); setReporting(true) }}>Report</button>}
        </Modal>
      )}
      {reporting && (
        <Modal title='Report post' onClose={() => setReporting(false)}>
          <p className='muted' style={{ fontSize: 14 }}>Why are you reporting this post?</p>
          {['Spam', 'Harassment', 'Inappropriate content', 'Misinformation'].map(r => (
            <button key={r} className='btn block' style={{ marginBottom: 8 }} onClick={() => submitReport(r)}>{r}</button>
          ))}
        </Modal>
      )}
    </article>
  )
}
