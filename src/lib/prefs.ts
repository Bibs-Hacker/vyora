import { supabase } from './supabase'
import type { Preferences } from './types'

export async function getPreferences(uid: string): Promise<Preferences | null> {
  const { data } = await supabase.from('user_preferences').select('*').eq('user_id', uid).maybeSingle()
  return data as Preferences | null
}

export async function savePreferences(uid: string, patch: Partial<Preferences>): Promise<void> {
  const { error } = await supabase.from('user_preferences')
    .upsert({ user_id: uid, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
}
