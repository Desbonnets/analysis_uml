export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Données invalides',
  401: 'Session expirée, veuillez vous reconnecter',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  409: 'Cette ressource existe déjà',
  500: 'Erreur serveur, réessayez plus tard',
  502: 'Service indisponible',
  503: 'Service indisponible',
}

// 502/503/504 indicate a transient gateway/service issue (e.g. Docker startup).
const RETRYABLE = new Set([502, 503, 504])

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (data && typeof data.error === 'string') return data.error
  } catch {
    // non-JSON body (HTML error page, gateway timeout, etc.)
  }
  return STATUS_MESSAGES[res.status] ?? 'Erreur serveur'
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  _retries = 2,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
    })
  } catch {
    if (_retries > 0) {
      await delay(1000)
      return apiRequest<T>(path, options, _retries - 1)
    }
    throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion.')
  }

  if (res.status === 204) return undefined as T

  if (RETRYABLE.has(res.status) && _retries > 0) {
    await delay(1000)
    return apiRequest<T>(path, options, _retries - 1)
  }

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  if (!res.ok) throw new Error(await extractError(res))

  try {
    return (await res.json()) as T
  } catch {
    throw new Error('Réponse invalide du serveur')
  }
}
