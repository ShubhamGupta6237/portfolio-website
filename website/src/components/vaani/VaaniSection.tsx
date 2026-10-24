import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { vaaniSteps } from '../../data/profile'
import { useScrollSteps } from '../../hooks/useScrollSteps'
import { StoryText } from '../StoryText'
import { VaaniPanel } from './panels'
import { Pipeline } from './Pipeline'
import { useCallSimulation, type AgentState } from './useCallSimulation'

// Three.js is ~1 MB; split it out so the first paint doesn't wait on it.
const VoiceOrb = lazy(() => import('./VoiceOrb').then((m) => ({ default: m.VoiceOrb })))

const stateMeta: Record<AgentState, { label: string; color: string }> = {
  listening: { label: 'Listening', color: '#5ef2ff' },
  thinking: { label: 'Thinking', color: '#ffb020' },
  speaking: { label: 'Speaking', color: '#f472b6' },
  interrupted: { label: 'Barge-in', color: '#f87171' },
}

export function VaaniSection() {
  const storyRef = useRef<HTMLDivElement>(null)
  const { step, inView } = useScrollSteps(storyRef, vaaniSteps.length)
  const { state, node, messages, latency, ampRef } = useCallSimulation(inView)
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight })
  }, [messages])

  const meta = stateMeta[state]

  return (
    <section className="vaani" id="vaani">
      <div className="container section-intro">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
          <div className="kicker">// experience 01 · now</div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            <span className="grad-vaani">Vaani AI Research</span>
          </h2>
          <div className="meta">
            <span>
              <b>Founding Engineer, SSE</b>
            </span>
            <span>May 2026 – Present</span>
            <span>Bengaluru, India</span>
            <span>Custom C++20 voice-AI orchestrator</span>
          </div>
        </motion.div>
      </div>

      <div className="story" ref={storyRef} style={{ height: `${vaaniSteps.length * 85 + 40}vh` }}>
        <div className="story-sticky">
          <div className="container story-grid">
            <div className="story-stage">
              <div className="card agent-card">
                <div className="agent-orb">
                  <div className="agent-state" style={{ '--state-color': meta.color } as React.CSSProperties}>
                    <span className="pip" />
                    {meta.label}
                  </div>
                  <Suspense fallback={null}>
                    <VoiceOrb ampRef={ampRef} state={state} active={inView} />
                  </Suspense>
                  <div className="agent-latency">
                    voice-to-voice <b>{latency ? `${latency} ms` : '—'}</b> · demo
                  </div>
                </div>
                <div className="transcript" ref={transcriptRef}>
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        layout
                        className={`bubble ${m.who} ${m.interim ? 'interim' : ''} ${m.cut ? 'cut' : ''}`}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: m.cut ? 0.45 : 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="who">{m.who === 'user' ? (m.interim ? 'caller · interim' : 'caller') : 'agent'}</span>
                        {m.text || '…'}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <Pipeline node={node} />

              <div className="card panel-wrap">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={vaaniSteps[step].id}
                    className="panel"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                  >
                    <VaaniPanel id={vaaniSteps[step].id} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <StoryText steps={vaaniSteps} step={step} />
          </div>
        </div>
      </div>
    </section>
  )
}
