import type { AdminCreateUserRequest, AdminUpdateUserRequest, UserAdmin } from '../types'

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
  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erreur serveur')
  return data as T
}

export function getUsers(token: string): Promise<UserAdmin[]> {
  return apiRequest<UserAdmin[]>('/users', token)
}

export function getUserById(token: string, id: number): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}`, token)
}

export function createUser(token: string, payload: AdminCreateUserRequest): Promise<UserAdmin> {
  return apiRequest<UserAdmin>('/users', token, { method: 'POST', body: JSON.stringify(payload) })
}

export function updateUser(token: string, id: number, payload: AdminUpdateUserRequest): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}`, token, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteUser(token: string, id: number): Promise<void> {
  return apiRequest<void>(`/users/${id}`, token, { method: 'DELETE' })
}

export function updateUserRole(token: string, id: number, role: string): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}/role`, token, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
}
