import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type Kind = 'ok' | 'err' | 'info'
interface ToastState { show: (msg: string, kind?: Kind) => void }
const Ctx = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: Kind } | null>(null)
  const show = useCallback((msg: string, kind: Kind = 'info') => {
    setToast({ msg, kind })
    window.setTimeout(() => setToast(null), 2600)
  }, [])
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
    </Ctx.Provider>
  )
}
export function useToast() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useToast must be used within ToastProvider')
  return v
}
