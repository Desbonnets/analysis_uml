import type { RoleInfo } from '../types'
import { apiRequest } from './_request'

export function getRoles(): Promise<RoleInfo[]> {
  return apiRequest<RoleInfo[]>('/roles')
}
