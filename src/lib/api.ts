import { supabase } from './supabase'
import type { Post, Comment, Profile } from './types'

const PAGE = 10

// Attach author, media, counts, and per-user like/bookmark flags to posts.
async function hydrate(rows: any[], uid: string | null): Promise<Post[]> {
  if (!rows.length) return []
  const ids = rows.map(r => r.id)
  const authorIds = [...new Set(rows.map(r => r.author_id))]
  const [authors, media, likes, myLikes, myMarks, comments] = await Promise.all([
    supabase.from('profiles').select('*').in('id', authorIds),
    supabase.from('post_media').select('*').in('post_id', ids).order('position'),
    supabase.from('likes').select('post_id').in('post_id', ids),
    uid ? supabase.from('likes').select('post_id').in('post_id', ids).eq('user_id', uid)
        : Promise.resolve({ data: [] as any[] }),
    uid ? supabase.from('bookmarks').select('post_id').in('post_id', ids).eq('user_id', uid)
        : Promise.resolve({ data: [] as any[] }),
    supabase.from('comments').select('post_id').in('post_id', ids)
  ])
  const amap = new Map((authors.data ?? []).map((a: any) => [a.id, a]))
  const likeCount = new Map<string, number>()
  ;(likes.data ?? []).forEach((l: any) => likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1))
  const commentCount = new Map<string, number>()
  ;(comments.data ?? []).forEach((c: any) => commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1))
  const liked = new Set((myLikes.data ?? []).map((l: any) => l.post_id))
  const marked = new Set((myMarks.data ?? []).map((b: any) => b.post_id))
  const mediaByPost = new Map<string, any[]>()
  ;(media.data ?? []).forEach((m: any) => {
    const arr = mediaByPost.get(m.post_id) ?? []; arr.push(m); mediaByPost.set(m.post_id, arr)
  })
  return rows.map(r => ({
    ...r,
    author: amap.get(r.author_id),
    media: mediaByPost.get(r.id) ?? [],
    like_count: likeCount.get(r.id) ?? 0,
    comment_count: commentCount.get(r.id) ?? 0,
    liked_by_me: liked.has(r.id),
    bookmarked_by_me: marked.has(r.id)
  }))
}

// Home feed: own posts + posts from accepted follows, newest first, paginated.
export async function fetchFeed(uid: string, page = 0): Promise<Post[]> {
  const { data: following } = await supabase
    .from('follows').select('followee_id').eq('follower_id', uid).eq('status', 'accepted')
  const authorIds = [uid, ...(following ?? []).map((f: any) => f.followee_id)]
  const { data, error } = await supabase
    .from('posts').select('*').in('author_id', authorIds)
    .order('created_at', { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1)
  if (error) throw error
  return hydrate(data ?? [], uid)
}

// Discover: recent public posts the viewer is allowed to see (RLS filters).
export async function fetchDiscover(uid: string | null, page = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts').select('*')
    .order('created_at', { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1)
  if (error) throw error
  return hydrate(data ?? [], uid)
}

export async function fetchUserPosts(authorId: string, uid: string | null): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts').select('*').eq('author_id', authorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return hydrate(data ?? [], uid)
}

export async function fetchBookmarks(uid: string): Promise<Post[]> {
  const { data: marks } = await supabase.from('bookmarks').select('post_id').eq('user_id', uid)
  const ids = (marks ?? []).map((m: any) => m.post_id)
  if (!ids.length) return []
  const { data } = await supabase.from('posts').select('*').in('id', ids)
    .order('created_at', { ascending: false })
  return hydrate(data ?? [], uid)
}

export async function createPost(uid: string, content: string, mediaUrls: string[]): Promise<void> {
  const { data, error } = await supabase.from('posts')
    .insert({ author_id: uid, content: content || null }).select('id').single()
  if (error) throw error
  if (mediaUrls.length) {
    const rows = mediaUrls.map((url, i) => ({ post_id: data.id, url, position: i }))
    const { error: me } = await supabase.from('post_media').insert(rows)
    if (me) throw me
  }
}

export async function updatePost(postId: string, content: string): Promise<void> {
  const { error } = await supabase.from('posts').update({ content }).eq('id', postId)
  if (error) throw error
}
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function toggleLike(postId: string, uid: string, liked: boolean): Promise<void> {
  if (liked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', uid)
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: uid })
  }
}
export async function toggleBookmark(postId: string, uid: string, marked: boolean): Promise<void> {
  if (marked) {
    await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', uid)
  } else {
    await supabase.from('bookmarks').insert({ post_id: postId, user_id: uid })
  }
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await supabase.from('comments').select('*').eq('post_id', postId)
    .order('created_at', { ascending: true })
  const authorIds = [...new Set((data ?? []).map((c: any) => c.author_id))]
  const { data: authors } = await supabase.from('profiles').select('*').in('id', authorIds)
  const amap = new Map((authors ?? []).map((a: any) => [a.id, a]))
  return (data ?? []).map((c: any) => ({ ...c, author: amap.get(c.author_id) }))
}
export async function addComment(postId: string, uid: string, content: string, parentId?: string): Promise<void> {
  const { error } = await supabase.from('comments')
    .insert({ post_id: postId, author_id: uid, content, parent_id: parentId ?? null })
  if (error) throw error
}
export async function deleteComment(id: string): Promise<void> {
  await supabase.from('comments').delete().eq('id', id)
}

export async function reportContent(uid: string, targetType: string, targetId: string, reason: string) {
  const { error } = await supabase.from('reports')
    .insert({ reporter_id: uid, target_type: targetType, target_id: targetId, reason })
  if (error) throw error
}
