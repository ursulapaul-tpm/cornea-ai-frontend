'use client'
import { useEffect, useState } from 'react'
import { HistoryItem, Blueprint } from '../types'
import { getDeviceId } from '../utils/deviceId'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface HistoryProps {
  onOpenBlueprint: (idea: string, blueprint: Blueprint) => void
  onBack: () => void
}

export function History({ onOpenBlueprint, onBack }: HistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const deviceId = getDeviceId()
    fetch(`${BACKEND_URL}/api/history/${deviceId}`)
      .then(res => {
        if (!res.ok) throw new Error('Could not load history.')
        return res.json()
      })
      .then(data => setItems(data.history || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const deviceId = getDeviceId()
      const res = await fetch(`${BACKEND_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      if (!res.ok) throw new Error('Could not delete this entry.')
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'Z') // treat as UTC
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#05050f' }}>
      {/* Nav */}
      <nav className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(5,5,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onBack} className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>cornea.ai</span>
        </button>
        <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>My Blueprints</span>
        <button onClick={onBack}
          className="text-[12px] px-3.5 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          ← Back
        </button>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 rounded-full border-2 border-white/10"
                style={{ borderTopColor: '#7aa8f8', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl text-[13px] mb-4"
              style={{ background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)', color: 'rgba(240,120,120,0.9)' }}>
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[16px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                No blueprints saved yet
              </p>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Every blueprint you generate will appear here automatically.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id}
                  className="group rounded-2xl p-5 transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => onOpenBlueprint(item.idea, item.blueprint)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,124,240,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(74,124,240,0.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium leading-relaxed mb-2"
                        style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {item.idea.length > 160 ? item.idea.slice(0, 160) + '...' : item.idea}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {formatDate(item.createdAt)}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(74,124,240,0.1)', color: '#7aa8f8' }}>
                          {item.blueprint.users?.length || 0} users
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(124,92,240,0.1)', color: '#a88cf8' }}>
                          {item.blueprint.services?.length || 0} services
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                      disabled={deletingId === item.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-[12px] px-2.5 py-1.5 rounded-lg"
                      style={{ background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)', color: 'rgba(240,120,120,0.8)' }}
                    >
                      {deletingId === item.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
