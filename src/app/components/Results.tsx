'use client'
import { useState, useCallback } from 'react'
import { Blueprint } from '../types'
import { generatePRDPdf } from '../utils/generatePDF'

interface ResultsProps {
  blueprint: Blueprint
  idea: string
  onNewIdea: () => void
  onViewGraph: () => void
  onRegenerate: (newIdea: string) => void
}

const TABS = ['Overview', 'Users', 'Features', 'Architecture', 'Specs']

const METHOD_COLORS: Record<string, string> = {
  GET: '#3dd4a0', POST: '#7aa8f8', PUT: '#f0a860', PATCH: '#f0a860', DELETE: '#f07878',
}
const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  Core:    { bg: 'rgba(74,124,240,0.15)',  color: '#7aa8f8' },
  Admin:   { bg: 'rgba(224,128,32,0.15)',  color: '#f0a860' },
  Premium: { bg: 'rgba(13,184,130,0.15)',  color: '#3dd4a0' },
  System:  { bg: 'rgba(124,92,240,0.15)',  color: '#a88cf8' },
}

// ── Inline editable text ──────────────────────────────────────────
function EditableText({ value, onChange, multiline = false, className = '' }: {
  value: string; onChange: (v: string) => void; multiline?: boolean; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const commit = () => { onChange(draft); setEditing(false) }
  if (editing) {
    return multiline
      ? <textarea autoFocus className={`w-full bg-transparent rounded-lg px-3 py-2 outline-none resize-none ${className}`}
          style={{ border: '1px solid rgba(74,124,240,0.5)', color: 'rgba(255,255,255,0.85)', minHeight: 80 }}
          value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => e.key === 'Escape' && setEditing(false)} />
      : <input autoFocus className={`w-full bg-transparent rounded-lg px-3 py-2 outline-none ${className}`}
          style={{ border: '1px solid rgba(74,124,240,0.5)', color: 'rgba(255,255,255,0.85)' }}
          value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }} />
  }
  return (
    <span className={`cursor-pointer group relative ${className}`} onClick={() => { setDraft(value); setEditing(true) }} title="Click to edit">
      {value}
      <span className="ml-1 opacity-0 group-hover:opacity-60 transition-opacity text-[10px]" style={{ color: '#7aa8f8' }}>✎</span>
    </span>
  )
}

// ── Editable list ─────────────────────────────────────────────────
function EditableList({ items, onChange, color = '#7aa8f8', bg = 'rgba(74,124,240,0.08)', border = 'rgba(74,124,240,0.2)' }: {
  items: string[]; onChange: (v: string[]) => void; color?: string; bg?: string; border?: string
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const add = () => { if (draft.trim()) onChange([...items, draft.trim()]); setDraft(''); setAdding(false) }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const edit = (i: number, val: string) => onChange(items.map((item, idx) => idx === i ? val : item))

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="group flex items-start gap-2 p-2.5 rounded-xl"
          style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
            style={{ background: `${color}22`, color }}>{String(i+1).padStart(2,'0')}</span>
          <EditableText value={item} onChange={v => edit(i, v)} className="flex-1 text-[13px] leading-relaxed" />
          <button onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-60 hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity text-[11px]"
            style={{ color: '#f07878' }}>✕</button>
        </div>
      ))}
      {adding
        ? <input autoFocus className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
            style={{ background: bg, border: `1px dashed ${color}`, color: 'rgba(255,255,255,0.75)' }}
            placeholder="Type and press Enter" value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false) }}
            onBlur={add} />
        : <button onClick={() => setAdding(true)}
            className="w-full text-left text-[12px] px-3 py-2 rounded-xl transition-all"
            style={{ border: `1px dashed ${color}55`, color: `${color}88` }}>
            + Add item
          </button>
      }
    </div>
  )
}

