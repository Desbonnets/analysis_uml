import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AuthUser } from '../types'

interface AuthState {
  user: AuthUser | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  saveAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function loadInitialState(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (token && raw) {
      return { token, user: JSON.parse(raw) as AuthUser }
    }
  } catch {
    // corrupted storage — ignore
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitialState)

  const saveAuth = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ token, user })
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setState({ token: null, user: null })
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => clearAuth()
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [clearAuth])

  // Sync logout across tabs: if another tab clears the token, clear state here too.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) clearAuth()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [clearAuth])

  return (
    <AuthContext.Provider value={{ ...state, saveAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
