import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Erreur serveur')
  }

  return data as T
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', payload)
}

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', payload)
}
