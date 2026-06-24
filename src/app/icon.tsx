import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.4" />
          <circle cx="8" cy="8" r="2.4" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
