import { AnimatePresence, motion } from 'framer-motion'

type Step = { kicker: string; title: string; body: string; tags: string[] }

export function StoryText({ steps, step }: { steps: Step[]; step: number }) {
  const s = steps[step]
  return (
    <div className="story-text">
      <div className="story-dots" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={i === step ? 'on' : ''} />
        ))}
      </div>
      <div className="story-step-stack">
      <AnimatePresence initial={false}>
        <motion.div
          key={step}
          className="story-step"
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -18, filter: 'blur(6px)', transition: { duration: 0.25 } }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.2, 0.7, 0.1, 1] }}
        >
          <div className="kicker">{s.kicker}</div>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
          <div className="tags">
            {s.tags.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  )
}
