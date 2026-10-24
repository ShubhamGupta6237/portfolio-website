import { useLayoutEffect, useState, type RefObject } from 'react'
import { ScrollTrigger } from '../lib/scroll'

/** Maps scroll progress through a tall container onto a discrete step index on desktop,
 * and allows direct touch/step navigation on mobile. */
export function useScrollSteps(ref: RefObject<HTMLElement | null>, count: number) {
  const [step, setStep] = useState(0)
  const [inView, setInView] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 960 : false))

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // On mobile viewports (<= 960px), let content flow naturally with interactive step deck
    if (window.innerWidth <= 960) {
      const onResize = () => {
        if (window.innerWidth > 960) ScrollTrigger.refresh()
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

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

  return { step, setStep, inView }
}
