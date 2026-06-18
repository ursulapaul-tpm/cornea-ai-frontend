import { Node, Edge } from '@xyflow/react'
import { Blueprint, GraphNodeData, NodeLayer } from '../../types'

const EDGE_STYLE = {
  stroke: 'rgba(255,255,255,0.15)',
  strokeWidth: 1.5,
}

const ACTIVE_EDGE_STYLE = {
  stroke: 'rgba(74,124,240,0.6)',
  strokeWidth: 2,
}

export function buildGraphFromBlueprint(blueprint: Blueprint): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const services = blueprint.services || []
  const users = blueprint.users || []

  // ── Layer Y positions ─────────────────────────────────────────────
  const Y = {
    users:      80,
    auth:       220,
    core:       380,
    business:   380,
    support:    520,
    database:   660,
    integration: 660,
  }

  // ── USER NODES ────────────────────────────────────────────────────
  const userCount = Math.min(users.length, 6)
  const userSpacing = Math.max(200, Math.min(240, 1400 / (userCount + 1)))
  const userStartX = (1400 - (userCount - 1) * userSpacing) / 2

  users.slice(0, 6).forEach((user, i) => {
    const id = `user-${i}`
    nodes.push({
      id,
      type: 'systemNode',
      position: { x: userStartX + i * userSpacing, y: Y.users },
      data: {
        id,
        label: user.name,
        layer: 'user' as NodeLayer,
        user,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
  })

  // ── AUTH NODE ─────────────────────────────────────────────────────
  const authService = services.find(s =>
    s.name.toLowerCase().includes('auth') ||
    s.name.toLowerCase().includes('identity') ||
    s.name.toLowerCase().includes('user')
  )

  const authId = 'auth-service'
  nodes.push({
    id: authId,
    type: 'systemNode',
    position: { x: 530, y: Y.auth },
    data: {
      id: authId,
      label: authService?.name || 'Auth Service',
      layer: 'auth' as NodeLayer,
      service: authService,
      expanded: false,
      children: [],
    } as GraphNodeData,
  })

  // Connect all users to auth
  users.slice(0, 6).forEach((_, i) => {
    edges.push({
      id: `user-${i}-to-auth`,
      source: `user-${i}`,
      target: authId,
      style: EDGE_STYLE,
      type: 'smoothstep',
      animated: false,
    })
  })

  // ── SERVICE NODES ─────────────────────────────────────────────────
  const otherServices = services.filter(s => s !== authService)
  const coreServices = otherServices.filter(s => s.group === 'Core Services')
  const businessServices = otherServices.filter(s => s.group === 'Business Services')
  const supportServices = otherServices.filter(s => s.group === 'Support Services')

  // Combine core + business in same row, support below
  const mainServices = [...coreServices, ...businessServices]
  const mainCount = mainServices.length
  const mainSpacing = Math.max(210, Math.min(260, 1400 / (mainCount + 1)))
  const mainStartX = (1400 - (mainCount - 1) * mainSpacing) / 2

  const serviceIdMap: Record<string, string> = {}
  if (authService) serviceIdMap[authService.name] = authId

  mainServices.forEach((svc, i) => {
    const id = `service-${i}`
    serviceIdMap[svc.name] = id
    const layer: NodeLayer = svc.group === 'Core Services' ? 'core-service' : 'business-service'
    nodes.push({
      id,
      type: 'systemNode',
      position: { x: mainStartX + i * mainSpacing, y: Y.core },
      data: {
        id,
        label: svc.name,
        layer,
        service: svc,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
    // Connect from auth
    edges.push({
      id: `auth-to-${id}`,
      source: authId,
      target: id,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // Support services
  const suppCount = supportServices.length
  const suppSpacing = Math.max(180, Math.min(220, 1100 / (suppCount + 1)))
  const suppStartX = (1200 - (suppCount - 1) * suppSpacing) / 2

  supportServices.forEach((svc, i) => {
    const id = `support-${i}`
    serviceIdMap[svc.name] = id
    nodes.push({
      id,
      type: 'systemNode',
      position: { x: suppStartX + i * suppSpacing, y: Y.support },
      data: {
        id,
        label: svc.name,
        layer: 'support-service' as NodeLayer,
        service: svc,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
    // Connect from nearest main service
    const parentId = mainServices.length > 0
      ? serviceIdMap[mainServices[Math.floor(i * mainServices.length / Math.max(suppCount, 1))]?.name] || `service-0`
      : authId
    edges.push({
      id: `main-to-${id}`,
      source: parentId,
      target: id,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // Service dependencies
  services.forEach(svc => {
    const srcId = serviceIdMap[svc.name]
    if (!srcId) return
    ;(svc.dependencies || []).forEach(dep => {
      const tgtId = serviceIdMap[dep]
      if (!tgtId || tgtId === srcId) return
      const edgeId = `dep-${srcId}-${tgtId}`
      if (!edges.find(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: srcId,
          target: tgtId,
          style: { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '4 3' },
          type: 'smoothstep',
        })
      }
    })
  })

  // ── DATABASE NODE ─────────────────────────────────────────────────
  const dbId = 'database'
  const dbLabel = blueprint.data_layer?.database || 'Database'
  nodes.push({
    id: dbId,
    type: 'systemNode',
    position: { x: 380, y: Y.database },
    data: {
      id: dbId,
      label: dbLabel,
      layer: 'database' as NodeLayer,
      expanded: false,
      children: [],
    } as GraphNodeData,
  })

  // Connect all main services to database
  mainServices.forEach((_, i) => {
    edges.push({
      id: `service-${i}-to-db`,
      source: `service-${i}`,
      target: dbId,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // ── INTEGRATION NODES ─────────────────────────────────────────────
  const integrations = (blueprint.integrations || []).slice(0, 4)
  integrations.forEach((int, i) => {
    const id = `integration-${i}`
    nodes.push({
      id,
      type: 'systemNode',
      position: { x: 700 + i * 160, y: Y.integration },
      data: {
        id,
        label: int.name,
        layer: 'integration' as NodeLayer,
        integration: int,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
    // Connect from nearest service
    const srcIdx = Math.min(i, mainServices.length - 1)
    const srcId = mainServices.length > 0 ? `service-${srcIdx}` : authId
    edges.push({
      id: `service-to-${id}`,
      source: srcId,
      target: id,
      style: { stroke: 'rgba(160,80,240,0.3)', strokeWidth: 1.5, strokeDasharray: '5 3' },
      type: 'smoothstep',
    })
  })

  return { nodes, edges }
}

export function highlightNodeEdges(
  nodeId: string,
  allEdges: Edge[],
): { connectedNodeIds: Set<string>; highlightedEdgeIds: Set<string> } {
  const connectedNodeIds = new Set<string>([nodeId])
  const highlightedEdgeIds = new Set<string>()

  allEdges.forEach(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
      highlightedEdgeIds.add(edge.id)
    }
  })

  return { connectedNodeIds, highlightedEdgeIds }
}