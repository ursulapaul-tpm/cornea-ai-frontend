'use client'
import { useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Blueprint, GraphNodeData } from '../../types'
import { buildGraphFromBlueprint, highlightNodeEdges } from './buildGraph'
import { nodeTypes } from './nodeTypes'
import { InspectorPanel } from './InspectorPanel'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface SystemCanvasProps {
  blueprint: Blueprint
  idea: string
  onClose: () => void
  onBlueprintUpdate: (updated: Blueprint) => void
}

function Canvas({ blueprint, idea, onClose, onBlueprintUpdate }: SystemCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = buildGraphFromBlueprint(blueprint)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  const applyFocus = useCallback((nodeId: string | null) => {
    setFocusedNodeId(nodeId)
    if (!nodeId) {
      setNodes(nds => nds.map(n => ({ ...n, style: { ...n.style, opacity: 1 } })))
      setEdges(eds => eds.map(e => ({ ...e, style: { ...e.style, opacity: 1 }, animated: false })))
      return
    }
    const { connectedNodeIds, highlightedEdgeIds } = highlightNodeEdges(nodeId, initialEdges)
    setNodes(nds => nds.map(n => ({
      ...n, style: { ...n.style, opacity: connectedNodeIds.has(n.id) ? 1 : 0.12 },
    })))
    setEdges(eds => eds.map(e => ({
      ...e,
      style: {
        ...e.style,
        opacity: highlightedEdgeIds.has(e.id) ? 1 : 0.05,
        stroke: highlightedEdgeIds.has(e.id) ? 'rgba(74,124,240,0.8)' : e.style?.stroke,
        strokeWidth: highlightedEdgeIds.has(e.id) ? 2.5 : e.style?.strokeWidth,
      },
      animated: highlightedEdgeIds.has(e.id),
    })))
  }, [initialEdges, setNodes, setEdges])

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const data = node.data as GraphNodeData
    setSelectedNode(data)
    setInspectorOpen(true)
    applyFocus(node.id)
  }, [applyFocus])

  const onPaneClick = useCallback(() => {
    setInspectorOpen(false)
    setSelectedNode(null)
    applyFocus(null)
  }, [applyFocus])

  const handleApplyChoice = useCallback(async (constraint: string) => {
    setApplying(true)
    setApplyError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/apply-architecture-choice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint, constraint }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || `Server error ${res.status}`)
      }
      const updated: Blueprint = await res.json()
      onBlueprintUpdate(updated)
      // Close inspector since the node structure may have changed
      setInspectorOpen(false)
      setSelectedNode(null)
      applyFocus(null)
    } catch (err: any) {
      setApplyError(err.message.includes('Failed to fetch')
        ? 'Could not reach the backend.'
        : `Could not apply change: ${err.message}`)
    } finally {
      setApplying(false)
    }
  }, [blueprint, onBlueprintUpdate, applyFocus])

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#05050f' }}>
      {/* Nav */}
      <nav className="flex-shrink-0 flex items-center justify-between px-6 py-4 relative z-10"
        style={{ background: 'rgba(5,5,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>View System</span>
        </div>

        <span className="text-[12px] max-w-[340px] truncate hidden md:block"
          style={{ color: 'rgba(255,255,255,0.35)' }}>{idea}</span>

        <div className="flex items-center gap-2">
          {focusedNodeId && (
            <button onClick={() => applyFocus(null)}
              className="text-[12px] px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(74,124,240,0.1)', border: '1px solid rgba(74,124,240,0.25)', color: '#7aa8f8' }}>
              ✕ Clear focus
            </button>
          )}
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}>
            ← Back to results
          </button>
        </div>
      </nav>

      {/* Apply error toast */}
      {applyError && (
        <div className="flex-shrink-0 px-6 py-2.5 text-[12px]"
          style={{ background: 'rgba(226,75,74,0.1)', borderBottom: '1px solid rgba(226,75,74,0.2)', color: 'rgba(240,120,120,0.9)' }}>
          {applyError}
        </div>
      )}

      {/* Canvas + Inspector */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Applying overlay */}
        {applying && (
          <div className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(5,5,15,0.75)', backdropFilter: 'blur(4px)' }}>
            <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl"
              style={{ background: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-6 h-6 rounded-full border-2 border-white/10"
                style={{ borderTopColor: '#7aa8f8', animation: 'spin 0.8s linear infinite' }} />
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Regenerating architecture & docs...
              </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div className="flex-1 relative">
          {!focusedNodeId && !inspectorOpen && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <p className="text-[12px] px-4 py-2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.28)' }}>
                Click a node to inspect · Scroll to zoom · Pan to explore
              </p>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.25}
            maxZoom={2}
            panOnDrag
            panOnScroll={false}
            zoomOnScroll
          >
            <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(255,255,255,0.05)" />
            <Controls style={{ background: 'rgba(10,10,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
            <MiniMap
              style={{ background: 'rgba(10,10,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
              nodeColor={n => {
                const d = n.data as GraphNodeData
                if (d?.layer === 'user') return '#4a7cf0'
                if (d?.layer === 'auth') return '#5468d4'
                if (d?.layer === 'database') return '#0db882'
                if (d?.layer === 'integration') return '#a050f0'
                return '#7c5cf0'
              }}
              maskColor="rgba(5,5,15,0.75)"
            />
          </ReactFlow>
        </div>

        {/* Inspector panel */}
        <div className="flex-shrink-0 transition-all duration-300 overflow-hidden"
          style={{ width: inspectorOpen ? 320 : 0 }}>
          {inspectorOpen && (
            <InspectorPanel
              node={selectedNode}
              blueprint={blueprint}
              onClose={() => { setInspectorOpen(false); setSelectedNode(null); applyFocus(null) }}
              onApplyChoice={handleApplyChoice}
              applying={applying}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function SystemCanvas(props: SystemCanvasProps) {
  return <ReactFlowProvider><Canvas {...props} /></ReactFlowProvider>
}
