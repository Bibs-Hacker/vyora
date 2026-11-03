import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { ThemeName } from '../lib/types'

export const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'midnight', label: 'Midnight' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'rose', label: 'Rose' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'minimal', label: 'Minimal Light' }
]

type Mode = 'light' | 'dark' | 'system' | ThemeName

interface ThemeState {
  theme: Mode
  setTheme: (t: Mode) => void
}

const Ctx = createContext<ThemeState | null>(null)
const KEY = 'vyora.theme'

function resolve(mode: Mode): string {
  if (mode === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return dark ? 'midnight' : 'minimal'
  }
  if (mode === 'dark') return 'midnight'
  if (mode === 'light') return 'minimal'
  return mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Mode>(() => (localStorage.getItem(KEY) as Mode) || 'midnight')

  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme', resolve(theme))
    apply()
    localStorage.setItem(KEY, theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return <Ctx.Provider value={{ theme, setTheme: setThemeState }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}
