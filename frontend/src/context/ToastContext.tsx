import { createContext, useContext, useState, useCallback } from 'react'
import { Check, X, AlertCircle, Info } from 'lucide-react'

type Tone = 'ok' | 'bad' | 'warn' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: Tone
  leaving: boolean
}

interface ToastContextValue {
  showToast: (message: string, tone?: Tone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLE: Record<Tone, { bg: string; border: string; color: string }> = {
  ok:   { bg: 'var(--ok-soft)',   border: 'var(--ok)',   color: 'var(--ok)'   },
  bad:  { bg: 'var(--bad-soft)',  border: 'var(--bad)',  color: 'var(--bad)'  },
  warn: { bg: 'var(--warn-soft)', border: 'var(--warn)', color: 'var(--warn)' },
  info: { bg: 'var(--info-soft)', border: 'var(--info)', color: 'var(--info)' },
}

const TONE_ICON: Record<Tone, React.ReactNode> = {
  ok:   <Check size={14} />,
  bad:  <X size={14} />,
  warn: <AlertCircle size={14} />,
  info: <Info size={14} />,
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  const showToast = useCallback((message: string, tone: Tone = 'ok') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, tone, leaving: false }])
    setTimeout(() => removeToast(id), 3500)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const s = TONE_STYLE[t.tone]
          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                color: 'var(--fg-0)',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                pointerEvents: 'auto',
                animation: t.leaving
                  ? 'toast-out 0.3s ease forwards'
                  : 'toast-in 0.25s ease forwards',
                minWidth: 240, maxWidth: 380,
              }}
            >
              <span style={{ color: s.color, display: 'flex', flexShrink: 0 }}>{TONE_ICON[t.tone]}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex', padding: 2 }}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
