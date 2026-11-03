import { supabase } from './supabase'
import type { Story, Profile } from './types'

// Stories from people the user follows (plus their own), still within 24h.
export async function fetchStories(uid: string): Promise<Story[]> {
  const { data: following } = await supabase.from('follows')
    .select('followee_id').eq('follower_id', uid).eq('status', 'accepted')
  const authorIds = [uid, ...(following ?? []).map((f: any) => f.followee_id)]
  const { data } = await supabase.from('stories').select('*')
    .in('author_id', authorIds).gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
  const ids = [...new Set((data ?? []).map((s: any) => s.author_id))]
  const { data: profs } = ids.length
    ? await supabase.from('profiles').select('*').in('id', ids) : { data: [] as any[] }
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]))
  return (data ?? []).map((s: any) => ({ ...s, author: pmap.get(s.author_id) as Profile }))
}

export async function createStory(uid: string, mediaUrl: string, mediaType: 'image' | 'video', caption: string): Promise<void> {
  const { error } = await supabase.from('stories')
    .insert({ author_id: uid, media_url: mediaUrl, media_type: mediaType, caption: caption || null })
  if (error) throw error
}

export async function deleteStory(id: string): Promise<void> {
  await supabase.from('stories').delete().eq('id', id)
}

export async function recordView(storyId: string, viewer: string): Promise<void> {
  await supabase.from('story_views').upsert({ story_id: storyId, viewer_id: viewer },
    { onConflict: 'story_id,viewer_id' })
}

export async function storyViewers(storyId: string): Promise<Profile[]> {
  const { data } = await supabase.from('story_views').select('viewer_id').eq('story_id', storyId)
  const ids = (data ?? []).map((r: any) => r.viewer_id)
  if (!ids.length) return []
  const { data: profs } = await supabase.from('profiles').select('*').in('id', ids)
  return (profs ?? []) as Profile[]
}
