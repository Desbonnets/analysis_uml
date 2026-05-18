import type { AdminCreateUserRequest, AdminUpdateUserRequest, UserAdmin } from '../types'
import { apiRequest } from './_request'

export function getUsers(): Promise<UserAdmin[]> {
  return apiRequest<UserAdmin[]>('/users')
}

export function getUserById(id: number): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}`)
}

export function createUser(payload: AdminCreateUserRequest): Promise<UserAdmin> {
  return apiRequest<UserAdmin>('/users', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateUser(id: number, payload: AdminUpdateUserRequest): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteUser(id: number): Promise<void> {
  return apiRequest<void>(`/users/${id}`, { method: 'DELETE' })
}

export function updateUserRole(id: number, role: string): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
}
