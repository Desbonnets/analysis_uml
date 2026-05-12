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
  token?: string,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion.')
  }

  if (res.status === 204) return undefined as T

  if (!res.ok) throw new Error(await extractError(res))

  try {
    return (await res.json()) as T
  } catch {
    throw new Error('Réponse invalide du serveur')
  }
}
