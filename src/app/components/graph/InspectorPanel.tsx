'use client'
import { useState } from 'react'
import { GraphNodeData, NodeLayer, Blueprint, ArchitectureDecision } from '../../types'

interface InspectorPanelProps {
  node: GraphNodeData | null
  blueprint: Blueprint
  onClose: () => void
  onApplyChoice: (constraint: string) => void
  applying: boolean
}

type TabId = 'overview' | 'purpose' | 'apis' | 'data' | 'dependencies' | 'jobs' | 'tradeoffs'

interface Tab {
  id: TabId
  label: string
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#3dd4a0', POST: '#7aa8f8', PUT: '#f0a860', PATCH: '#f0a860', DELETE: '#f07878',
}

// Define which tabs are relevant per node layer
function getTabsForLayer(layer: NodeLayer): Tab[] {
  switch (layer) {
    case 'user':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'jobs', label: 'Jobs' },
      ]
    case 'auth':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'purpose', label: 'Purpose' },
        { id: 'apis', label: 'APIs' },
        { id: 'dependencies', label: 'Dependencies' },
      ]
    case 'core-service':
    case 'business-service':
    case 'support-service':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'purpose', label: 'Purpose' },
        { id: 'apis', label: 'APIs' },
        { id: 'data', label: 'Data' },
        { id: 'dependencies', label: 'Dependencies' },
      ]
    case 'database':
      return [
        { id: 'data', label: 'Data' },
        { id: 'dependencies', label: 'Dependencies' },
      ]
    case 'integration':
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'purpose', label: 'Purpose' },
        { id: 'dependencies', label: 'Dependencies' },
      ]
    default:
      return [{ id: 'overview', label: 'Overview' }]
  }
}

const LAYER_COLORS: Record<NodeLayer, string> = {
  user: '#7aa8f8',
  auth: '#8898f0',
  'core-service': '#a88cf8',
  'business-service': '#a88cf8',
  'support-service': '#f0a860',
  database: '#3dd4a0',
  integration: '#c080f8',
}

