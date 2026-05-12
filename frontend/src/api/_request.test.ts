import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiRequest } from './_request'

describe('apiRequest', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('throws a connection error when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(apiRequest('/test')).rejects.toThrow('Impossible de joindre le serveur')
  })

  it('returns parsed JSON on 200', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
    const result = await apiRequest<{ id: number }>('/test')
    expect(result).toEqual({ id: 1 })
  })

  it('returns undefined for 204', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiRequest('/test')).resolves.toBeUndefined()
  })

  it('uses the error field from a JSON error body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Email ou mot de passe incorrect' }), { status: 401 }),
    )
    await expect(apiRequest('/auth/login', { method: 'POST', body: '{}' }))
      .rejects.toThrow('Email ou mot de passe incorrect')
  })

  it('falls back to status-mapped message for non-JSON 502', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    )
    await expect(apiRequest('/test')).rejects.toThrow('Service indisponible')
  })

  it('maps 401 without error field to session-expired message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: 401 }), { status: 401 }),
    )
    await expect(apiRequest('/test', {}, 'token')).rejects.toThrow('Session expirée')
  })

  it('maps 403 to access-denied message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 403 }),
    )
    await expect(apiRequest('/test', {}, 'token')).rejects.toThrow('Accès refusé')
  })

  it('sends Authorization header when a token is provided', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    await apiRequest('/test', {}, 'my-token')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    )
  })

  it('does not send Authorization header when no token', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    await apiRequest('/test')
    const [, opts] = vi.mocked(fetch).mock.calls[0]
    expect((opts?.headers as Record<string, string>)?.Authorization).toBeUndefined()
  })
})
