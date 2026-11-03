import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/social'
import { rememberAccount, syncActiveTokens } from '../lib/accounts'
import type { Profile } from '../lib/types'

interface AuthState {
  loading: boolean
  userId: string | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
  signUp: (p: SignUpInput) => Promise<void>
  signIn: (identifier: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export interface SignUpInput {
  fullName: string; username: string; email: string; password: string
  gender?: string; avatarUrl?: string
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = useCallback(async (id: string | null) => {
    if (!id) { setProfile(null); return }
    const p = await getProfile(id)
    setProfile(p)
    const { data } = await supabase.auth.getSession()
    if (p && data.session) {
      rememberAccount({
        id: p.id, username: p.username, full_name: p.full_name, avatar_url: p.avatar_url,
        access_token: data.session.access_token, refresh_token: data.session.refresh_token
      })
    }
  }, [])

  const refreshProfile = useCallback(async () => { await loadProfile(userId) }, [userId, loadProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user.id ?? null
      setUserId(id)
      loadProfile(id).finally(() => setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const id = session?.user.id ?? null
      setUserId(id)
      if (id && session) syncActiveTokens(id, session.access_token, session.refresh_token)
      loadProfile(id)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signUp = async (p: SignUpInput) => {
    const { error } = await supabase.auth.signUp({
      email: p.email, password: p.password,
      options: { data: { full_name: p.fullName, username: p.username.toLowerCase(),
                         gender: p.gender, avatar_url: p.avatarUrl } }
    })
    if (error) throw error
  }

  const signIn = async (identifier: string, password: string) => {
    let email = identifier.trim()
    // Allow username login by resolving to the account email server-side would
    // be ideal; here we only accept email to avoid leaking account existence.
    if (!email.includes('@')) {
      throw new Error('Please sign in with your email address.')
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Incorrect email or password.')
  }

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null); setUserId(null) }

  return (
    <Ctx.Provider value={{ loading, userId, profile, refreshProfile, signUp, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
