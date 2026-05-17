import { apiRequest } from './_request'
import type { ClassDiagramDto, DependencyGraphDto, MetricsDto, PackageDiagramDto } from '../types'

export function getClassDiagram(token: string, projectId: number, recordId: string): Promise<ClassDiagramDto> {
  return apiRequest<ClassDiagramDto>(`/diagrams/${projectId}/class?recordId=${recordId}`, {}, token)
}

export function getDependencyGraph(token: string, projectId: number, recordId: string): Promise<DependencyGraphDto> {
  return apiRequest<DependencyGraphDto>(`/diagrams/${projectId}/dependencies?recordId=${recordId}`, {}, token)
}

export function getPackageDiagram(token: string, projectId: number, recordId: string): Promise<PackageDiagramDto> {
  return apiRequest<PackageDiagramDto>(`/diagrams/${projectId}/packages?recordId=${recordId}`, {}, token)
}

export function getMetrics(token: string, projectId: number): Promise<MetricsDto> {
  return apiRequest<MetricsDto>(`/diagrams/${projectId}/metrics`, {}, token)
}
