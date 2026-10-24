import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { renaultSteps } from '../../data/profile'
import { useScrollSteps } from '../../hooks/useScrollSteps'
import { StoryText } from '../StoryText'
import { Duster } from './Duster'

export function RenaultSection() {
  const storyRef = useRef<HTMLDivElement>(null)
  const { step, inView } = useScrollSteps(storyRef, renaultSteps.length)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (inView) setDrawn(true)
  }, [inView])

  return (
    <section className="renault" id="renault">
      <div className="container section-intro">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
          <div className="kicker">// experience 02</div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            <span className="grad-renault">Renault Group</span>
          </h2>
          <div className="meta">
            <span>
              <b>Engineer</b> · Jul 2025 – Apr 2026
            </span>
            <span>
              <b>Graduate Engineering Trainee</b> · Jul 2024 – Jun 2025
            </span>
            <span>Bengaluru, India</span>
          </div>
        </motion.div>
      </div>

      <div className="story" ref={storyRef} style={{ height: `${renaultSteps.length * 90 + 40}vh` }}>
        <div className="story-sticky">
          <div className="container story-grid">
            <div className="story-stage">
              <div className="duster-stage">
                <Duster step={renaultSteps[step].id} drawn={drawn} />
              </div>
            </div>
            <StoryText steps={renaultSteps} step={step} />
          </div>
        </div>
      </div>
    </section>
  )
}
