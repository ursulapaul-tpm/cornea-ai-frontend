'use client'

export function CorneaIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2.2" fill="white" />
      <circle cx="8.6" cy="7.4" r="0.6" fill="rgba(0,0,0,0.4)" />
    </svg>
  )
}
