'use client'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { GraphNodeData, NodeLayer } from '../../types'

const LAYER_STYLES: Record<NodeLayer, { bg: string; border: string; color: string; dot: string }> = {
  user:        { bg: 'rgba(74,124,240,0.1)',  border: 'rgba(74,124,240,0.35)',  color: '#7aa8f8', dot: '#4a7cf0' },
  auth:        { bg: 'rgba(84,104,212,0.1)',  border: 'rgba(84,104,212,0.35)',  color: '#8898f0', dot: '#5468d4' },
  'core-service':     { bg: 'rgba(124,92,240,0.1)',  border: 'rgba(124,92,240,0.35)',  color: '#a88cf8', dot: '#7c5cf0' },
  'business-service': { bg: 'rgba(124,92,240,0.08)', border: 'rgba(124,92,240,0.28)',  color: '#a88cf8', dot: '#7c5cf0' },
  'support-service':  { bg: 'rgba(224,128,32,0.1)',  border: 'rgba(224,128,32,0.35)',  color: '#f0a860', dot: '#e08020' },
  database:    { bg: 'rgba(13,184,130,0.1)',  border: 'rgba(13,184,130,0.35)',  color: '#3dd4a0', dot: '#0db882' },
  integration: { bg: 'rgba(160,80,240,0.1)',  border: 'rgba(160,80,240,0.3)',   color: '#c080f8', dot: '#a050f0' },
}

const LAYER_ICONS: Record<NodeLayer, string> = {
  user: '👤',
  auth: '🔐',
  'core-service': '⚙️',
  'business-service': '📦',
  'support-service': '🔧',
  database: '🗄️',
  integration: '🔗',
}

export function SystemNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GraphNodeData
  const style = LAYER_STYLES[nodeData.layer] || LAYER_STYLES['core-service']
  const icon = LAYER_ICONS[nodeData.layer] || '◆'

  return (
    <div
      className="transition-all duration-200"
      style={{
        background: selected ? style.bg.replace('0.1', '0.18') : style.bg,
        border: `1px solid ${selected ? style.dot : style.border}`,
        borderRadius: 14,
        padding: '10px 14px',
        minWidth: 140,
        maxWidth: 180,
        boxShadow: selected
          ? `0 0 0 3px ${style.dot}30, 0 8px 24px rgba(0,0,0,0.35)`
          : '0 2px 12px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: style.dot, border: 'none', width: 6, height: 6 }} />

      <div className="flex items-center gap-2">
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold truncate" style={{ color: style.color }}>
            {nodeData.label}
          </p>
          {nodeData.layer !== 'user' && (
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {nodeData.layer.replace('-', ' ')}
            </p>
          )}
        </div>
        {nodeData.expanded && (
          <span style={{ color: style.dot, fontSize: 10 }}>▾</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: style.dot, border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

export function GroupLabelNode({ data }: NodeProps) {
  return (
    <div style={{ pointerEvents: 'none' }}>
      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        {(data as any).label}
      </p>
    </div>
  )
}

export const nodeTypes = {
  systemNode: SystemNode,
  groupLabel: GroupLabelNode,
}
