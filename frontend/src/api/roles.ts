import type { RoleInfo } from '../types'
import { apiRequest } from './_request'

export function getRoles(token: string): Promise<RoleInfo[]> {
  return apiRequest<RoleInfo[]>('/roles', {}, token)
}