export function InspectorPanel({ node, blueprint, onClose, onApplyChoice, applying }: InspectorPanelProps) {
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null)

  // Find a matching architecture decision for this node, if one exists
  const matchedDecision: ArchitectureDecision | undefined = node
    ? (blueprint.architecture_decisions || []).find(d => {
        const target = d.node_target?.toLowerCase() || ''
        const label = node.label?.toLowerCase() || ''
        if (target === label || target.includes(label) || label.includes(target)) return true
        if (node.layer === 'database' && (target === 'database' || target.includes('database') || target.includes(label))) return true
        if (node.layer === 'auth' && (target === 'auth' || target.includes('auth'))) return true
        return false
      })
    : undefined

  if (node && typeof window !== 'undefined') {
    console.log('[Tradeoffs Debug] Node label:', node.label, '| Layer:', node.layer)
    console.log('[Tradeoffs Debug] Available decisions:', (blueprint.architecture_decisions || []).map(d => d.node_target))
    console.log('[Tradeoffs Debug] Matched:', matchedDecision?.decision_title || 'none')
  }

  const baseTabs = node ? getTabsForLayer(node.layer) : []
  const tabs: Tab[] = matchedDecision
    ? [...baseTabs, { id: 'tradeoffs' as TabId, label: 'Tradeoffs' }]
    : baseTabs

  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id || 'overview')

  // Reset to first tab when node changes
  const currentTab = tabs.find(t => t.id === activeTab) ? activeTab : tabs[0]?.id

  if (!node) return null

  const service = node.service
  const user = node.user
  const integration = node.integration
  const accentColor = LAYER_COLORS[node.layer] || '#7aa8f8'

  const relatedFeatures = (blueprint.feature_breakdown || []).filter(f =>
    service && f.service?.toLowerCase().includes(service.name.toLowerCase().split(' ')[0])
  )

  const relatedEntities = service
    ? (blueprint.domain_entities || []).filter(e =>
        (service.entities || []).some(se =>
          se.toLowerCase().includes(e.name.toLowerCase()) ||
          e.name.toLowerCase().includes(se.toLowerCase())
        )
      )
    : []

  // Jobs relevant to this user
  const userJobs = user
    ? (blueprint.jobs_to_be_done || []).filter((_, i) =>
        i % Math.max(1, Math.floor((blueprint.jobs_to_be_done?.length || 1) / Math.max(1, blueprint.users?.length || 1))) ===
        (blueprint.users || []).findIndex(u => u.name === user.name) % Math.max(1, Math.floor((blueprint.jobs_to_be_done?.length || 1) / Math.max(1, blueprint.users?.length || 1)))
      ).slice(0, 4)
    : []

  return (
    <div className="flex flex-col h-full" style={{ background: '#080816', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
              <p className="text-[10px] uppercase tracking-[0.18em] font-medium"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                {node.layer.replace(/-/g, ' ')}
              </p>
            </div>
            <h3 className="text-[15px] font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {node.label}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-60"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            ✕
          </button>
        </div>

        {/* Tabs — only show relevant ones */}
        <div className="flex gap-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="text-[12px] px-3.5 py-2.5 flex-shrink-0 transition-all font-medium"
              style={{
                color: currentTab === t.id ? accentColor : 'rgba(255,255,255,0.28)',
                borderBottom: currentTab === t.id ? `2px solid ${accentColor}` : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* OVERVIEW */}
        {currentTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl"
              style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {service?.description || user?.description || integration?.purpose || 'No description available.'}
              </p>
            </div>

            {user && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>Role</p>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{user.role}</p>
              </div>
            )}

            {service && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(124,92,240,0.15)', border: '1px solid rgba(124,92,240,0.25)', color: '#a88cf8' }}>
                  {service.group}
                </span>
              </div>
            )}

            {integration && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>Type</p>
                <span className="text-[12px] px-2.5 py-1 rounded-full capitalize"
                  style={{ background: 'rgba(160,80,240,0.12)', border: '1px solid rgba(160,80,240,0.25)', color: '#c080f8' }}>
                  {integration.type}
                </span>
              </div>
            )}

            {relatedFeatures.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>Features</p>
                <div className="space-y-2">
                  {relatedFeatures.slice(0, 3).map((f, i) => (
                    <div key={i} className="p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.feature}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(74,124,240,0.15)', color: '#7aa8f8' }}>{f.badge}</span>
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PURPOSE */}
        {currentTab === 'purpose' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl"
              style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}22` }}>
              <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: accentColor + 'aa' }}>
                Why this exists
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {service
                  ? `${service.name} is responsible for ${service.description} It belongs to the ${service.group} layer of the system.`
                  : integration
                  ? `${integration.name} is integrated to ${integration.purpose}`
                  : blueprint.prd_summary || 'No purpose information available.'}
              </p>
            </div>

            {relatedFeatures.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Product requirements
                </p>
                {relatedFeatures.map((f, i) => (
                  <div key={i} className="mb-2 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[12px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>{f.feature}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JOBS (user nodes only) */}
        {currentTab === 'jobs' && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
              What {user?.name} wants to accomplish
            </p>
            {userJobs.length > 0 ? (
              <div className="space-y-2">
                {userJobs.map((j, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(74,124,240,0.07)', border: '1px solid rgba(74,124,240,0.18)' }}>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(74,124,240,0.2)', color: '#7aa8f8' }}>{i + 1}</span>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{j}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(blueprint.jobs_to_be_done || []).slice(0, 4).map((j, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(74,124,240,0.07)', border: '1px solid rgba(74,124,240,0.18)' }}>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(74,124,240,0.2)', color: '#7aa8f8' }}>{i + 1}</span>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{j}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* APIS */}
        {currentTab === 'apis' && (
          <div>
            {service?.apis?.length ? (
              <div className="space-y-1.5">
                {service.apis.map((api, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[11px] font-bold font-mono w-12 flex-shrink-0"
                      style={{ color: METHOD_COLORS[api.method] || '#7aa8f8' }}>{api.method}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{api.route}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{api.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No APIs defined for this node.</p>
            )}
          </div>
        )}

        {/* DATA */}
        {currentTab === 'data' && (
          <div className="space-y-3">
            {/* Database-specific info */}
            {node.layer === 'database' && blueprint.data_layer && (
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Database', value: blueprint.data_layer.database },
                  { label: 'Cache', value: blueprint.data_layer.cache },
                  { label: 'Storage', value: blueprint.data_layer.storage },
                ].filter(d => d.value).map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(13,184,130,0.08)', border: '1px solid rgba(13,184,130,0.2)' }}>
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{d.label}</span>
                    <span className="text-[13px] font-semibold" style={{ color: '#3dd4a0' }}>{d.value}</span>
                  </div>
                ))}
                <p className="text-[12px] leading-relaxed pt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {blueprint.data_layer.description}
                </p>
              </div>
            )}

            {/* Domain entities */}
            {relatedEntities.length > 0 ? (
              relatedEntities.map((entity, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(13,184,130,0.06)', border: '1px solid rgba(13,184,130,0.18)' }}>
                  <p className="text-[13px] font-semibold mb-1.5" style={{ color: '#3dd4a0' }}>{entity.name}</p>
                  <p className="text-[11px] mb-2.5 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>{entity.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(entity.fields || []).map((field, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 rounded font-mono"
                        style={{ background: 'rgba(13,184,130,0.1)', color: 'rgba(13,184,130,0.8)', border: '1px solid rgba(13,184,130,0.2)' }}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : node.layer === 'database' ? null : (
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No data entities mapped to this service.
              </p>
            )}
          </div>
        )}

        {/* DEPENDENCIES */}
        {currentTab === 'dependencies' && (
          <div className="space-y-2">
            {service?.dependencies?.length ? (
              <>
                <p className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Depends on
                </p>
                {service.dependencies.map((dep, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{dep}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No dependencies defined.</p>
            )}

            {(blueprint.system_boundaries || []).length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  System boundaries
                </p>
                {blueprint.system_boundaries.map((b, i) => (
                  <div key={i} className="mb-2 p-3 rounded-xl text-[11px] leading-snug"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    {b}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRADEOFFS */}
        {currentTab === 'tradeoffs' && matchedDecision && (
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
              {matchedDecision.decision_title}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedAlt(null)}
                className="text-[12px] px-3 py-1.5 rounded-full font-medium transition-all"
                style={{
                  background: selectedAlt === null ? `${accentColor}28` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedAlt === null ? accentColor : 'rgba(255,255,255,0.1)'}`,
                  color: selectedAlt === null ? accentColor : 'rgba(255,255,255,0.45)',
                }}
              >
                ✓ {matchedDecision.chosen.name} (current)
              </button>
              {matchedDecision.alternatives.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAlt(alt.name)}
                  className="text-[12px] px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{
                    background: selectedAlt === alt.name ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selectedAlt === alt.name ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: selectedAlt === alt.name ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {alt.name}
                </button>
              ))}
            </div>

            {selectedAlt === null ? (
              <div className="p-4 rounded-xl" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}28` }}>
                <p className="text-[12px] font-semibold mb-2" style={{ color: accentColor }}>
                  Why {matchedDecision.chosen.name}
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {matchedDecision.chosen.reasoning}
                </p>
              </div>
            ) : (
              (() => {
                const alt = matchedDecision.alternatives.find(a => a.name === selectedAlt)
                if (!alt) return null
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <p className="text-[12px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Why {alt.name} was considered
                      </p>
                      <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {alt.reasoning}
                      </p>
                      <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-[11px] uppercase tracking-widest font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          What would change
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(240,168,96,0.85)' }}>
                          {alt.tradeoff}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onApplyChoice(`Use ${alt.name} instead of ${matchedDecision.chosen.name} for ${matchedDecision.decision_title}.`)}
                      disabled={applying}
                      className="w-full py-3 rounded-xl text-[13px] font-medium transition-all"
                      style={{
                        background: applying ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #4a7cf0, #7c5cf0)',
                        color: applying ? 'rgba(255,255,255,0.4)' : '#fff',
                      }}
                    >
                      {applying ? '⏳ Applying & regenerating...' : `Apply ${alt.name} and regenerate`}
                    </button>
                  </div>
                )
              })()
            )}
          </div>
        )}
      </div>
    </div>
  )
}
