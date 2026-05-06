export interface Project {
  id: string
  name: string
  description: string
  language: 'Spring Boot' | 'Symfony' | 'Laravel' | 'Node.js'
  status: 'analyzed' | 'pending' | 'error' | 'new'
  createdAt: string
  updatedAt: string
  score: number
  diagramsCount: number
  violationsCount: number
  owner: string
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

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'architect' | 'developer'
  plan: 'free' | 'pro' | 'enterprise'
  avatar: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'architect' | 'developer'
  plan: 'free' | 'pro' | 'enterprise'
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
