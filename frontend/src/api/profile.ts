import type { AuthUser, UpdateProfileRequest } from '../types'
import { apiRequest } from './_request'

export function getMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', {}, token)
}

export function updateMe(token: string, payload: UpdateProfileRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }, token)
}
