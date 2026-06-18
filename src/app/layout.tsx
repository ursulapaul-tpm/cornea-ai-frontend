import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'cornea.ai — Refract your idea into a product blueprint',
  description: 'Four specialized AI agents turn any product idea into users, workflows, architecture, APIs, and a full PRD.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
