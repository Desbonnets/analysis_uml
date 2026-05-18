import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AuthUser } from '../types'
import { logout as apiLogout } from '../api/auth'

interface AuthState {
  user: AuthUser | null
}

interface AuthContextValue extends AuthState {
  saveAuth: (user: AuthUser) => void
  clearAuth: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_KEY = 'auth_user'

function loadInitialState(): AuthState {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return { user: JSON.parse(raw) as AuthUser }
  } catch {
    // corrupted storage — ignore
  }
  return { user: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitialState)

  const saveAuth = useCallback((user: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ user })
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    setState({ user: null })
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // best-effort — clear client state regardless
    }
    clearAuth()
  }, [clearAuth])

  // Auto-logout when the server rejects the session (401)
  useEffect(() => {
    const handle = () => clearAuth()
    window.addEventListener('auth:unauthorized', handle)
    return () => window.removeEventListener('auth:unauthorized', handle)
  }, [clearAuth])

  // Sync logout across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY && !e.newValue) clearAuth()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [clearAuth])

  return (
    <AuthContext.Provider value={{ ...state, saveAuth, clearAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
