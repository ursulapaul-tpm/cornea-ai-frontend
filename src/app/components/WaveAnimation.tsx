'use client'

const HEIGHTS = [7, 15, 20, 13, 9, 17, 7]

export function WaveAnimation() {
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 20 }}>
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h,
            borderRadius: 3,
            background: 'linear-gradient(to top, #7f77dd, #afa9ec)',
            animation: `wave 0.72s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.15); opacity: 0.35; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
