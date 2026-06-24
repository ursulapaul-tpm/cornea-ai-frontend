'use client'
import { useEffect, useRef } from 'react'

interface LoadingProps {
  idea: string
  activeAgent: number
  error: string | null
  onLogoClick?: () => void
  onCancel?: () => void
  highlights?: string[]
}

const AGENTS = [
  {
    name: 'Discovery',
    desc: 'Users, problems & business goals extracted',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.6"/>
        <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="17" cy="9" r="2.3" stroke={color} strokeWidth="1.6"/>
        <path d="M14.5 19c0-2.2 1.6-4 3.7-4.3" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'Workflows',
    desc: 'Journeys, entities & domain rules mapped',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="6" r="2.3" stroke={color} strokeWidth="1.6"/>
        <circle cx="6" cy="18" r="2.3" stroke={color} strokeWidth="1.6"/>
        <circle cx="18" cy="12" r="2.3" stroke={color} strokeWidth="1.6"/>
        <path d="M8 7l8 4M8 17l8-4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'Architecture',
    desc: 'Modules, APIs & system design defined',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="5" rx="1.3" stroke={color} strokeWidth="1.6"/>
        <rect x="4" y="11" width="16" height="5" rx="1.3" stroke={color} strokeWidth="1.6"/>
        <circle cx="7.5" cy="6.5" r="0.8" fill={color}/>
        <circle cx="7.5" cy="13.5" r="0.8" fill={color}/>
        <path d="M4 19h16" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'Documentation',
    desc: 'PRD, features & architecture diagram',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke={color} strokeWidth="1.6"/>
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'Reasoning',
    desc: 'Tradeoffs & architecture decisions explained',
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.3.2.5.6.5 1v1.1h6v-1.1c0-.4.2-.8.5-1A6 6 0 0 0 12 3z" stroke={color} strokeWidth="1.6"/>
        <path d="M9.5 19h5M10.3 21h3.4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const MESSAGES = [
  'Understanding your product...',
  'Mapping users and workflows...',
  'Designing system architecture...',
  'Writing documentation & PRD...',
  'Weighing architecture tradeoffs...',
]

function WaveBars({ color }: { color: string }) {
  const heights = [5, 11, 15, 9, 6, 13, 5]
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
      {heights.map((h, j) => (
        <div key={j} style={{
          width: 2.5, height: h, borderRadius: 3,
          background: `linear-gradient(to top, ${color}, ${color}cc)`,
          animation: `wv 0.65s ease-in-out ${j * 0.09}s infinite`,
        }} />
      ))}
    </div>
  )
}

function SpiralCanvas({ activeAgent }: { activeAgent: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(activeAgent)
  useEffect(() => { activeRef.current = activeAgent }, [activeAgent])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let t = 0
    let animFrame: number

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2
      const active = activeRef.current
      const speedMult = 1 + (active < 0 ? 0 : active) * 0.25
      const rings = [
        { r: Math.min(W, H) * 0.42, lines: 64, speed: 0.0008 * speedMult, color: 'rgba(74,124,240,', baseOp: 0.08 },
        { r: Math.min(W, H) * 0.30, lines: 48, speed: -0.0012 * speedMult, color: 'rgba(124,92,240,', baseOp: 0.07 },
        { r: Math.min(W, H) * 0.18, lines: 32, speed: 0.0016 * speedMult, color: 'rgba(13,184,130,', baseOp: 0.07 },
      ]
      rings.forEach(ring => {
        const angle = t * ring.speed * 1000
        for (let i = 0; i < ring.lines; i++) {
          const a = (i / ring.lines) * Math.PI * 2 + angle
          const x = cx + Math.cos(a) * ring.r, y = cy + Math.sin(a) * ring.r
          const ix = cx + Math.cos(a) * ring.r * 0.1, iy = cy + Math.sin(a) * ring.r * 0.1
          const op = ring.baseOp + 0.04 * Math.sin(a * 4 + t * 0.002)
          ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(x, y)
          ctx.strokeStyle = `${ring.color}${Math.max(op, 0.02)})`; ctx.lineWidth = 0.5; ctx.stroke()
        }
      })
      t++
      animFrame = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.9 }} />
}

