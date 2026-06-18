'use client'
import { useState, useRef, useEffect } from 'react'

const EXAMPLES = [
  'A project management tool for remote teams',
  'An ecommerce platform with customer and admin login',
  'A health monitoring app for seniors with caregiver dashboards',
  'An AI-powered recruiting platform that matches candidates to jobs',
  'A fintech app for freelancers to track income and invoices',
]

interface LandingProps {
  onSubmit: (idea: string) => void
}

function SpiralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      // Draw multiple rotating rings
      const rings = [
        { r: 320, lines: 80, speed: 0.0008, color: 'rgba(74,124,240,', width: 0.6 },
        { r: 260, lines: 64, speed: -0.0012, color: 'rgba(124,92,240,', width: 0.5 },
        { r: 200, lines: 48, speed: 0.0016, color: 'rgba(74,124,240,', width: 0.4 },
        { r: 150, lines: 36, speed: -0.002, color: 'rgba(13,184,130,', width: 0.4 },
        { r: 100, lines: 24, speed: 0.003, color: 'rgba(124,92,240,', width: 0.35 },
      ]

      rings.forEach(ring => {
        const angle = t * ring.speed * 1000
        for (let i = 0; i < ring.lines; i++) {
          const a = (i / ring.lines) * Math.PI * 2 + angle
          const x = cx + Math.cos(a) * ring.r
          const y = cy + Math.sin(a) * ring.r

          // Line from center-ish to ring point
          const innerR = ring.r * 0.15
          const ix = cx + Math.cos(a) * innerR
          const iy = cy + Math.sin(a) * innerR

          const opacity = 0.12 + 0.08 * Math.sin(a * 3 + t * 0.001)
          ctx.beginPath()
          ctx.moveTo(ix, iy)
          ctx.lineTo(x, y)
          ctx.strokeStyle = `${ring.color}${opacity})`
          ctx.lineWidth = ring.width
          ctx.stroke()
        }

        // Ring outline
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = `${ring.color}0.06)`
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      // Center glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80)
      grad.addColorStop(0, 'rgba(74,124,240,0.12)')
      grad.addColorStop(0.5, 'rgba(124,92,240,0.06)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 80, 0, Math.PI * 2)
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
      style={{ opacity: 0.9 }}
    />
  )
}

export function Landing({ onSubmit }: LandingProps) {
  const [idea, setIdea] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = idea.trim()
    if (!trimmed || trimmed.length < 10) return
    onSubmit(trimmed)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="relative flex flex-col overflow-hidden" style2="height:100vh"
      style={{ background: '#05050f', height: '100vh', maxHeight: '100vh' }}>

      {/* Spiral background */}
      <SpiralCanvas />

      {/* Radial fade to darken center so text is readable */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(5,5,15,0.75) 0%, rgba(5,5,15,0.3) 60%, rgba(5,5,15,0) 100%)'
        }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
              <circle cx="8.7" cy="7.3" r="0.65" fill="rgba(74,124,240,0.5)"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
            cornea.ai
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-[13px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            Docs
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer"
            className="text-[13px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            GitHub
          </a>
        </div>
      </nav>

      {/* Main content — centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-4" style={{ overflow: 'hidden' }}>

        {/* Hero text */}
        <div className="text-center mb-7 animate-fade-up">
          <h1 className="text-[46px] font-semibold leading-[1.1] tracking-[-0.02em] mb-4"
            style={{ color: 'rgba(255,255,255,0.95)' }}>
            From idea to system blueprint,
            before you write a line of code.
          </h1>
          <p className="text-[17px] font-light leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.42)' }}>
            Turn your idea into a structured system blueprint<br/>
            you can see, understand, and explore before writing code.
          </p>
        </div>

        {/* Input box */}
        <div className="w-full max-w-[600px] animate-fade-up delay-100">
          <div
            className="rounded-2xl transition-all duration-200"
            style={{
              background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
              border: focused
                ? '1.5px solid rgba(74,124,240,0.7)'
                : '1.5px solid rgba(255,255,255,0.1)',
              boxShadow: focused
                ? '0 0 0 4px rgba(74,124,240,0.1), 0 8px 32px rgba(0,0,0,0.4)'
                : '0 4px 24px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <textarea
              ref={textareaRef}
              className="w-full px-6 pt-5 pb-2 text-[16px] leading-relaxed bg-transparent border-none outline-none resize-none font-sans"
              style={{ color: 'rgba(255,255,255,0.88)', minHeight: 120 }}
              placeholder="e.g. I want to build a project management tool for remote teams with task tracking, deadlines, and team collaboration..."
              rows={4}
              maxLength={2000}
              value={idea}
              onChange={e => setIdea(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKey}
            />
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                {idea.length > 0 ? `${idea.length} / 2000` : '⌘ + Enter to generate'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={idea.trim().length < 10}
                className="btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-[14px]"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.4"/>
                  <circle cx="8" cy="8" r="2.2" fill="white"/>
                </svg>
                See your system
              </button>
            </div>
          </div>

          {/* Example chips */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setIdea(ex); textareaRef.current?.focus() }}
                className="text-[12px] px-3.5 py-1.5 rounded-full transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(74,124,240,0.15)'
                  el.style.borderColor = 'rgba(74,124,240,0.4)'
                  el.style.color = 'rgba(74,124,240,0.9)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(255,255,255,0.05)'
                  el.style.borderColor = 'rgba(255,255,255,0.1)'
                  el.style.color = 'rgba(255,255,255,0.4)'
                }}
              >
                {ex.length > 42 ? ex.slice(0, 40) + '...' : ex}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 animate-fade-up delay-200 flex items-center gap-10">
          {[
            { num: '4', label: 'AI agents' },
            { num: '7', label: 'System layers' },
            { num: '10+', label: 'Output fields' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[24px] font-semibold mb-0.5"
                style={{ color: 'rgba(255,255,255,0.9)' }}>{s.num}</div>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
