import { useLayoutEffect, useState, type RefObject } from 'react'
import { ScrollTrigger } from '../lib/scroll'

/** Maps scroll progress through a tall container onto a discrete step index. */
export function useScrollSteps(ref: RefObject<HTMLElement | null>, count: number) {
  const [step, setStep] = useState(0)
  const [inView, setInView] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => setInView(self.isActive),
      onUpdate: (self) => {
        el.style.setProperty('--story-progress', self.progress.toFixed(4))
        setStep(Math.min(count - 1, Math.floor(self.progress * count)))
      },
    })
    return () => trigger.kill()
  }, [ref, count])

  return { step, inView }
}
