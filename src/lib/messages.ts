import { supabase } from './supabase'
import type { Conversation, Message, Profile } from './types'

export async function listConversations(uid: string): Promise<Conversation[]> {
  const { data: mine } = await supabase.from('conversation_members')
    .select('conversation_id, last_read_at').eq('user_id', uid)
  const ids = (mine ?? []).map((m: any) => m.conversation_id)
  if (!ids.length) return []
  const readMap = new Map((mine ?? []).map((m: any) => [m.conversation_id, m.last_read_at]))
  const { data: convs } = await supabase.from('conversations').select('*')
    .in('id', ids).order('last_message_at', { ascending: false })
  const { data: allMembers } = await supabase.from('conversation_members')
    .select('conversation_id, user_id').in('conversation_id', ids)
  const otherIds = [...new Set((allMembers ?? [])
    .filter((m: any) => m.user_id !== uid).map((m: any) => m.user_id))]
  const { data: profs } = await supabase.from('profiles').select('*').in('id', otherIds)
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]))
  const result: Conversation[] = []
  for (const c of convs ?? []) {
    const members = (allMembers ?? []).filter((m: any) => m.conversation_id === c.id && m.user_id !== uid)
      .map((m: any) => pmap.get(m.user_id)).filter(Boolean) as Profile[]
    const { data: lastArr } = await supabase.from('messages').select('*')
      .eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1)
    const last = (lastArr ?? [])[0] ?? null
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
      .eq('conversation_id', c.id).gt('created_at', readMap.get(c.id) ?? new Date(0).toISOString())
      .neq('sender_id', uid)
    result.push({ ...c, members, last_message: last, unread: count ?? 0 })
  }
  return result
}

export async function getOrCreateDM(other: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_dm', { other })
  if (error) throw error
  return data as string
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase.from('messages').select('*')
    .eq('conversation_id', conversationId).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Message[]
}

export async function sendMessage(conversationId: string, uid: string, content: string, imageUrl?: string): Promise<void> {
  const { error } = await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_id: uid, content: content || null, image_url: imageUrl ?? null })
  if (error) throw error
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId).eq('user_id', uid)
}

export async function leaveConversation(conversationId: string, uid: string): Promise<void> {
  await supabase.from('conversation_members').delete()
    .eq('conversation_id', conversationId).eq('user_id', uid)
}

// Realtime subscription to new messages in a conversation.
export function subscribeMessages(conversationId: string, onInsert: (m: Message) => void) {
  const channel = supabase.channel(`messages:${conversationId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(payload.new as Message))
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
