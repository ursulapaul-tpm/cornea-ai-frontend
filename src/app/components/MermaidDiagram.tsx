'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface MermaidProps {
  chart: string
  systemExplanation?: string
  modules?: string[]
}

interface FlowStep {
  step: number
  node: string
  action: string
  color: string
}

const STEP_COLORS = [
  '#afa9ec', '#5dcaa5', '#f0a070', '#70b8f0',
  '#e0a0d0', '#a0e0c0', '#f0d070', '#d0a0e0'
]

export function MermaidDiagram({ chart, systemExplanation, modules = [] }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)
  const [scale, setScale] = useState(0.85)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [lockedNode, setLockedNode] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; id: string } | null>(null)
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([])
  const [activeStep, setActiveStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const playRef = useRef<NodeJS.Timeout | null>(null)

  // Build flow steps from modules
  useEffect(() => {
    if (!modules.length) return
    const steps = modules.slice(0, 6).map((m, i) => ({
      step: i + 1,
      node: m.split('—')[0].trim(),
      action: m.includes('—') ? m.split('—')[1].trim() : `Processes and routes requests`,
      color: STEP_COLORS[i % STEP_COLORS.length],
    }))
    setFlowSteps(steps)
  }, [modules])

  const playAnimation = useCallback(() => {
    if (playing) return
    setPlaying(true)
    setActiveStep(0)
    let i = 0
    const tick = () => {
      i++
      if (i < flowSteps.length) {
        setActiveStep(i)
        playRef.current = setTimeout(tick, 1200)
      } else {
        setTimeout(() => {
          setPlaying(false)
          setActiveStep(-1)
        }, 1200)
      }
    }
    playRef.current = setTimeout(tick, 1200)
  }, [playing, flowSteps.length])

  useEffect(() => () => { if (playRef.current) clearTimeout(playRef.current) }, [])

  // Make diagram interactive after render
  const makeInteractive = useCallback(() => {
    if (!ref.current) return
    const nodes = ref.current.querySelectorAll('.node, .cluster')
    nodes.forEach((node) => {
      const el = node as HTMLElement
      el.style.cursor = 'pointer'
      el.style.transition = 'opacity 0.25s ease'

      el.addEventListener('mouseenter', (e) => {
        const active = lockedNode || el.id || el.className
        setHoveredNode(active)
        // Dim all other nodes
        nodes.forEach(n => {
          (n as HTMLElement).style.opacity = n === el ? '1' : '0.25'
        })
        // Show tooltip
        const rect = el.getBoundingClientRect()
        const wRect = wrapperRef.current?.getBoundingClientRect()
        const label = el.querySelector('text, .label, span')?.textContent?.trim() || 'Node'
        if (wRect) {
          setTooltip({
            x: rect.left - wRect.left + rect.width / 2,
            y: rect.top - wRect.top - 12,
            label,
            id: el.id || label,
          })
        }
      })

      el.addEventListener('mouseleave', () => {
        if (!lockedNode) {
          setHoveredNode(null)
          nodes.forEach(n => { (n as HTMLElement).style.opacity = '1' })
          setTooltip(null)
        }
      })

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = el.id || el.className
        if (lockedNode === id) {
          setLockedNode(null)
          nodes.forEach(n => { (n as HTMLElement).style.opacity = '1' })
          setTooltip(null)
        } else {
          setLockedNode(id)
        }
      })
    })

    // Click background to reset
    ref.current.addEventListener('click', () => {
      setLockedNode(null)
      setHoveredNode(null)
      nodes.forEach(n => { (n as HTMLElement).style.opacity = '1' })
      setTooltip(null)
    })
  }, [lockedNode])

  useEffect(() => {
    if (!chart || !ref.current) return
    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: 'rgba(127,119,221,0.18)',
            primaryTextColor: 'rgba(255,255,255,0.85)',
            primaryBorderColor: 'rgba(127,119,221,0.45)',
            lineColor: 'rgba(175,169,236,0.35)',
            secondaryColor: 'rgba(93,202,165,0.12)',
            tertiaryColor: 'rgba(255,255,255,0.04)',
            background: '#08080f',
            mainBkg: 'rgba(127,119,221,0.14)',
            nodeBorder: 'rgba(127,119,221,0.4)',
            clusterBkg: 'rgba(255,255,255,0.03)',
            clusterBorder: 'rgba(255,255,255,0.08)',
            titleColor: 'rgba(255,255,255,0.85)',
            edgeLabelBackground: 'rgba(8,8,15,0.8)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            nodeSpacing: 50,
            rankSpacing: 60,
          },
          flowchart: { curve: 'basis', htmlLabels: true, padding: 20 },
          securityLevel: 'loose',
        })
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, chart)
        if (ref.current) {
          ref.current.innerHTML = svg
          const svgEl = ref.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
            // Style edges
            svgEl.querySelectorAll('.edgePath path').forEach(p => {
              ;(p as SVGElement).style.stroke = 'rgba(175,169,236,0.4)'
              ;(p as SVGElement).style.strokeWidth = '1.5'
            })
            // Style arrowheads
            svgEl.querySelectorAll('marker path').forEach(p => {
              ;(p as SVGElement).style.fill = 'rgba(175,169,236,0.5)'
            })
          }
          setRendered(true)
          setError(null)
          setTimeout(makeInteractive, 100)
        }
      } catch (e: any) {
        setError('Could not render diagram.')
      }
    }
    render()
  }, [chart])

  const zoomIn = () => setScale(s => Math.min(s + 0.15, 2.5))
  const zoomOut = () => setScale(s => Math.max(s - 0.15, 0.3))
  const resetZoom = () => setScale(0.85)

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return
    if (!isFullscreen) {
      wrapperRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  if (error) {
    return (
      <pre className="rounded-xl p-4 text-[11px] leading-relaxed overflow-auto max-h-64"
        style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
        {chart}
      </pre>
    )
  }

  return (
    <div ref={wrapperRef} style={{ background: isFullscreen ? '#08080f' : 'transparent', padding: isFullscreen ? 32 : 0 }}>

      {/* Controls */}
      {rendered && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            <button onClick={zoomOut} className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">−</button>
            <span className="px-2 text-[12px] text-white/30" style={{ borderLeft: '0.5px solid rgba(255,255,255,0.08)', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">+</button>
          </div>
          <button onClick={resetZoom} className="px-3 py-1.5 text-[12px] rounded-lg text-white/40 hover:text-white/70 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
            Reset
          </button>
          <div className="text-[12px] text-white/25 flex items-center gap-1.5">
            <span>Hover nodes to explore</span>
            <span>·</span>
            <span>Click to lock</span>
          </div>
          <button onClick={toggleFullscreen} className="px-3 py-1.5 text-[12px] rounded-lg transition-all ml-auto"
            style={{ background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.25)', color: '#afa9ec' }}>
            {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      )}

      {/* Diagram container */}
      <div className="rounded-2xl overflow-auto relative"
        style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', minHeight: 240, maxHeight: isFullscreen ? 'calc(100vh - 200px)' : 480 }}>
        {!rendered && (
          <div className="flex items-center gap-2 text-[13px] text-white/30 p-6">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/10"
              style={{ animation: 'spin 0.7s linear infinite', borderTopColor: '#7f77dd' }} />
            Rendering diagram...
          </div>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute z-50 pointer-events-none px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/90 whitespace-nowrap"
            style={{
              left: tooltip.x, top: tooltip.y,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(20,20,36,0.95)',
              border: '0.5px solid rgba(127,119,221,0.4)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
            {tooltip.label}
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 rotate-45"
              style={{ transform: 'translateX(-50%) rotate(45deg)', background: 'rgba(20,20,36,0.95)', borderRight: '0.5px solid rgba(127,119,221,0.4)', borderBottom: '0.5px solid rgba(127,119,221,0.4)' }} />
          </div>
        )}

        <div ref={ref}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
            padding: 24,
            display: 'inline-block',
            minWidth: `${100 / scale}%`,
          }}
        />
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="mt-6 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(127,119,221,0.04)', border: '0.5px solid rgba(127,119,221,0.15)' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '0.5px solid rgba(127,119,221,0.12)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <h3 className="text-[14px] font-medium text-white/80">How it works</h3>
          </div>
          <button onClick={playAnimation} disabled={playing || flowSteps.length === 0}
            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'rgba(127,119,221,0.15)', border: '0.5px solid rgba(127,119,221,0.3)', color: '#afa9ec' }}>
            {playing ? (
              <><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#afa9ec', animation: 'pulse 0.8s infinite' }} /> Playing...</>
            ) : (
              <>▶ Play flow</>
            )}
          </button>
        </div>

        {/* Narrative */}
        {systemExplanation && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {systemExplanation.split('\n\n')[0]}
            </p>
          </div>
        )}

        {/* Animated steps */}
        {flowSteps.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
              {flowSteps.map((step, i) => {
                const isActive = activeStep === i
                const isPast = activeStep > i
                return (
                  <div key={i} className="flex items-center flex-shrink-0">
                    {/* Step node */}
                    <div className="flex flex-col items-center gap-2"
                      style={{ minWidth: 100, maxWidth: 120 }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-semibold transition-all duration-500"
                        style={{
                          background: isActive
                            ? step.color
                            : isPast
                            ? `${step.color}33`
                            : 'rgba(255,255,255,0.05)',
                          border: `1.5px solid ${isActive || isPast ? step.color : 'rgba(255,255,255,0.08)'}`,
                          color: isActive ? '#08080f' : isPast ? step.color : 'rgba(255,255,255,0.3)',
                          boxShadow: isActive ? `0 0 20px ${step.color}55` : 'none',
                          transform: isActive ? 'scale(1.15)' : 'scale(1)',
                        }}>
                        {step.step}
                      </div>
                      <p className="text-[11px] text-center leading-tight transition-colors duration-500"
                        style={{ color: isActive ? 'rgba(255,255,255,0.85)' : isPast ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)' }}>
                        {step.node}
                      </p>
                    </div>

                    {/* Connector */}
                    {i < flowSteps.length - 1 && (
                      <div className="flex items-center mx-1 flex-shrink-0" style={{ width: 28, marginTop: -16 }}>
                        <div className="h-[1.5px] flex-1 transition-all duration-500"
                          style={{ background: activeStep > i ? flowSteps[i].color : 'rgba(255,255,255,0.08)' }} />
                        <span className="text-[10px] transition-colors duration-500"
                          style={{ color: activeStep > i ? flowSteps[i].color : 'rgba(255,255,255,0.15)' }}>▶</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active step description */}
            <div className="mt-4 rounded-xl px-4 py-3 transition-all duration-300 min-h-[44px]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              {activeStep >= 0 && activeStep < flowSteps.length ? (
                <p className="text-[13px] leading-relaxed transition-all duration-300"
                  style={{ color: flowSteps[activeStep].color }}>
                  <strong>Step {flowSteps[activeStep].step} — {flowSteps[activeStep].node}:</strong>{' '}
                  {flowSteps[activeStep].action}
                </p>
              ) : (
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Press ▶ Play flow to see how a request moves through the system
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
