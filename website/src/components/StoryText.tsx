import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useState } from 'react'

type Step = { kicker: string; title: string; body: string; tags: string[] }

const modernEase = [0.16, 1, 0.3, 1] as const

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, y: 14 * dir }),
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: modernEase, staggerChildren: 0.04, delayChildren: 0.05 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: -12 * dir,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  }),
}

const itemVariants: Variants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease: modernEase } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export function StoryText({
  steps,
  step,
  onSelectStep,
  showNav = true,
}: {
  steps: Step[]
  step: number
  onSelectStep?: (index: number) => void
  showNav?: boolean
}) {
  const s = steps[step]
  // Derived during render (React's sanctioned pattern) so the exiting step knows which way to leave.
  const [nav, setNav] = useState({ prev: step, dir: 1 })
  if (nav.prev !== step) setNav({ prev: step, dir: step > nav.prev ? 1 : -1 })
  const dir = nav.dir

  const handlePrev = () => {
    if (step > 0 && onSelectStep) {
      onSelectStep(step - 1)
    }
  }

  const handleNext = () => {
    if (step < steps.length - 1 && onSelectStep) {
      onSelectStep(step + 1)
    }
  }

  return (
    <div className="story-text">
      {showNav && (
        <div className="story-nav-bar">
          <div className="story-dots" aria-label="Step navigation">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`story-dot-btn ${i === step ? 'on' : i < step ? 'done' : ''}`}
                onClick={() => onSelectStep?.(i)}
                aria-label={`Go to step ${i + 1} of ${steps.length}`}
              />
            ))}
          </div>

          <div className="mobile-step-stepper">
            <span className="step-counter">
              <span className="step-num">{String(step + 1).padStart(2, '0')}</span>
              <span className="step-sep">/</span>
              <span className="step-total">{String(steps.length).padStart(2, '0')}</span>
            </span>
            <div className="step-nav-arrows">
              <button
                type="button"
                className="step-arrow-btn"
                onClick={handlePrev}
                disabled={step === 0}
                aria-label="Previous step"
              >
                ‹
              </button>
              <button
                type="button"
                className="step-arrow-btn"
                onClick={handleNext}
                disabled={step === steps.length - 1}
                aria-label="Next step"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="story-step-stack">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={step}
            className="story-step"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div variants={itemVariants} className="kicker">
              {s.kicker}
            </motion.div>
            <motion.h3 variants={itemVariants}>{s.title}</motion.h3>
            <motion.p variants={itemVariants}>{s.body}</motion.p>
            <motion.div variants={itemVariants} className="tags story-tags">
              {s.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
