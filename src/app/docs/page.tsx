'use client'
import { useState, useRef } from 'react'
import { Landing } from '../components/Landing'
import { Loading } from '../components/Loading'
import { Results } from '../components/Results'
import { History } from '../components/History'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { SystemCanvas } from '../components/graph/SystemCanvas'
import { Blueprint, AppScreen } from '../types'
import { getDeviceId } from '../utils/deviceId'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [showGraph, setShowGraph] = useState(false)
  const [idea, setIdea] = useState('')
  const [activeAgent, setActiveAgent] = useState(-1)
  const [highlights, setHighlights] = useState<string[]>([])
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const handleSubmit = (submittedIdea: string) => {
    setIdea(submittedIdea)
    setError(null)
    setActiveAgent(0)
    setHighlights([])
    setBlueprint(null)
    setShowGraph(false)
    setScreen('loading')

    closeStream()

    const url = `${BACKEND_URL}/api/blueprint-stream?productIdea=${encodeURIComponent(submittedIdea)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('progress', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        // agentIndex is 1-based from the backend; activeAgent in the UI is 0-based
        if (data.status === 'running') {
          setActiveAgent(data.agentIndex - 1)
        }
        if (data.status === 'complete' && Array.isArray(data.highlights)) {
          setHighlights(prev => [...prev, ...data.highlights])
        }
      } catch {
        // ignore malformed progress events
      }
    })

    es.addEventListener('done', (e: MessageEvent) => {
      try {
        const data: Blueprint = JSON.parse(e.data)
        setActiveAgent(5)
        setBlueprint(data)

        // Auto-save to history — fire and forget
        const deviceId = getDeviceId()
        fetch(`${BACKEND_URL}/api/history/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, idea: submittedIdea, blueprint: data }),
        }).catch(() => {})

        closeStream()
        setTimeout(() => setScreen('canvas'), 600)
      } catch (err) {
        setError('Something went wrong while finalizing your blueprint.')
        closeStream()
      }
    })

    es.addEventListener('error', (e: MessageEvent) => {
      let message = 'Something went wrong. Please try again.'
      try {
        const data = JSON.parse((e as any).data)
        if (data?.error) message = data.error
      } catch {
        // EventSource native error (connection lost) has no JSON data
        message = 'Could not reach the backend. Make sure cornea.ai API is running.'
      }
      setError(message)
      setActiveAgent(-1)
      closeStream()
    })
  }

  const handleReset = () => {
    closeStream()
    setScreen('landing')
    setActiveAgent(-1)
    setHighlights([])
    setError(null)
    setBlueprint(null)
    setShowGraph(false)
  }

  const handleOpenFromHistory = (savedIdea: string, savedBlueprint: Blueprint) => {
    setIdea(savedIdea)
    setBlueprint(savedBlueprint)
    setShowGraph(false)
    setScreen('canvas')
  }

  return (
    <div style={{ background: '#05050f' }}>
      {screen === 'landing' && (
        <Landing onSubmit={handleSubmit} onViewHistory={() => setScreen('history')} />
      )}

      {screen === 'loading' && (
        <Loading idea={idea} activeAgent={activeAgent} error={error} highlights={highlights} onLogoClick={handleReset} onCancel={handleReset} />
      )}

      {screen === 'history' && (
        <History onOpenBlueprint={handleOpenFromHistory} onBack={handleReset} />
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

      <FeedbackWidget />
    </div>
  )
}
