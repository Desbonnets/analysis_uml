import { API_BASE } from './_request'
import type { BackendAnalysisResponse } from '../types'

interface UploadOpts {
  onUploadProgress?: (loaded: number, total: number) => void
  onUploadDone?: () => void
}

export function uploadAndAnalyze(
  token: string,
  projectId: number,
  file: File,
  opts: UploadOpts = {},
): Promise<BackendAnalysisResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) opts.onUploadProgress?.(e.loaded, e.total)
    })

    // fired when all bytes are sent — server is now processing
    xhr.upload.addEventListener('load', () => opts.onUploadDone?.())

    xhr.addEventListener('load', () => {
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

    xhr.timeout = 300_000 // 5 minutes — large ZIPs can take time

    xhr.open('POST', `${API_BASE}/analysis/${projectId}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}
