import { supabase } from './supabase'
import type { Profile } from './types'

export async function getProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  return data as Profile | null
}
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*')
    .eq('username', username.toLowerCase()).maybeSingle()
  return data as Profile | null
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('id')
    .eq('username', username.toLowerCase()).maybeSingle()
  return !data
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw error
}

export async function followCounts(id: string): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true })
      .eq('followee_id', id).eq('status', 'accepted'),
    supabase.from('follows').select('*', { count: 'exact', head: true })
      .eq('follower_id', id).eq('status', 'accepted')
  ])
  return { followers: followers ?? 0, following: following ?? 0 }
}

export async function followState(me: string, target: string): Promise<'none' | 'pending' | 'accepted'> {
  const { data } = await supabase.from('follows').select('status')
    .eq('follower_id', me).eq('followee_id', target).maybeSingle()
  return (data?.status as any) ?? 'none'
}

export async function follow(me: string, target: string, targetPrivate: boolean): Promise<void> {
  const { error } = await supabase.from('follows')
    .insert({ follower_id: me, followee_id: target, status: targetPrivate ? 'pending' : 'accepted' })
  if (error) throw error
}
export async function unfollow(me: string, target: string): Promise<void> {
  await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', target)
}
export async function acceptFollowRequest(me: string, follower: string): Promise<void> {
  await supabase.from('follows').update({ status: 'accepted' })
    .eq('follower_id', follower).eq('followee_id', me)
}

export async function listFollowers(id: string): Promise<Profile[]> {
  const { data } = await supabase.from('follows').select('follower_id')
    .eq('followee_id', id).eq('status', 'accepted')
  const ids = (data ?? []).map((r: any) => r.follower_id)
  if (!ids.length) return []
  const { data: profs } = await supabase.from('profiles').select('*').in('id', ids)
  return (profs ?? []) as Profile[]
}
export async function listFollowing(id: string): Promise<Profile[]> {
  const { data } = await supabase.from('follows').select('followee_id')
    .eq('follower_id', id).eq('status', 'accepted')
  const ids = (data ?? []).map((r: any) => r.followee_id)
  if (!ids.length) return []
  const { data: profs } = await supabase.from('profiles').select('*').in('id', ids)
  return (profs ?? []) as Profile[]
}

// Debounce-friendly search. ilike with escaped wildcards keeps it safe.
export async function searchUsers(term: string): Promise<Profile[]> {
  const q = term.replace(/[%_]/g, m => '\\' + m)
  const { data } = await supabase.from('profiles').select('*')
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`).limit(20)
  return (data ?? []) as Profile[]
}

export async function suggestedUsers(me: string): Promise<Profile[]> {
  const { data: mine } = await supabase.from('follows').select('followee_id').eq('follower_id', me)
  const exclude = [me, ...(mine ?? []).map((r: any) => r.followee_id)]
  const { data } = await supabase.from('profiles').select('*')
    .not('id', 'in', `(${exclude.join(',')})`).limit(10)
  return (data ?? []) as Profile[]
}

export async function block(me: string, target: string): Promise<void> {
  await supabase.from('follows').delete().or(
    `and(follower_id.eq.${me},followee_id.eq.${target}),and(follower_id.eq.${target},followee_id.eq.${me})`)
  const { error } = await supabase.from('blocks').insert({ blocker_id: me, blocked_id: target })
  if (error) throw error
}
export async function unblock(me: string, target: string): Promise<void> {
  await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', target)
}
export async function listBlocked(me: string): Promise<Profile[]> {
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', me)
  const ids = (data ?? []).map((r: any) => r.blocked_id)
  if (!ids.length) return []
  const { data: profs } = await supabase.from('profiles').select('*').in('id', ids)
  return (profs ?? []) as Profile[]
}
