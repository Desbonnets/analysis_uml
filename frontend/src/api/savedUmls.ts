import { apiRequest } from './_request'
import type { SavedUmlDiagram } from '../types'

export interface SavedUmlDiagramPayload {
  name: string
  projectId: number | null
  source: string
}

export function listSavedUmlDiagrams(projectId?: number): Promise<SavedUmlDiagram[]> {
  const query = projectId != null ? `?projectId=${projectId}` : ''
  return apiRequest<SavedUmlDiagram[]>(`/diagrams/saved-umls${query}`)
}

export function getSavedUmlDiagram(id: number): Promise<SavedUmlDiagram> {
  return apiRequest<SavedUmlDiagram>(`/diagrams/saved-umls/${id}`)
}

export function createSavedUmlDiagram(payload: SavedUmlDiagramPayload): Promise<SavedUmlDiagram> {
  return apiRequest<SavedUmlDiagram>('/diagrams/saved-umls', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateSavedUmlDiagram(id: number, payload: SavedUmlDiagramPayload): Promise<SavedUmlDiagram> {
  return apiRequest<SavedUmlDiagram>(`/diagrams/saved-umls/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteSavedUmlDiagram(id: number): Promise<void> {
  return apiRequest<void>(`/diagrams/saved-umls/${id}`, { method: 'DELETE' })
}
