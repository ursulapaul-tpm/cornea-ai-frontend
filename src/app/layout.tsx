import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'cornea.ai — Turn any product idea into a system blueprint',
  description: 'cornea.ai helps founders, product managers, and engineers instantly map users, services, APIs, domain entities, and architecture from a plain-language product idea. No diagrams, no setup — just describe what you want to build.',
  keywords: [
    'product architecture tool',
    'system design for founders',
    'product requirements generator',
    'API design tool',
    'software architecture planner',
    'product manager tool',
    'PRD generator',
    'system blueprint',
    'product idea to architecture',
    'technical spec generator',
    'founder tool',
    'product builder',
    'system architect tool',
    'no-code architecture',
    'product design AI',
  ],
  openGraph: {
    title: 'cornea.ai — Turn any product idea into a system blueprint',
    description: 'Map users, services, APIs, and architecture from a plain-language idea. Built for founders, PMs, and engineers.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
