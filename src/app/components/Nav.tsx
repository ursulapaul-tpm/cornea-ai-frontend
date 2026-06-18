'use client'

interface NavProps {
  onLogoClick?: () => void
  showRefocus?: boolean
  ideaLabel?: string
}

export function Nav({ onLogoClick, showRefocus, ideaLabel }: NavProps) {
  return (
    <nav
      className="flex items-center justify-between px-8 py-4"
      style={{
        background: 'rgba(5,5,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="flex items-center gap-5">
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

      <div className="flex items-center gap-3">
        {ideaLabel && (
          <span className="text-[12px] px-3 py-1 rounded-full max-w-[260px] truncate hidden sm:block"
            style={{
              background: 'rgba(74,124,240,0.12)',
              color: 'rgba(74,124,240,0.9)',
              border: '1px solid rgba(74,124,240,0.25)',
            }}>
            {ideaLabel}
          </span>
        )}
        {showRefocus && (
          <button onClick={onLogoClick}
            className="btn-ghost text-[13px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="8" cy="8" r="2.2" fill="currentColor"/>
            </svg>
            New idea
          </button>
        )}
        <button onClick={onLogoClick} className="flex items-center gap-2 transition-opacity hover:opacity-75">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
              <circle cx="8.7" cy="7.3" r="0.65" fill="rgba(74,124,240,0.5)"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
            cornea.ai
          </span>
        </button>
      </div>
    </nav>
  )
}
