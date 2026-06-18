'use client'
import { useEffect, useRef } from 'react'

const AGENTS = [
  { name: 'Discovery Agent', desc: 'Mapping users, problems & business goals' },
  { name: 'Workflow & Domain Agent', desc: 'Defining journeys, entities & rules' },
  { name: 'Architecture Agent', desc: 'Designing services, APIs & boundaries' },
  { name: 'Documentation Agent', desc: 'Writing PRD, features & system flow' },
]

const MESSAGES = [
  'Understanding your product...',
  'Mapping users and workflows...',
  'Designing system architecture...',
  'Writing documentation & PRD...',
]

interface LoadingProps {
  idea: string
  activeAgent: number
  error: string | null
  onLogoClick?: () => void
  onCancel?: () => void
}

interface SpiralProps {
  activeAgent: number
}

function SpiralCanvas({ activeAgent }: SpiralProps) {
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

    // Completed node positions (locked dots on rings)
    const completedNodes: { ring: number; angle: number; color: string; opacity: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const active = activeRef.current

      // Speed increases as agents complete
      const speedMult = 1 + (active < 0 ? 0 : active) * 0.35

      const rings = [
        { r: Math.min(W, H) * 0.38, lines: 72, speed: 0.0009 * speedMult, color: 'rgba(74,124,240,', baseOp: 0.12 },
        { r: Math.min(W, H) * 0.30, lines: 56, speed: -0.0013 * speedMult, color: 'rgba(124,92,240,', baseOp: 0.10 },
        { r: Math.min(W, H) * 0.22, lines: 40, speed: 0.0018 * speedMult, color: 'rgba(74,124,240,', baseOp: 0.09 },
        { r: Math.min(W, H) * 0.15, lines: 28, speed: -0.0024 * speedMult, color: 'rgba(13,184,130,', baseOp: 0.10 },
        { r: Math.min(W, H) * 0.08, lines: 18, speed: 0.003 * speedMult, color: 'rgba(124,92,240,', baseOp: 0.12 },
      ]

      // Brightness increases with progress
      const brightMult = 1 + (active < 0 ? 0 : Math.min(active, 4)) * 0.2

      rings.forEach((ring, ri) => {
        const angle = t * ring.speed * 1000
        for (let i = 0; i < ring.lines; i++) {
          const a = (i / ring.lines) * Math.PI * 2 + angle
          const x = cx + Math.cos(a) * ring.r
          const y = cy + Math.sin(a) * ring.r
          const ix = cx + Math.cos(a) * ring.r * 0.1
          const iy = cy + Math.sin(a) * ring.r * 0.1
          const op = (ring.baseOp + 0.06 * Math.sin(a * 4 + t * 0.002)) * brightMult
          ctx.beginPath()
          ctx.moveTo(ix, iy)
          ctx.lineTo(x, y)
          ctx.strokeStyle = `${ring.color}${Math.min(op, 0.45)})`
          ctx.lineWidth = 0.55
          ctx.stroke()
        }

        // Ring outline
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = `${ring.color}${0.05 * brightMult})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      // Add completed node dots when agent finishes
      const targetNodes = active < 0 ? 0 : Math.min(active, 4)
      while (completedNodes.length < targetNodes) {
        const ri = completedNodes.length % rings.length
        const colors = ['#4a7cf0', '#7c5cf0', '#0db882', '#4a7cf0']
        completedNodes.push({
          ring: ri,
          angle: Math.random() * Math.PI * 2,
          color: colors[completedNodes.length % colors.length],
          opacity: 0,
        })
      }

      // Draw + fade in completed nodes
      completedNodes.forEach((node, ni) => {
        node.opacity = Math.min(1, node.opacity + 0.02)
        const ring = rings[node.ring]
        const angle = node.angle + t * ring.speed * 1000
        const x = cx + Math.cos(angle) * ring.r
        const y = cy + Math.sin(angle) * ring.r

        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 10)
        grad.addColorStop(0, `${node.color}${(0.6 * node.opacity).toFixed(2).replace('0.', '').padStart(2, '0')}`)
        grad.addColorStop(1, `${node.color}00`)
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Dot
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.globalAlpha = node.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Center glow — pulses with progress
      const glowR = 60 + (active < 0 ? 0 : active) * 10
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
      grad.addColorStop(0, `rgba(74,124,240,${0.1 * brightMult})`)
      grad.addColorStop(0.5, `rgba(124,92,240,${0.05 * brightMult})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      t++
      animFrame = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.95 }}
    />
  )
}

