'use client'
import { useState, useEffect } from 'react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const SESSION_KEY = 'cornea_admin_session'

interface FeedbackItem {
  id: number
  deviceId: string | null
  rating: number | null
  message: string
  pageContext: string | null
  createdAt: string
}

const RATING_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [filterRating, setFilterRating] = useState<number | null>(null)

  // Check for a stored session password so refresh doesn't force re-login
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      fetchFeedback(stored)
    }
  }, [])

  const fetchFeedback = async (pwd: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Could not authenticate.' }))
        throw new Error(err.error || 'Could not authenticate.')
      }
      const data = await res.json()
      setFeedback(data.feedback || [])
      setAuthenticated(true)
      sessionStorage.setItem(SESSION_KEY, pwd)
    } catch (err: any) {
      setError(err.message.includes('Failed to fetch') ? 'Could not reach the backend.' : err.message)
      sessionStorage.removeItem(SESSION_KEY)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    fetchFeedback(password.trim())
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
    setFeedback([])
    setPassword('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const filtered = filterRating ? feedback.filter(f => f.rating === filterRating) : feedback
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : '—'

  // ── LOGIN SCREEN ──────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh', background: '#05050f' }}>
        <form onSubmit={handleLogin}
          className="w-full max-w-[360px] mx-4 p-6 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
                <circle cx="8" cy="8" r="2.2" fill="white"/>
              </svg>
            </div>
            <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>cornea.ai admin</span>
          </div>

          <input
            type="password"
            autoFocus
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
          />

          {error && (
            <p className="text-[12px] mb-3" style={{ color: 'rgba(240,120,120,0.9)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-[14px] font-medium transition-all"
            style={{
              background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #4a7cf0, #7c5cf0)',
              color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
            }}
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    )
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#05050f' }}>
      <nav className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Feedback Dashboard</span>
        </div>
        <button onClick={handleLogout}
          className="text-[12px] px-3.5 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          Log out
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[28px] font-semibold mb-0.5" style={{ color: '#7aa8f8' }}>{feedback.length}</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Total responses</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[28px] font-semibold mb-0.5" style={{ color: '#3dd4a0' }}>{avgRating}</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Average rating</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[28px] font-semibold mb-0.5" style={{ color: '#f0a860' }}>
              {new Set(feedback.map(f => f.deviceId)).size}
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Unique devices</p>
          </div>
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Filter:</span>
          <button onClick={() => setFilterRating(null)}
            className="text-[12px] px-3 py-1.5 rounded-full transition-all"
            style={{
              background: filterRating === null ? 'rgba(74,124,240,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterRating === null ? 'rgba(74,124,240,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: filterRating === null ? '#7aa8f8' : 'rgba(255,255,255,0.4)',
            }}>
            All
          </button>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setFilterRating(n)}
              className="text-[14px] px-2.5 py-1.5 rounded-full transition-all"
              style={{
                background: filterRating === n ? 'rgba(74,124,240,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filterRating === n ? 'rgba(74,124,240,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {RATING_EMOJI[n]}
            </button>
          ))}
        </div>

        {/* Feedback list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No feedback yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(f => (
              <div key={f.id} className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {f.rating && <span className="text-[18px]">{RATING_EMOJI[f.rating]}</span>}
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDate(f.createdAt)}</span>
                  </div>
                  {f.pageContext && (
                    <span className="text-[10px] px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: 'rgba(124,92,240,0.1)', color: '#a88cf8' }}>
                      {f.pageContext}
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {f.message}
                </p>
                {f.deviceId && (
                  <p className="text-[10px] mt-2 font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    {f.deviceId.slice(0, 8)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
