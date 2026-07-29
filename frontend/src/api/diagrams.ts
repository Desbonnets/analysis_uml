import { apiRequest } from './_request'
import type { ClassDiagramDto, ConformanceReportDto, DependencyGraphDto, MetricsDto, PackageDiagramDto } from '../types'

export interface ClassDiagramFilters {
  filter?: string
  types?: string[]
  packageContains?: string
}

function filterParams(recordId: string, filters?: ClassDiagramFilters): URLSearchParams {
  const params = new URLSearchParams({ recordId })
  if (filters?.filter) params.set('filter', filters.filter)
  if (filters?.types && filters.types.length > 0) params.set('types', filters.types.join(','))
  if (filters?.packageContains) params.set('packageContains', filters.packageContains)
  return params
}

export function getClassDiagram(projectId: number, recordId: string, filters?: ClassDiagramFilters): Promise<ClassDiagramDto> {
  return apiRequest<ClassDiagramDto>(`/diagrams/${projectId}/class?${filterParams(recordId, filters)}`)
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

export function checkConformance(
  projectId: number,
  recordId: string,
  source: string,
  filters?: ClassDiagramFilters,
): Promise<ConformanceReportDto> {
  return apiRequest<ConformanceReportDto>(`/diagrams/${projectId}/conformance?${filterParams(recordId, filters)}`, {
    method: 'POST',
    body: JSON.stringify({ source }),
  })
}

export function renderPlantUml(source: string): Promise<{ svg: string | null }> {
  return apiRequest<{ svg: string | null }>('/diagrams/render-plantuml', {
    method: 'POST',
    body: JSON.stringify({ source }),
  })
}
