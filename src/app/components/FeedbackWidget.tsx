'use client'
import { useState } from 'react'
import { getDeviceId } from '../utils/deviceId'
import { track } from '@vercel/analytics'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

const ROLES = [
  'Product Manager / Technical PM',
  'Product Owner',
  'Software Engineer',
  'Solutions Architect',
  'Founder',
  'Other'
]

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [otherRole, setOtherRole] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) {
      setError('Please write a bit more detail.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const deviceId = getDeviceId()
      const finalRole = role === 'Other' ? (otherRole.trim() || 'Other') : role
      const res = await fetch(`${BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          rating,
          message: message.trim(),
          role: finalRole,
          pageContext: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Could not submit feedback.' }))
        throw new Error(err.error || 'Could not submit feedback.')
      }
      setDone(true)
      track('feedback_submitted', { role: finalRole || 'unknown', rating: rating || 0 })
      setTimeout(() => {
        setOpen(false)
        setDone(false)
        setRole(null)
        setOtherRole('')
        setRating(null)
        setMessage('')
      }, 1800)
    } catch (err: any) {
      setError(err.message.includes('Failed to fetch') ? 'Could not reach the server.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all"
        style={{
          background: 'rgba(20,20,36,0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,124,240,0.4)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.95)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
      >
        💬 Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl overflow-hidden"
            style={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            {done ? (
              <div className="px-6 py-10 text-center">
                <div className="text-[32px] mb-3">✓</div>
                <p className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Thank you!
                </p>
                <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Your feedback helps shape what's next.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 className="text-[15px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    Share your feedback
                  </h3>
                  <button onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    ✕
                  </button>
                </div>

                <div className="px-6 py-5">
                  <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    What's your role?
                  </p>
                  <div className="flex flex-col gap-1.5 mb-5">
                    {ROLES.map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className="text-left px-3.5 py-2.5 rounded-xl text-[13px] transition-all"
                        style={{
                          background: role === r ? 'rgba(74,124,240,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${role === r ? 'rgba(74,124,240,0.35)' : 'rgba(255,255,255,0.08)'}`,
                          color: role === r ? '#a8c0f8' : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {role === 'Other' && (
                    <input
                      type="text"
                      autoFocus
                      placeholder="Tell us your role"
                      value={otherRole}
                      onChange={e => setOtherRole(e.target.value)}
                      maxLength={60}
                      className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none mb-5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                    />
                  )}

                  <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    How was your experience?
                  </p>
                  <div className="flex gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className="flex-1 py-2.5 rounded-xl text-[16px] transition-all"
                        style={{
                          background: rating === n ? 'rgba(74,124,240,0.18)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${rating === n ? 'rgba(74,124,240,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {['😞', '😕', '😐', '🙂', '😄'][n - 1]}
                      </button>
                    ))}
                  </div>

                  <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    What worked, what didn't, what would make this better?
                  </p>
                  <textarea
                    className="w-full px-3.5 py-3 rounded-xl text-[13px] outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', minHeight: 100 }}
                    placeholder="Tell me anything — bugs, ideas, what you tried to build..."
                    maxLength={2000}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />

                  {error && (
                    <p className="text-[12px] mt-2" style={{ color: 'rgba(240,120,120,0.9)' }}>{error}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full mt-4 py-3 rounded-xl text-[14px] font-medium transition-all"
                    style={{
                      background: submitting ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #4a7cf0, #7c5cf0)',
                      color: submitting ? 'rgba(255,255,255,0.4)' : '#fff',
                    }}
                  >
                    {submitting ? 'Sending...' : 'Send feedback'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
