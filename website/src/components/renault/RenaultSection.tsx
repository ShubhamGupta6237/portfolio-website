import { lazy, Suspense, useRef } from 'react'
import { renaultSteps } from '../../data/profile'
import { useScrollSteps } from '../../hooks/useScrollSteps'
import { Reveal } from '../Reveal'
import { StoryText } from '../StoryText'

const RenaultCockpit = lazy(() => import('./RenaultCockpit').then((m) => ({ default: m.RenaultCockpit })))

export function RenaultSection() {
  const storyRef = useRef<HTMLDivElement>(null)
  const { step, inView } = useScrollSteps(storyRef, renaultSteps.length)
  const id = renaultSteps[step].id

  return (
    <section className="renault" id="renault">
      <div className="container section-intro">
        <Reveal>
          <div className="kicker">Then · 02</div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            Renault Group
          </h2>
          <div className="meta">
            <span>
              <b>Software Engineer</b> · Automotive Systems
            </span>
            <span>
              <b>Graduate Engineering Trainee</b> · Automotive Systems
            </span>
            <span>Bengaluru, India</span>
          </div>
        </Reveal>
      </div>

      <div className="story" ref={storyRef} style={{ height: `${renaultSteps.length * 85 + 40}vh` }}>
        <div className="story-sticky">
          <div className="container story-grid">
            <div className="story-stage">
              <div className="cockpit-stage-wrap">
                <Suspense fallback={<div className="telemetry-placeholder">Loading IVI cockpit console...</div>}>
                  <RenaultCockpit step={id} active={inView} />
                </Suspense>
              </div>
            </div>
            <StoryText steps={renaultSteps} step={step} showNav={false} />
          </div>
        </div>
      </div>
    </section>
  )
}