export function Loading({ idea, activeAgent, error, onLogoClick, onCancel, highlights = [] }: LoadingProps) {
  const progress = activeAgent >= 0 ? Math.min((activeAgent / AGENTS.length) * 100, 100) : 0
  const label = activeAgent >= 0 && activeAgent < AGENTS.length
    ? MESSAGES[activeAgent]
    : activeAgent >= AGENTS.length ? 'Blueprint ready!' : 'Initializing...'

  return (
    <div className="flex flex-col relative" style={{ height: '100vh', background: '#05050f', overflow: 'hidden' }}>
      <SpiralCanvas activeAgent={activeAgent} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 65% at 50% 50%, rgba(5,5,15,0.9) 0%, rgba(5,5,15,0.6) 55%, rgba(5,5,15,0.15) 100%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex-shrink-0 flex items-center justify-between px-8 py-5">
        <button onClick={onLogoClick} className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>cornea.ai</span>
        </button>
        <div className="flex items-center gap-6">
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Docs</span>
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>GitHub</span>
        </div>
      </nav>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8" style={{ overflow: 'hidden' }}>
        <div className="w-full max-w-[640px]">

          <div className="text-center mb-7">
            <p className="text-[11px] uppercase tracking-[0.22em] mb-3 font-medium" style={{ color: 'rgba(74,124,240,0.65)' }}>
              cornea is thinking in systems
            </p>
            <h2 className="text-[22px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>{label}</h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px]"
              style={{ background: 'rgba(74,124,240,0.08)', border: '1px solid rgba(74,124,240,0.18)', color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ color: 'rgba(74,124,240,0.75)' }}>💡</span>
              <span className="truncate max-w-[420px]">{idea}</span>
            </div>
          </div>

          {/* Card grid — 3 + 2 */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {AGENTS.slice(0, 3).map((agent, i) => {
              const state = i < activeAgent ? 'done' : i === activeAgent ? 'active' : 'waiting'
              const color = state === 'active' ? '#7aa8f8' : state === 'done' ? '#3dd4a0' : 'rgba(255,255,255,0.3)'
              return (
                <div key={i}
                  className="rounded-2xl p-4 transition-all duration-500"
                  style={{
                    background: state === 'active' ? 'rgba(74,124,240,0.08)' : state === 'done' ? 'rgba(13,184,130,0.05)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${state === 'active' ? 'rgba(74,124,240,0.3)' : state === 'done' ? 'rgba(13,184,130,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    opacity: state === 'waiting' ? 0.45 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    {agent.icon(color)}
                    {state === 'active' && <WaveBars color="#4a7cf0" />}
                    {state === 'done' && <span style={{ color: '#3dd4a0', fontSize: 14 }}>✓</span>}
                  </div>
                  <p className="text-[14px] font-semibold mb-1"
                    style={{ color: state === 'active' ? 'rgba(255,255,255,0.92)' : state === 'done' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)' }}>
                    {agent.name}
                  </p>
                  <p className="text-[11px] leading-snug"
                    style={{ color: state === 'active' ? 'rgba(74,124,240,0.75)' : state === 'done' ? 'rgba(13,184,130,0.55)' : 'rgba(255,255,255,0.18)' }}>
                    {agent.desc}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6 max-w-[420px] mx-auto">
            {AGENTS.slice(3).map((agent, idx) => {
              const i = idx + 3
              const state = i < activeAgent ? 'done' : i === activeAgent ? 'active' : 'waiting'
              const color = state === 'active' ? '#7aa8f8' : state === 'done' ? '#3dd4a0' : 'rgba(255,255,255,0.3)'
              return (
                <div key={i}
                  className="rounded-2xl p-4 transition-all duration-500"
                  style={{
                    background: state === 'active' ? 'rgba(74,124,240,0.08)' : state === 'done' ? 'rgba(13,184,130,0.05)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${state === 'active' ? 'rgba(74,124,240,0.3)' : state === 'done' ? 'rgba(13,184,130,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    opacity: state === 'waiting' ? 0.45 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    {agent.icon(color)}
                    {state === 'active' && <WaveBars color="#4a7cf0" />}
                    {state === 'done' && <span style={{ color: '#3dd4a0', fontSize: 14 }}>✓</span>}
                  </div>
                  <p className="text-[14px] font-semibold mb-1"
                    style={{ color: state === 'active' ? 'rgba(255,255,255,0.92)' : state === 'done' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)' }}>
                    {agent.name}
                  </p>
                  <p className="text-[11px] leading-snug"
                    style={{ color: state === 'active' ? 'rgba(74,124,240,0.75)' : state === 'done' ? 'rgba(13,184,130,0.55)' : 'rgba(255,255,255,0.18)' }}>
                    {agent.desc}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Live highlights feed */}
          {highlights.length > 0 && (
            <div className="mb-6 max-w-[420px] mx-auto rounded-xl px-4 py-3 overflow-hidden"
              style={{ background: 'rgba(74,124,240,0.04)', border: '1px solid rgba(74,124,240,0.12)', maxHeight: 92 }}>
              <div className="flex flex-col gap-1.5">
                {highlights.slice(-3).map((h, i) => (
                  <div key={`${h}-${i}`} className="flex items-center gap-2 animate-fade-in"
                    style={{ animationDuration: '0.4s' }}>
                    <span style={{ color: '#3dd4a0', fontSize: 10, flexShrink: 0 }}>●</span>
                    <span className="text-[11.5px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl max-w-[420px] mx-auto"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: activeAgent >= AGENTS.length ? '#3dd4a0' : '#4a7cf0',
                animation: activeAgent >= AGENTS.length ? 'none' : 'pulseDot 1.4s ease-in-out infinite',
                boxShadow: activeAgent >= AGENTS.length ? '0 0 8px rgba(13,184,130,0.6)' : '0 0 8px rgba(74,124,240,0.6)',
              }} />
            <span className="flex-1 text-[12px]" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</span>
            <div className="w-20 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${progress}%`, background: 'linear-gradient(to right, #4a7cf0, #0db882)' }}>
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 1.5s infinite' }} />
              </div>
            </div>
          </div>

          {!error && activeAgent >= 0 && activeAgent < AGENTS.length && onCancel && (
            <div className="mt-4 text-center">
              <button onClick={onCancel}
                className="text-[12px] px-4 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,120,120,0.8)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,120,120,0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}>
                Cancel generation
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 px-4 py-3 rounded-xl text-[13px] leading-relaxed max-w-[420px] mx-auto"
              style={{ background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)', color: 'rgba(240,120,120,0.9)' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wv { 0%,100%{transform:scaleY(0.15);opacity:0.25} 50%{transform:scaleY(1);opacity:1} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.55)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>
    </div>
  )
}
