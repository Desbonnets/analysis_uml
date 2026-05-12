import type { AdminCreateUserRequest, AdminUpdateUserRequest, UserAdmin } from '../types'
import { apiRequest } from './_request'

export function getUsers(token: string): Promise<UserAdmin[]> {
  return apiRequest<UserAdmin[]>('/users', {}, token)
}

export function getUserById(token: string, id: number): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}`, {}, token)
}

export function createUser(token: string, payload: AdminCreateUserRequest): Promise<UserAdmin> {
  return apiRequest<UserAdmin>('/users', { method: 'POST', body: JSON.stringify(payload) }, token)
}

export function updateUser(token: string, id: number, payload: AdminUpdateUserRequest): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
}

export function deleteUser(token: string, id: number): Promise<void> {
  return apiRequest<void>(`/users/${id}`, { method: 'DELETE' }, token)
}

export function updateUserRole(token: string, id: number, role: string): Promise<UserAdmin> {
  return apiRequest<UserAdmin>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }, token)
}
