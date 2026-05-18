import { apiRequest } from './_request'
import type { ClassDiagramDto, DependencyGraphDto, MetricsDto, PackageDiagramDto } from '../types'

export function getClassDiagram(projectId: number, recordId: string): Promise<ClassDiagramDto> {
  return apiRequest<ClassDiagramDto>(`/diagrams/${projectId}/class?recordId=${recordId}`)
}

export function getDependencyGraph(projectId: number, recordId: string): Promise<DependencyGraphDto> {
  return apiRequest<DependencyGraphDto>(`/diagrams/${projectId}/dependencies?recordId=${recordId}`)
}

export function getPackageDiagram(projectId: number, recordId: string): Promise<PackageDiagramDto> {
  return apiRequest<PackageDiagramDto>(`/diagrams/${projectId}/packages?recordId=${recordId}`)
}

export function getMetrics(projectId: number): Promise<MetricsDto> {
  return apiRequest<MetricsDto>(`/diagrams/${projectId}/metrics`)
}
