import { supabase } from './supabase'

// Local account switcher. We persist ONLY session tokens (access + refresh),
// never raw passwords. Switching replays a stored session via setSession.
export interface StoredAccount {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  access_token: string
  refresh_token: string
}

const KEY = 'vyora.accounts'

function read(): StoredAccount[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function write(list: StoredAccount[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function listAccounts(): StoredAccount[] { return read() }

export function rememberAccount(a: StoredAccount) {
  const list = read().filter(x => x.id !== a.id)
  list.unshift(a)
  write(list)
}

// Remove from THIS device only — does not delete the account on the backend.
export function removeAccount(id: string) {
  write(read().filter(x => x.id !== id))
}

export async function switchAccount(id: string): Promise<boolean> {
  const acc = read().find(x => x.id === id)
  if (!acc) return false
  const { error } = await supabase.auth.setSession({
    access_token: acc.access_token,
    refresh_token: acc.refresh_token
  })
  return !error
}

// Keep the stored tokens fresh after Supabase auto-refreshes them.
export function syncActiveTokens(id: string, access: string, refresh: string) {
  const list = read()
  const idx = list.findIndex(x => x.id === id)
  if (idx >= 0) { list[idx].access_token = access; list[idx].refresh_token = refresh; write(list) }
}
