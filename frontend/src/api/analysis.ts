import { API_BASE, apiRequest } from './_request'
import type { AnalysisHistoryEntry, BackendAnalysisResponse } from '../types'

export function getAnalysisHistory(projectId: number): Promise<AnalysisHistoryEntry[]> {
  return apiRequest<AnalysisHistoryEntry[]>(`/analysis/${projectId}/history`)
}

interface UploadOpts {
  onUploadProgress?: (loaded: number, total: number) => void
  onUploadDone?: () => void
}

export function uploadAndAnalyze(
  projectId: number,
  file: File,
  opts: UploadOpts = {},
): Promise<BackendAnalysisResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) opts.onUploadProgress?.(e.loaded, e.total)
    })

    xhr.upload.addEventListener('load', () => opts.onUploadDone?.())

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        reject(new Error('Session expirée, veuillez vous reconnecter'))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as BackendAnalysisResponse)
        } catch {
          reject(new Error('Réponse invalide du serveur'))
        }
        return
      }
      let msg = "Erreur lors de l'analyse"
      try {
        const data = JSON.parse(xhr.responseText) as Record<string, unknown>
        if (typeof data.error === 'string') msg = data.error
        else if (typeof data.message === 'string') msg = data.message
      } catch { /* ignore */ }
      reject(new Error(msg))
    })

    xhr.addEventListener('error', () =>
      reject(new Error('Impossible de joindre le serveur. Vérifiez votre connexion.')))

    xhr.addEventListener('timeout', () =>
      reject(new Error("Délai d'attente dépassé (5 min)")))

    xhr.timeout = 300_000

    xhr.open('POST', `${API_BASE}/analysis/${projectId}`)
    xhr.send(formData)
  })
}
