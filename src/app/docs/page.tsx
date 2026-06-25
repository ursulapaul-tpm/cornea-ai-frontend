'use client'
import { useState } from 'react'

type Tab = 'overview' | 'how-it-works' | 'features' | 'changelog'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features guide' },
  { id: 'changelog', label: 'Changelog' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[20px] font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.92)' }}>
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
      {children}
    </p>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[14px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</p>
      <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
    </div>
  )
}

interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v1.1',
    date: 'June 25, 2026',
    changes: [
      'Feedback now captures respondent role (Product Manager, Software Engineer, Solutions Architect, etc.) alongside rating and message',
      'Admin dashboard displays role as a tag on each feedback entry for easier filtering by perspective',
    ],
  },
  {
    version: 'v1.0',
    date: 'June 24, 2026',
    changes: [
      'Initial public release of cornea.ai',
      '5-agent AI pipeline: Discovery, Workflow & Domain, Architecture, Documentation, and Architecture Reasoning',
      'Interactive System view with focus mode, dependency highlighting, and auto-layout',
      'Tradeoffs tab — explore real architectural alternatives and apply changes live',
      'Document upload — extract a product idea directly from PDF, DOCX, TXT, or MD files',
      'Live progress streaming during generation, with real highlights surfaced as each agent completes',
      'Anonymous history — every generated blueprint is automatically saved and revisitable',
      'Professional PDF export for the full Product Requirements Document',
      'In-app feedback collection',
    ],
  },
]

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div style={{ minHeight: '100vh', background: '#05050f' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: 'rgba(5,5,15,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7cf0, #7c5cf0)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="white" strokeWidth="1.3"/>
              <circle cx="8" cy="8" r="2.2" fill="white"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>cornea.ai</span>
        </a>
        <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Documentation</span>
        <a href="/" className="text-[12px] px-3.5 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          ← Back to app
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="text-[13px] px-4 py-2 rounded-lg transition-all flex-shrink-0"
              style={{
                background: activeTab === tab.id ? 'rgba(74,124,240,0.12)' : 'transparent',
                color: activeTab === tab.id ? '#7aa8f8' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(74,124,240,0.25)' : 'transparent'}`,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <SectionTitle>What is cornea.ai?</SectionTitle>
            <P>
              Modern software systems require hundreds of interconnected decisions — what database to use,
              whether to cache, how services should communicate, how to scale. Engineers and product builders
              don't struggle because they don't understand these concepts individually; they struggle because
              they have to hold the entire system in their head at once while making each decision.
            </P>
            <P>
              cornea.ai reduces that cognitive load. Describe a product idea in plain language, and five
              specialized AI agents work together to produce users, business goals, workflows, domain entities,
              system architecture, APIs, and a full set of documented architectural tradeoffs — all before a
              single line of code is written.
            </P>
            <SectionTitle>Who it's for</SectionTitle>
            <P>
              Founders validating an idea before committing engineering time. Product managers who need to
              communicate technical scope clearly. Engineers and architects who want a starting structure to
              react to, refine, or challenge — rather than staring at a blank page.
            </P>
          </div>
        )}

        {/* HOW IT WORKS */}
        {activeTab === 'how-it-works' && (
          <div>
            <SectionTitle>The 5-agent pipeline</SectionTitle>
            <P>Every blueprint is produced by five agents running in sequence, each building on the last.</P>
            <FeatureCard title="1. Discovery Agent" desc="Extracts user types, business goals, jobs-to-be-done, and core features directly from your idea." />
            <FeatureCard title="2. Workflow & Domain Agent" desc="Maps user workflows, domain entities, relationships, and business rules based on what Discovery found." />
            <FeatureCard title="3. Architecture Agent" desc="Designs the actual system — services, APIs, data layer, and integrations — grouped into Core, Business, and Support services." />
            <FeatureCard title="4. Documentation Agent" desc="Writes the PRD summary, system explanation, feature breakdown, system flow, and generates the architecture diagram." />
            <FeatureCard title="5. Architecture Reasoning Agent" desc="Identifies the real decision points in the architecture (database choice, caching, service patterns) and explains the tradeoffs against real alternatives." />
          </div>
        )}

        {/* FEATURES GUIDE */}
        {activeTab === 'features' && (
          <div>
            <SectionTitle>Working with your blueprint</SectionTitle>
            <FeatureCard title="Overview / Users / Features / Architecture / Specs tabs" desc="Five views into the same blueprint — from high-level summary down to functional and non-functional requirements." />
            <FeatureCard title="View System" desc="An interactive, auto-laid-out graph of your entire system. Click any node to inspect it; click again to focus and highlight its real dependencies while everything else fades." />
            <FeatureCard title="Tradeoffs tab" desc="On database and key service nodes, see the alternatives that were considered and why. Apply a different choice and the affected architecture and documentation regenerate live." />
            <FeatureCard title="Document upload" desc="Already have a PRD, notes, or a rough doc? Upload a PDF, DOCX, TXT, or MD file and cornea extracts the core idea automatically." />
            <FeatureCard title="History" desc="Every blueprint you generate is saved automatically and tied to your browser — revisit, reopen, or delete past blueprints anytime." />
            <FeatureCard title="Export" desc="Generate a full Product Requirements Document as a clean, properly formatted PDF, ready to share." />
          </div>
        )}

        {/* CHANGELOG */}
        {activeTab === 'changelog' && (
          <div>
            <SectionTitle>Changelog</SectionTitle>
            <P>A running history of what's shipped, version by version.</P>
            <div className="space-y-6 mt-2">
              {CHANGELOG.map(entry => (
                <div key={entry.version} className="pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[13px] font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(74,124,240,0.15)', color: '#7aa8f8' }}>
                      {entry.version}
                    </span>
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {entry.changes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ color: '#3dd4a0', marginTop: 1 }}>+</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
