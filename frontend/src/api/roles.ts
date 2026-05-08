import type { RoleInfo } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function getRoles(token: string): Promise<RoleInfo[]> {
  const res = await fetch(`${API_BASE}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erreur serveur')
  return data as RoleInfo[]
}
