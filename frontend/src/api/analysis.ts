import { API_BASE } from './_request'
import type { BackendAnalysisResponse } from '../types'

export async function uploadAndAnalyze(
  token: string,
  projectId: number,
  file: File,
): Promise<BackendAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)

  let res: Response
  try {
    res = await fetch(`${API_BASE}/analysis/${projectId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion.')
  }

  if (!res.ok) {
    let msg = "Erreur lors de l'analyse"
    try {
      const data = await res.json() as Record<string, unknown>
      if (typeof data.error === 'string') msg = data.error
      else if (typeof data.message === 'string') msg = data.message
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  return res.json() as Promise<BackendAnalysisResponse>
}
