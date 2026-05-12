import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'
import { apiRequest } from './_request'

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}
