import { supabase } from './supabase'
import type { AppNotification, Profile } from './types'

export async function listNotifications(uid: string): Promise<AppNotification[]> {
  const { data } = await supabase.from('notifications').select('*')
    .eq('user_id', uid).order('created_at', { ascending: false }).limit(50)
  const actorIds = [...new Set((data ?? []).map((n: any) => n.actor_id).filter(Boolean))]
  const { data: actors } = actorIds.length
    ? await supabase.from('profiles').select('*').in('id', actorIds)
    : { data: [] as any[] }
  const amap = new Map((actors ?? []).map((a: any) => [a.id, a]))
  return (data ?? []).map((n: any) => ({ ...n, actor: amap.get(n.actor_id) as Profile }))
}

export async function unreadCount(uid: string): Promise<number> {
  const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true })
    .eq('user_id', uid).eq('read', false)
  return count ?? 0
}

export async function markRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}
export async function markAllRead(uid: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
}

export function subscribeNotifications(uid: string, onInsert: () => void) {
  const channel = supabase.channel(`notif:${uid}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
      () => onInsert())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