function SLabel({ children }: { children: string }) {
  return <p className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-3 mt-6 first:mt-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{children}</p>
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: accent ? `${accent}08` : 'rgba(255,255,255,0.03)', border: `1px solid ${accent ? `${accent}20` : 'rgba(255,255,255,0.07)'}` }}>
      {children}
    </div>
  )
}

export function Results({ blueprint: initial, idea, onNewIdea, onViewGraph, onRegenerate }: ResultsProps) {
  const [bp, setBp] = useState<Blueprint>(initial)
  const [activeTab, setActiveTab] = useState(0)
  const [showRegenerate, setShowRegenerate] = useState(false)
  const [extraContext, setExtraContext] = useState('')
  const [prdGenerating, setPrdGenerating] = useState(false)

  const update = useCallback((field: keyof Blueprint, value: any) => setBp(prev => ({ ...prev, [field]: value })), [])

  const updateFeature = useCallback((i: number, field: string, value: string) =>
    setBp(prev => ({ ...prev, feature_breakdown: prev.feature_breakdown.map((f, idx) => idx === i ? { ...f, [field]: value } : f) })), [])

  const updateUser = useCallback((i: number, field: string, value: string) =>
    setBp(prev => ({ ...prev, users: prev.users.map((u, idx) => idx === i ? { ...u, [field]: value } : u) })), [])

  const addUser = useCallback(() =>
    setBp(prev => ({ ...prev, users: [...prev.users, { name: 'New User', role: 'Role', description: 'Description' }] })), [])

  const removeUser = useCallback((i: number) =>
    setBp(prev => ({ ...prev, users: prev.users.filter((_, idx) => idx !== i) })), [])

  const handleExportMarkdown = () => {
    const lines = [
      `# ${idea}`, '', '## Users', ...(bp.users||[]).map(u => `- **${u.name}** (${u.role}): ${u.description}`), '',
      '## Business Goals', ...(bp.business_goals||[]).map(g => `- ${g}`), '',
      '## Jobs To Be Done', ...(bp.jobs_to_be_done||[]).map((j,i) => `${i+1}. ${j}`), '',
      '## Features', ...(bp.feature_breakdown||[]).map(f => `### ${f.feature}\n${f.description}`), '',
      '## Architecture', ...(bp.services||[]).map(s => `### ${s.name}\n${s.description}\n${(s.apis||[]).map(a=>`- ${a.method} ${a.route}`).join('\n')}`), '',
      '## PRD Summary', bp.prd_summary||'', '', '## System Explanation', bp.system_explanation||'',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'cornea-blueprint.md'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    setPrdGenerating(true)
    try { await generatePRDPdf(bp, idea) } finally { setPrdGenerating(false) }
  }

  const handleGeneratePRD = async () => {
    setPrdGenerating(true)
    try { await generatePRDPdf(bp, idea) } finally { setPrdGenerating(false) }
  }

  const handleRegenerate = () => {
    const newIdea = extraContext.trim() ? `${idea}. Additional context: ${extraContext.trim()}` : idea
    onRegenerate(newIdea)
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#05050f', overflow: 'hidden' }}>

      {/* Nav */}
      <nav className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(5,5,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onNewIdea} className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>cornea.ai</span>
        </button>

        <span className="text-[12px] px-3 py-1 rounded-full hidden md:block max-w-[340px] truncate"
          style={{ background: 'rgba(74,124,240,0.08)', border: '1px solid rgba(74,124,240,0.2)', color: 'rgba(255,255,255,0.4)' }}>
          {idea}
        </span>

        <div className="flex items-center gap-2">
          <button onClick={onViewGraph}
            className="flex items-center gap-2 text-[13px] px-4 py-2 rounded-xl font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)', color: '#fff' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="3" r="2" stroke="white" strokeWidth="1.3"/>
              <circle cx="13" cy="3" r="2" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="13" r="2" stroke="white" strokeWidth="1.3"/>
              <line x1="3" y1="5" x2="8" y2="11" stroke="white" strokeWidth="1.3"/>
              <line x1="13" y1="5" x2="8" y2="11" stroke="white" strokeWidth="1.3"/>
            </svg>
            View Graph
          </button>

          <button onClick={() => setShowRegenerate(true)}
            className="text-[13px] px-4 py-2 rounded-xl font-medium transition-all"
            style={{ background: 'rgba(124,92,240,0.1)', border: '1px solid rgba(124,92,240,0.25)', color: '#a88cf8' }}>
            ↺ Regenerate
          </button>

          <div className="relative group">
            <button className="text-[12px] px-3 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              Export ▾
            </button>
            <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-50"
              style={{ background: '#0f0f20', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 140 }}>
              <button onClick={handleExportMarkdown}
                className="w-full text-left px-4 py-2.5 text-[13px] transition-all hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.6)' }}>📄 Markdown</button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <button onClick={handleExportPDF} disabled={prdGenerating}
                className="w-full text-left px-4 py-2.5 text-[13px] transition-all hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.6)' }}>📑 PDF</button>
            </div>
          </div>

          <button onClick={onNewIdea} className="text-[12px] px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
            New idea
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center px-6 gap-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,5,15,0.8)' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className="text-[13px] px-5 py-3.5 transition-all"
            style={{ color: activeTab === i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', borderBottom: activeTab === i ? '2px solid #4a7cf0' : '2px solid transparent', fontWeight: activeTab === i ? 500 : 400 }}>
            {tab}
          </button>
        ))}
        <div className="ml-auto pr-2" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6" onScroll={e => e.currentTarget.scrollTop = e.currentTarget.scrollTop}>

        {/* OVERVIEW */}
        {activeTab === 0 && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1"
              style={{ background: 'rgba(74,124,240,0.06)', border: '1px solid rgba(74,124,240,0.15)' }}>
              <span style={{ color: '#7aa8f8', fontSize: 13 }}>✎</span>
              <span className="text-[12px]" style={{ color: 'rgba(74,124,240,0.8)' }}>
                Click any text field to edit it inline
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { num: bp.users?.length || 0, label: 'User types', color: '#7aa8f8' },
                { num: bp.feature_breakdown?.length || 0, label: 'Features', color: '#a88cf8' },
                { num: bp.services?.length || 0, label: 'Services', color: '#3dd4a0' },
                { num: bp.jobs_to_be_done?.length || 0, label: 'Jobs to be done', color: '#f0a860' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[28px] font-semibold mb-0.5" style={{ color: s.color }}>{s.num}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <Card accent="#4a7cf0">
              <SLabel>Product summary</SLabel>
              <EditableText value={bp.prd_summary || ''} onChange={v => update('prd_summary', v)} multiline
                className="text-[14px] leading-relaxed" />
            </Card>

            <div>
              <SLabel>Business goals</SLabel>
              <EditableList items={bp.business_goals || []} onChange={v => update('business_goals', v)}
                color="#3dd4a0" bg="rgba(13,184,130,0.06)" border="rgba(13,184,130,0.15)" />
            </div>

            <div>
              <SLabel>Jobs to be done</SLabel>
              <EditableList items={bp.jobs_to_be_done || []} onChange={v => update('jobs_to_be_done', v)}
                color="#f0a860" bg="rgba(224,128,32,0.06)" border="rgba(224,128,32,0.15)" />
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 1 && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
              style={{ background: 'rgba(74,124,240,0.06)', border: '1px solid rgba(74,124,240,0.15)' }}>
              <span style={{ color: '#7aa8f8', fontSize: 13 }}>✎</span>
              <span className="text-[12px]" style={{ color: 'rgba(74,124,240,0.8)' }}>
                Click any name, role, or description to edit · Add or remove users below
              </span>
            </div>
            <SLabel>User roles</SLabel>
            <div className="flex flex-wrap gap-2 mb-6">
              {(bp.users||[]).map((u, i) => (
                <span key={i} className="text-[12px] px-3 py-1 rounded-full"
                  style={{ background: 'rgba(74,124,240,0.09)', border: '1px solid rgba(74,124,240,0.2)', color: '#7aa8f8' }}>
                  {u.role}
                </span>
              ))}
            </div>

            <SLabel>User types ({bp.users?.length || 0})</SLabel>
            <div className="space-y-3">
              {(bp.users||[]).map((u, i) => (
                <div key={i} className="group p-4 rounded-2xl"
                  style={{ background: 'rgba(74,124,240,0.07)', border: '1px solid rgba(74,124,240,0.18)' }}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] flex-shrink-0"
                      style={{ background: 'rgba(74,124,240,0.2)' }}>👤</div>
                    <div className="flex-1 min-w-0">
                      <EditableText value={u.name} onChange={v => updateUser(i, 'name', v)}
                        className="text-[14px] font-semibold block w-full" />
                      <EditableText value={u.role} onChange={v => updateUser(i, 'role', v)}
                        className="text-[11px] mt-0.5 block" />
                    </div>
                    <button onClick={() => removeUser(i)}
                      className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 text-[11px] mt-1"
                      style={{ color: '#f07878' }}>✕ Remove</button>
                  </div>
                  <EditableText value={u.description} onChange={v => updateUser(i, 'description', v)} multiline
                    className="text-[12px] leading-relaxed block w-full" />
                </div>
              ))}
              <button onClick={addUser}
                className="w-full py-3 rounded-2xl text-[13px] transition-all"
                style={{ border: '1px dashed rgba(74,124,240,0.3)', color: 'rgba(74,124,240,0.6)' }}>
                + Add user type
              </button>
            </div>
          </div>
        )}

        {/* FEATURES */}
        {activeTab === 2 && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
              style={{ background: 'rgba(74,124,240,0.06)', border: '1px solid rgba(74,124,240,0.15)' }}>
              <span style={{ color: '#7aa8f8', fontSize: 13 }}>✎</span>
              <span className="text-[12px]" style={{ color: 'rgba(74,124,240,0.8)' }}>
                Click any feature name or description to edit it inline
              </span>
            </div>
            <SLabel>Feature breakdown ({bp.feature_breakdown?.length || 0} features)</SLabel>
            <div className="space-y-3">
              {(bp.feature_breakdown||[]).map((f, i) => {
                const bc = BADGE_COLORS[f.badge] || BADGE_COLORS.Core
                return (
                  <div key={i} className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold"
                        style={{ background: bc.bg, color: bc.color }}>{i+1}</div>
                      <div className="flex-1">
                        <EditableText value={f.feature} onChange={v => updateFeature(i, 'feature', v)}
                          className="text-[14px] font-medium block" />
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: bc.bg, color: bc.color }}>{f.badge}</span>
                    </div>
                    <div className="px-5 py-3.5 flex items-center justify-between gap-3">
                      <EditableText value={f.description} onChange={v => updateFeature(i, 'description', v)} multiline
                        className="text-[13px] leading-relaxed flex-1 block" />
                      <span className="text-[11px] px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>{f.service}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ARCHITECTURE */}
        {activeTab === 3 && (
          <div className="max-w-3xl mx-auto">
            <SLabel>System services</SLabel>
            <div className="space-y-3 mb-6">
              {(bp.services||[]).map((svc, i) => (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(124,92,240,0.06)', border: '1px solid rgba(124,92,240,0.18)' }}>
                  <div className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: '1px solid rgba(124,92,240,0.12)' }}>
                    <span className="text-[13px] font-semibold flex-1" style={{ color: '#a88cf8' }}>{svc.name}</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(124,92,240,0.15)', color: '#a88cf8', border: '1px solid rgba(124,92,240,0.25)' }}>
                      {svc.group}
                    </span>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{svc.description}</p>
                    <div className="space-y-1.5">
                      {(svc.apis||[]).map((api, j) => (
                        <div key={j} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-[11px] font-bold font-mono w-12 flex-shrink-0"
                            style={{ color: METHOD_COLORS[api.method] || '#7aa8f8' }}>{api.method}</span>
                          <span className="text-[11px] font-mono flex-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{api.route}</span>
                          <span className="text-[10px] hidden md:block" style={{ color: 'rgba(255,255,255,0.25)' }}>{api.purpose}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SLabel>External integrations</SLabel>
            <div className="flex flex-wrap gap-2 mb-6">
              {(bp.integrations||[]).map((int, i) => (
                <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                  style={{ background: 'rgba(160,80,240,0.08)', border: '1px solid rgba(160,80,240,0.2)' }}>
                  <span style={{ color: '#c080f8', fontSize: 12 }}>🔗</span>
                  <span className="text-[12px]" style={{ color: '#c080f8' }}>{int.name}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{int.purpose}</span>
                </div>
              ))}
            </div>

            {bp.data_layer && (
              <>
                <SLabel>Data layer</SLabel>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Database', value: bp.data_layer.database },
                    { label: 'Cache', value: bp.data_layer.cache },
                    { label: 'Storage', value: bp.data_layer.storage },
                  ].filter(d => d.value).map((d, i) => (
                    <div key={i} className="p-3.5 rounded-xl text-center"
                      style={{ background: 'rgba(13,184,130,0.07)', border: '1px solid rgba(13,184,130,0.18)' }}>
                      <p className="text-[15px] font-semibold mb-0.5" style={{ color: '#3dd4a0' }}>{d.value}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* SPECS */}
        {activeTab === 4 && (
          <div className="max-w-3xl mx-auto space-y-5">
            <Card>
              <SLabel>System explanation</SLabel>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{bp.system_explanation}</p>
            </Card>

            {(bp.system_flow||[]).length > 0 && (
              <div>
                <SLabel>System flow</SLabel>
                <div className="space-y-2">
                  {bp.system_flow.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                          style={{ background: 'rgba(74,124,240,0.2)', color: '#7aa8f8' }}>{step.step}</div>
                        {i < bp.system_flow.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(74,124,240,0.15)', minHeight: 16 }} />}
                      </div>
                      <div className="pb-3">
                        <p className="text-[12px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{step.from} → {step.to}</p>
                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(bp.business_rules||[]).length > 0 && (
              <div>
                <SLabel>Business rules</SLabel>
                <div className="space-y-2">
                  {bp.business_rules.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                      style={{ background: 'rgba(224,128,32,0.06)', border: '1px solid rgba(224,128,32,0.15)' }}>
                      <span style={{ color: '#f0a860', fontSize: 12, marginTop: 1 }}>→</span>
                      <p className="text-[12px] leading-snug" style={{ color: 'rgba(240,168,96,0.8)' }}>{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Regenerate modal */}
      {showRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-[480px] mx-4 rounded-2xl overflow-hidden"
            style={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h3 className="text-[16px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Regenerate blueprint</h3>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Add more context and re-run all 4 agents</p>
              </div>
              <button onClick={() => setShowRegenerate(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>✕</button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4 px-3 py-2.5 rounded-xl text-[13px]"
                style={{ background: 'rgba(74,124,240,0.08)', border: '1px solid rgba(74,124,240,0.2)', color: 'rgba(255,255,255,0.5)' }}>
                💡 {idea}
              </div>
              <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Add more context, constraints, or direction (optional):
              </p>
              <textarea
                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', minHeight: 100 }}
                placeholder="e.g. Focus more on the admin dashboard, add a mobile app layer, include payment processing..."
                value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowRegenerate(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                  Cancel
                </button>
                <button onClick={handleRegenerate}
                  className="flex-1 py-3 rounded-xl text-[14px] font-medium transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c5cf0, #4a7cf0)', color: '#fff' }}>
                  ↺ Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
