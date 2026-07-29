export interface ProjectMember {
  userEmail: string
  userName: string
  role: 'owner' | 'member'
}

export interface Project {
  id: number
  name: string
  description: string
  language: 'Spring Boot' | 'Symfony' | 'Laravel' | 'Node.js'
  status: 'analyzed' | 'pending' | 'error' | 'new'
  createdAt: string
  updatedAt: string
  score: number
  diagramsCount: number
  violationsCount: number
  ownerEmail: string
  ownerName: string
  repositoryUrl?: string
  hasApiToken?: boolean
  members?: ProjectMember[]
}

export interface CreateProjectRequest {
  name: string
  description: string
  language: string
  repositoryUrl?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  language?: string
  status?: string
  score?: number
  diagramsCount?: number
  violationsCount?: number
}

export interface DiagramClass {
  id: string
  name: string
  type: 'class' | 'interface' | 'abstract' | 'enum'
  package: string
  attributes: string[]
  methods: string[]
  x: number
  y: number
}

export interface DiagramRelation {
  from: string
  to: string
  type: 'extends' | 'implements' | 'uses' | 'aggregates'
}

export interface Diagram {
  id: string
  projectId: string
  name: string
  type: 'class' | 'dependency' | 'package' | 'sequence'
  createdAt: string
  updatedAt: string
  classes: DiagramClass[]
  relations: DiagramRelation[]
}

export interface Violation {
  id: string
  projectId: string
  type: 'SOLID' | 'DEPENDENCY' | 'ARCHITECTURE' | 'PATTERN'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  file: string
  line: number
}

export type RoleName = 'admin' | 'architect' | 'developer'
export type PlanName = 'free' | 'pro' | 'enterprise'

export interface RoleInfo {
  id: number
  name: RoleName
  displayName: string
  description: string
  permissions: string[]
}

export interface User {
  id: string
  name: string
  email: string
  role: RoleName
  plan: PlanName
  avatar: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: RoleName
  plan: PlanName
}

export interface UserAdmin {
  id: number
  name: string
  email: string
  role: RoleInfo
  plan: PlanName
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export interface AdminCreateUserRequest {
  name: string
  email: string
  password: string
  role: string
  plan: string
}

export interface AdminUpdateUserRequest {
  name?: string
  email?: string
  role?: string
  plan?: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AnalysisResult {
  projectId: string
  score: number
  debtHours: number
  testedAt: string
  summary: string
  byCategory: {
    solid: number
    coupling: number
    cohesion: number
    patterns: number
  }
}

// Backend analysis response types
export interface FieldDef {
  name: string
  type: string
  visibility: string
  isStatic: boolean
  isFinal: boolean
}

export interface MethodDef {
  name: string
  returnType: string
  visibility: string
  parameterTypes: string[]
  isStatic: boolean
  isAbstract: boolean
}

export interface ClassDef {
  name: string
  qualifiedName: string
  type: 'CLASS' | 'ABSTRACT_CLASS' | 'INTERFACE' | 'ENUM' | 'RECORD' | 'ANNOTATION'
  visibility: string
  superClass?: string
  interfaces: string[]
  methods: MethodDef[]
  fields: FieldDef[]
  dependencies: string[]
}

export interface CodeUnit {
  fileName: string
  packageName: string
  language: string
  imports: string[]
  classes: ClassDef[]
}

export interface BackendAnalysisResponse {
  recordId: string
  projectId: number
  storageKey: string
  status: string
  message: string
  filesAnalyzed: number
  classesFound: number
  codeUnits: CodeUnit[]
  unsupportedLanguages?: string[]
}

export interface AnalysisHistoryEntry {
  recordId: string
  projectId: number
  projectName: string
  analyzedAt: string
  filesAnalyzed: number
  classesFound: number
  unsupportedLanguages: string[]
}

export interface DiagramNode {
  id: string
  name: string
  qualifiedName: string
  type: string
  packageName: string
  fields: string[]
  methods: string[]
}

export interface DiagramEdge {
  from: string
  to: string
  type: string
}

export interface ClassDiagramDto {
  projectId: number
  recordId: string
  generatedAt: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export interface DependencyGraphDto {
  projectId: number
  recordId: string
  generatedAt: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export interface PackageNode {
  name: string
  classCount: number
  classes: string[]
  dependsOn: string[]
}

export interface PackageDiagramDto {
  projectId: number
  recordId: string
  generatedAt: string
  packages: PackageNode[]
  edges: DiagramEdge[]
}

export interface PlantUmlExportDto {
  recordId: string
  source: string
}

export interface ConformanceViolation {
  severity: string
  type: string
  className: string
  relatedClassName: string
  message: string
}

export interface ConformanceReportDto {
  projectId: number
  recordId: string
  expectedClassCount: number
  actualClassCount: number
  errorCount: number
  infoCount: number
  violations: ConformanceViolation[]
}

export interface MetricPoint {
  recordId: string
  analyzedAt: string
  projectName: string
  filesAnalyzed: number
  classesFound: number
}

export interface MetricsDto {
  projectId: number
  dataPoints: MetricPoint[]
}

export interface SavedUmlDiagram {
  id: number
  name: string
  projectId: number | null
  plantUmlSource: string
  ownerEmail: string
  createdAt: string
  updatedAt: string
}
