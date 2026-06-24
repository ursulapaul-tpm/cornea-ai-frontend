import dagre from 'dagre'
import { Node, Edge } from '@xyflow/react'
import { Blueprint, GraphNodeData, NodeLayer } from '../../types'

const EDGE_STYLE = {
  stroke: 'rgba(255,255,255,0.15)',
  strokeWidth: 1.5,
}

// Approximate rendered node dimensions — must roughly match the actual
// SystemNode component size so Dagre reserves the correct space.
const NODE_WIDTH = 190
const NODE_HEIGHT = 56

export function buildGraphFromBlueprint(blueprint: Blueprint): { nodes: Node[], edges: Edge[] } {
  const rawNodes: Node[] = []
  const rawEdges: Edge[] = []

  const services = blueprint.services || []
  const users = blueprint.users || []

  // ── USER NODES ────────────────────────────────────────────────────
  const usersToShow = users.slice(0, 7)
  usersToShow.forEach((user, i) => {
    const id = `user-${i}`
    rawNodes.push({
      id,
      type: 'systemNode',
      position: { x: 0, y: 0 }, // overwritten by Dagre below
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
  rawNodes.push({
    id: authId,
    type: 'systemNode',
    position: { x: 0, y: 0 },
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
  usersToShow.forEach((_, i) => {
    rawEdges.push({
      id: `user-${i}-to-auth`,
      source: `user-${i}`,
      target: authId,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // ── SERVICE NODES ─────────────────────────────────────────────────
  const otherServices = services.filter(s => s !== authService)
  const coreServices = otherServices.filter(s => s.group === 'Core Services')
  const businessServices = otherServices.filter(s => s.group === 'Business Services')
  const supportServices = otherServices.filter(s => s.group === 'Support Services')

  const mainServices = [...coreServices, ...businessServices]
  const serviceIdMap: Record<string, string> = {}
  if (authService) serviceIdMap[authService.name] = authId

  mainServices.forEach((svc, i) => {
    const id = `service-${i}`
    serviceIdMap[svc.name] = id
    const layer: NodeLayer = svc.group === 'Core Services' ? 'core-service' : 'business-service'
    rawNodes.push({
      id,
      type: 'systemNode',
      position: { x: 0, y: 0 },
      data: {
        id,
        label: svc.name,
        layer,
        service: svc,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
    rawEdges.push({
      id: `auth-to-${id}`,
      source: authId,
      target: id,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // Support services
  supportServices.forEach((svc, i) => {
    const id = `support-${i}`
    serviceIdMap[svc.name] = id
    rawNodes.push({
      id,
      type: 'systemNode',
      position: { x: 0, y: 0 },
      data: {
        id,
        label: svc.name,
        layer: 'support-service' as NodeLayer,
        service: svc,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
    const parentId = mainServices.length > 0
      ? serviceIdMap[mainServices[Math.floor(i * mainServices.length / Math.max(supportServices.length, 1))]?.name] || `service-0`
      : authId
    rawEdges.push({
      id: `main-to-${id}`,
      source: parentId,
      target: id,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // ── DATABASE NODE ─────────────────────────────────────────────────
  const dbId = 'database'
  const dbLabel = blueprint.data_layer?.database || 'Database'
  rawNodes.push({
    id: dbId,
    type: 'systemNode',
    position: { x: 0, y: 0 },
    data: {
      id: dbId,
      label: dbLabel,
      layer: 'database' as NodeLayer,
      expanded: false,
      children: [],
    } as GraphNodeData,
  })

  mainServices.forEach((_, i) => {
    rawEdges.push({
      id: `service-${i}-to-db`,
      source: `service-${i}`,
      target: dbId,
      style: EDGE_STYLE,
      type: 'smoothstep',
    })
  })

  // ── INTEGRATION NODES ─────────────────────────────────────────────
  const integrations = (blueprint.integrations || []).slice(0, 6)
  integrations.forEach((int, i) => {
    const id = `integration-${i}`
    rawNodes.push({
      id,
      type: 'systemNode',
      position: { x: 0, y: 0 },
      data: {
        id,
        label: int.name,
        layer: 'integration' as NodeLayer,
        integration: int,
        expanded: false,
        children: [],
      } as GraphNodeData,
    })
    const srcIdx = Math.min(i, mainServices.length - 1)
    const srcId = mainServices.length > 0 ? `service-${srcIdx}` : authId
    rawEdges.push({
      id: `service-to-${id}`,
      source: srcId,
      target: id,
      style: { stroke: 'rgba(160,80,240,0.3)', strokeWidth: 1.5, strokeDasharray: '5 3' },
      type: 'smoothstep',
    })
  })

  // ── DEPENDENCY EDGES ───────────────────────────────────────────────
  // Built after layout so we can skip same-rank edges that cause stub artifacts.
  // We compute ranks first via a quick Dagre pass, then add dependency edges
  // only between different ranks.

  // ── DAGRE AUTO-LAYOUT ──────────────────────────────────────────────
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB',      // top to bottom
    align: 'UL',
    nodesep: 50,         // horizontal gap between nodes in the same row
    ranksep: 110,        // vertical gap between rows
    edgesep: 20,
    marginx: 40,
    marginy: 40,
  })
  g.setDefaultEdgeLabel(() => ({}))

  rawNodes.forEach(n => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })
  rawEdges.forEach(e => {
    g.setEdge(e.source, e.target)
  })

  dagre.layout(g)

  // Apply computed positions back onto the nodes
  const nodes: Node[] = rawNodes.map(n => {
    const pos = g.node(n.id)
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  // ── Service dependency edges (added after layout, skip same-rank) ──
  const nodeYMap: Record<string, number> = {}
  nodes.forEach(n => { nodeYMap[n.id] = n.position.y })

  services.forEach(svc => {
    const srcId = serviceIdMap[svc.name]
    if (!srcId) return
    ;(svc.dependencies || []).forEach(dep => {
      const tgtId = serviceIdMap[dep]
      if (!tgtId || tgtId === srcId) return
      if (nodeYMap[srcId] === nodeYMap[tgtId]) return // skip same-row, avoids stub artifacts
      const edgeId = `dep-${srcId}-${tgtId}`
      if (!rawEdges.find(e => e.id === edgeId)) {
        rawEdges.push({
          id: edgeId,
          source: srcId,
          target: tgtId,
          style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 3' },
          type: 'default',
        })
      }
    })
  })

  return { nodes, edges: rawEdges }
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