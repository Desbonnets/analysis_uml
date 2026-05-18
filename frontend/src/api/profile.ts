import type { AuthUser, UpdateProfileRequest } from '../types'
import { apiRequest } from './_request'

export function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me')
}

export function updateMe(payload: UpdateProfileRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { method: 'PUT', body: JSON.stringify(payload) })
}
