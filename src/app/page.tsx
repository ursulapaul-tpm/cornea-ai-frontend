'use client'
import { useState } from 'react'
import { Landing } from './components/Landing'
import { Loading } from './components/Loading'
import { Results } from './components/Results'
import { SystemCanvas } from './components/graph/SystemCanvas'
import { Blueprint, AppScreen } from './types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const AGENT_DURATIONS = [20000, 22000, 20000, 24000]

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [showGraph, setShowGraph] = useState(false)
  const [idea, setIdea] = useState('')
  const [activeAgent, setActiveAgent] = useState(-1)
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (submittedIdea: string) => {
    setIdea(submittedIdea)
    setError(null)
    setActiveAgent(0)
    setBlueprint(null)
    setShowGraph(false)
    setScreen('loading')

    const animateAgents = async () => {
      for (let i = 0; i < 4; i++) {
        setActiveAgent(i)
        await new Promise(r => setTimeout(r, AGENT_DURATIONS[i]))
      }
    }

    const fetchBlueprint = async () => {
      const res = await fetch(`${BACKEND_URL}/api/blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIdea: submittedIdea }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || `Server error ${res.status}`)
      }
      return res.json() as Promise<Blueprint>
    }

    try {
      const [data] = await Promise.all([fetchBlueprint(), animateAgents()])
      setActiveAgent(4)
      setBlueprint(data)
      await new Promise(r => setTimeout(r, 600))
      setScreen('canvas')
    } catch (err: any) {
      setError(
        err.message.includes('Failed to fetch')
          ? 'Could not reach the backend. Make sure cornea.ai API is running on localhost:3000.'
          : `Something went wrong: ${err.message}`
      )
      setActiveAgent(-1)
    }
  }

  const handleReset = () => {
    setScreen('landing')
    setActiveAgent(-1)
    setError(null)
    setBlueprint(null)
    setShowGraph(false)
  }

  return (
    <div style={{ background: '#05050f' }}>
      {screen === 'landing' && <Landing onSubmit={handleSubmit} />}

      {screen === 'loading' && (
        <Loading idea={idea} activeAgent={activeAgent} error={error} onLogoClick={handleReset} onCancel={handleReset} />
      )}

      {screen === 'canvas' && blueprint && !showGraph && (
        <Results
          blueprint={blueprint}
          idea={idea}
          onNewIdea={handleReset}
          onViewGraph={() => setShowGraph(true)}
          onRegenerate={handleSubmit}
        />
      )}

      {screen === 'canvas' && blueprint && showGraph && (
        <SystemCanvas
          blueprint={blueprint}
          idea={idea}
          onClose={() => setShowGraph(false)}
          onBlueprintUpdate={(updated) => setBlueprint(updated)}
        />
      )}
    </div>
  )
}
