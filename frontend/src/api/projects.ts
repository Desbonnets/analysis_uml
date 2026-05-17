import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types'
import { apiRequest } from './_request'

export function getProjects(token: string): Promise<Project[]> {
  return apiRequest<Project[]>('/projects', {}, token)
}

export function getProjectById(token: string, id: number): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {}, token)
}

export function createProject(token: string, payload: CreateProjectRequest): Promise<Project> {
  return apiRequest<Project>('/projects', { method: 'POST', body: JSON.stringify(payload) }, token)
}

export function updateProject(token: string, id: number, payload: UpdateProjectRequest): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
}

export function deleteProject(token: string, id: number): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, { method: 'DELETE' }, token)
}

export function generateProjectToken(token: string, id: number): Promise<{ token: string }> {
  return apiRequest<{ token: string }>(`/projects/${id}/token`, { method: 'POST' }, token)
}
