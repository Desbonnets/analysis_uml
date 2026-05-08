import type { AuthUser, UpdateProfileRequest } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function apiRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erreur serveur')
  return data as T
}

export function getMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', token)
}

export function updateMe(token: string, payload: UpdateProfileRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
