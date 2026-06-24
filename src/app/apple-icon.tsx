import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)',
        }}
      >
        <svg width="100" height="100" viewBox="0 0 16 16" fill="none">
          <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="2.4" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
