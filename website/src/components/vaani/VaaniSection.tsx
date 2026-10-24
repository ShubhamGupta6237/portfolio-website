import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { vaaniSteps } from '../../data/profile'
import { useScrollSteps } from '../../hooks/useScrollSteps'
import { easeIn, easeOut } from '../../lib/motion'
import { Reveal } from '../Reveal'
import { StoryText } from '../StoryText'
import { VaaniPanel } from './panels'
import { Pipeline } from './Pipeline'
import { useCallSimulation } from './useCallSimulation'

const VoiceTelemetry = lazy(() => import('./VoiceTelemetry').then((m) => ({ default: m.VoiceTelemetry })))

export function VaaniSection() {
  const storyRef = useRef<HTMLDivElement>(null)
  const { step, setStep, inView } = useScrollSteps(storyRef, vaaniSteps.length)
  const { state, node, messages, ampRef } = useCallSimulation(inView)
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight })
  }, [messages])

  const handleSelectStep = (index: number) => {
    setStep(index)
    if (window.innerWidth > 960 && storyRef.current) {
      const rect = storyRef.current.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const storyTop = rect.top + scrollTop
      const storyHeight = storyRef.current.offsetHeight - window.innerHeight
      const targetY = storyTop + (index / Math.max(1, vaaniSteps.length - 1)) * storyHeight
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }

  return (
    <section className="vaani" id="vaani">
      <div className="container section-intro">
        <Reveal>
          <div className="kicker">Now · 01</div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            Vaani AI Research
          </h2>
          <div className="meta">
            <span>
              <b>Founding Engineer, SSE</b>
            </span>
            <span>May 2026 – Present</span>
            <span>Bengaluru, India</span>
            <span>Custom C++20 voice-AI orchestrator</span>
          </div>
        </Reveal>
      </div>

      <div className="story" ref={storyRef} style={{ height: `${vaaniSteps.length * 85 + 40}vh` }}>
        <div className="story-sticky">
          <div className="container story-grid">
            <div className="story-stage">
              <div className="card agent-card">
                <div className="telemetry-stage">
                  <Suspense fallback={<div className="telemetry-placeholder">Loading voice telemetry...</div>}>
                    <VoiceTelemetry ampRef={ampRef} state={state} active={inView} />
                  </Suspense>
                </div>
                <div className="transcript" ref={transcriptRef}>
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        layout
                        className={`bubble ${m.who} ${m.interim ? 'interim' : ''} ${m.cut ? 'cut' : ''}`}
                        initial={{ opacity: 0, y: 14, scale: 0.97 }}
                        animate={{ opacity: m.cut ? 0.45 : 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: easeOut, layout: { duration: 0.4, ease: easeOut } }}
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
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: easeIn } }}
                    transition={{ duration: 0.6, delay: 0.12, ease: easeOut }}
                  >
                    <VaaniPanel id={vaaniSteps[step].id} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <StoryText steps={vaaniSteps} step={step} onSelectStep={handleSelectStep} />
          </div>
        </div>
      </div>
    </section>
  )
}
