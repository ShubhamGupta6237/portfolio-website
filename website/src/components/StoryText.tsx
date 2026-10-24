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

export function StoryText({ steps, step }: { steps: Step[]; step: number }) {
  const s = steps[step]
  // Derived during render (React's sanctioned pattern) so the exiting step knows which way to leave.
  const [nav, setNav] = useState({ prev: step, dir: 1 })
  if (nav.prev !== step) setNav({ prev: step, dir: step > nav.prev ? 1 : -1 })
  const dir = nav.dir

  return (
    <div className="story-text">
      <div className="story-dots" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={i === step ? 'on' : i < step ? 'done' : ''} />
        ))}
      </div>
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
            <motion.div variants={itemVariants} className="tags">
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
