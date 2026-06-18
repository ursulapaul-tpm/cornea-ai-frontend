// ── Users Layer ───────────────────────────────────────────────────────────────
export interface User {
  name: string
  role: string
  description: string
}

// ── Features Layer ────────────────────────────────────────────────────────────
export interface Feature {
  name: string
  description: string
  jtbd_index: number
}

// ── Feature Breakdown (from Agent 4) ─────────────────────────────────────────
export interface FeatureBreakdown {
  feature: string
  badge: 'Core' | 'Admin' | 'Premium' | 'System' | string
  description: string
  service: string
}

// ── Workflow Layer ────────────────────────────────────────────────────────────
export interface Workflow {
  name: string
  actor: string
  steps: string[]
}

// ── Domain Entities ───────────────────────────────────────────────────────────
export interface DomainEntity {
  name: string
  description: string
  fields: string[]
}

// ── Architecture Layer ────────────────────────────────────────────────────────
export type ServiceGroup = 'Core Services' | 'Business Services' | 'Support Services'

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string
  route: string
  purpose: string
}

export interface Service {
  name: string
  group: ServiceGroup
  description: string
  apis: ApiEndpoint[]
  dependencies: string[]
  entities: string[]
}

export interface Integration {
  name: string
  purpose: string
  type: 'payment' | 'email' | 'auth' | 'storage' | 'analytics' | 'other' | string
}

export interface DataLayer {
  database: string
  cache: string
  storage: string
  description: string
}

// ── System Flow ───────────────────────────────────────────────────────────────
export interface SystemFlowStep {
  step: number
  from: string
  to: string
  action: string
}

// ── Full Blueprint ────────────────────────────────────────────────────────────
export interface Blueprint {
  // Agent 1 — Discovery
  users: User[]
  business_goals: string[]
  jobs_to_be_done: string[]
  features: Feature[]

  // Agent 2 — Domain
  workflows: Workflow[]
  domain_entities: DomainEntity[]
  relationships: string[]
  business_rules: string[]

  // Agent 3 — Architecture
  services: Service[]
  integrations: Integration[]
  system_boundaries: string[]
  data_layer: DataLayer

  // Agent 4 — Documentation
  prd_summary: string
  system_explanation: string
  feature_breakdown: FeatureBreakdown[]
  system_flow: SystemFlowStep[]
  architecture_diagram_mermaid: string
}

// ── Graph Node Types ──────────────────────────────────────────────────────────
export type NodeLayer =
  | 'user'
  | 'auth'
  | 'core-service'
  | 'business-service'
  | 'support-service'
  | 'database'
  | 'integration'

export interface GraphNodeData {
  id: string
  label: string
  layer: NodeLayer
  // Raw data this node represents
  user?: User
  service?: Service
  entity?: DomainEntity
  integration?: Integration
  // Expand state
  expanded: boolean
  children?: GraphNodeData[]
}

// ── Inspector Panel ───────────────────────────────────────────────────────────
export type InspectorTab = 'overview' | 'prd' | 'apis' | 'data' | 'dependencies'

export interface InspectorState {
  open: boolean
  nodeId: string | null
  tab: InspectorTab
}

// ── App Screens ───────────────────────────────────────────────────────────────
export type AppScreen = 'landing' | 'loading' | 'canvas'