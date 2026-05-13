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

export interface AuthResponse {
  token: string
  user: AuthUser
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