export function Loading({ idea, activeAgent, error, onLogoClick, onCancel }: LoadingProps) {
  const progress = activeAgent >= 0 ? Math.min((activeAgent / 4) * 100, 100) : 0
  const label = activeAgent >= 0 && activeAgent < 4
    ? MESSAGES[activeAgent]
    : activeAgent === 4 ? 'Blueprint ready!' : 'Initializing...'

  return (
    <div className="flex flex-col relative" style={{ height: '100vh', background: '#05050f', overflow: 'hidden' }}>

      {/* Full-screen spiral */}
      <SpiralCanvas activeAgent={activeAgent} />

      {/* Center radial overlay so content stays readable */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 65% at 50% 50%, rgba(5,5,15,0.88) 0%, rgba(5,5,15,0.55) 55%, rgba(5,5,15,0.1) 100%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex-shrink-0 flex items-center justify-between px-8 py-5">
        <button onClick={onLogoClick} className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
              <circle cx="8.7" cy="7.3" r="0.65" fill="rgba(74,124,240,0.5)"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>cornea.ai</span>
        </button>
        <div className="flex items-center gap-6">
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Docs</span>
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>GitHub</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8" style={{ overflow: 'hidden' }}>
        <div className="w-full max-w-[500px]">

          {/* Header */}
          <div className="text-center mb-7">
            <p className="text-[11px] uppercase tracking-[0.22em] mb-3 font-medium"
              style={{ color: 'rgba(74,124,240,0.65)' }}>
              cornea is thinking in systems
            </p>
            <h2 className="text-[24px] font-semibold mb-3 transition-all duration-500"
              style={{ color: 'rgba(255,255,255,0.92)' }}>
              {label}
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px]"
              style={{
                background: 'rgba(74,124,240,0.08)',
                border: '1px solid rgba(74,124,240,0.18)',
                color: 'rgba(255,255,255,0.45)',
              }}>
              <span style={{ color: 'rgba(74,124,240,0.75)' }}>💡</span>
              <span className="truncate max-w-[320px]">{idea}</span>
            </div>
          </div>

          {/* Agent cards */}
          <div className="flex flex-col gap-2 mb-5">
            {AGENTS.map((agent, i) => {
              const state = i < activeAgent ? 'done' : i === activeAgent ? 'active' : 'waiting'
              return (
                <div key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500"
                  style={{
                    background: state === 'active'
                      ? 'rgba(74,124,240,0.1)'
                      : state === 'done'
                      ? 'rgba(13,184,130,0.07)'
                      : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${
                      state === 'active' ? 'rgba(74,124,240,0.3)'
                      : state === 'done' ? 'rgba(13,184,130,0.22)'
                      : 'rgba(255,255,255,0.06)'}`,
                    opacity: state === 'waiting' ? 0.32 : 1,
                    transform: state === 'active' ? 'translateX(4px)' : 'translateX(0)',
                  }}>

                  {/* Number / check */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 transition-all duration-500"
                    style={{
                      background: state === 'active' ? 'rgba(74,124,240,0.28)' : state === 'done' ? 'rgba(13,184,130,0.22)' : 'rgba(255,255,255,0.06)',
                      color: state === 'active' ? '#7aa8f8' : state === 'done' ? '#3dd4a0' : 'rgba(255,255,255,0.22)',
                    }}>
                    {state === 'done' ? '✓' : i + 1}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium transition-colors duration-500"
                      style={{ color: state === 'active' ? 'rgba(255,255,255,0.92)' : state === 'done' ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.22)' }}>
                      {agent.name}
                    </p>
                    <p className="text-[11px] mt-0.5 transition-colors duration-500"
                      style={{ color: state === 'active' ? 'rgba(74,124,240,0.75)' : state === 'done' ? 'rgba(13,184,130,0.55)' : 'rgba(255,255,255,0.13)' }}>
                      {agent.desc}
                    </p>
                  </div>

                  {/* Wave animation */}
                  <div className="flex-shrink-0 w-9 flex items-center justify-end">
                    {state === 'active' && (
                      <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
                        {[5, 12, 16, 10, 7, 14, 6].map((h, j) => (
                          <div key={j} style={{
                            width: 2.5,
                            height: h,
                            borderRadius: 3,
                            background: 'linear-gradient(to top, #4a7cf0, #7aa8f8)',
                            animation: `wv 0.65s ease-in-out ${j * 0.09}s infinite`,
                          }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: activeAgent === 4 ? '#3dd4a0' : '#4a7cf0',
                animation: activeAgent === 4 ? 'none' : 'pulseDot 1.4s ease-in-out infinite',
                boxShadow: activeAgent === 4 ? '0 0 8px rgba(13,184,130,0.6)' : '0 0 8px rgba(74,124,240,0.6)',
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

          {/* Cancel button */}
          {!error && activeAgent >= 0 && activeAgent < 4 && onCancel && (
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

          {/* Error */}
          {error && (
            <div className="mt-3 px-4 py-3 rounded-xl text-[13px] leading-relaxed"
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
