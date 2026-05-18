import type { AuthUser, LoginRequest, RegisterRequest } from '../types'
import { apiRequest } from './_request'

export function login(payload: LoginRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function register(payload: RegisterRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function logout(): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST' })
}
