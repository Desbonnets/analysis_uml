import type { Project, ProjectMember, CreateProjectRequest, UpdateProjectRequest } from '../types'
import { apiRequest } from './_request'

export function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/projects')
}

export function getProjectById(id: number): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`)
}

export function createProject(payload: CreateProjectRequest): Promise<Project> {
  return apiRequest<Project>('/projects', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateProject(id: number, payload: UpdateProjectRequest): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteProject(id: number): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, { method: 'DELETE' })
}

export function generateProjectToken(id: number): Promise<{ token: string }> {
  return apiRequest<{ token: string }>(`/projects/${id}/token`, { method: 'POST' })
}

export function getProjectMembers(id: number): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[]>(`/projects/${id}/members`)
}

export function addProjectMember(id: number, userEmail: string, userName?: string): Promise<ProjectMember> {
  return apiRequest<ProjectMember>(
    `/projects/${id}/members`,
    { method: 'POST', body: JSON.stringify({ userEmail, userName }) },
  )
}

export function removeProjectMember(id: number, memberEmail: string): Promise<void> {
  return apiRequest<void>(`/projects/${id}/members/${encodeURIComponent(memberEmail)}`, { method: 'DELETE' })
}
