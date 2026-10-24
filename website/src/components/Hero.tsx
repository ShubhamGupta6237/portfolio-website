import { motion } from 'framer-motion'
import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { profile } from '../data/profile'
import { useOnScreen } from '../hooks/useOnScreen'
import { easeOut } from '../lib/motion'
import { gsap, prefersReducedMotion, scrollToId } from '../lib/scroll'

const AudioWaveHorizon = lazy(() => import('./hero/AudioWaveHorizon').then((m) => ({ default: m.AudioWaveHorizon })))

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: easeOut },
})

const line = (delay: number) => ({
  initial: { y: '108%' },
  animate: { y: '0%' },
  transition: { duration: 1.1, delay, ease: easeOut },
})

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const visible = useOnScreen(ref)
  const reduced = prefersReducedMotion()

  // Content drifts up and softens as you scroll past, so the hand-off to the next section isn't a hard cut.
  useLayoutEffect(() => {
    if (reduced || !ref.current || !inner.current) return
    const tween = gsap.to(inner.current, {
      yPercent: -9,
      opacity: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [reduced])

  return (
    <header className="hero" id="top" ref={ref}>
      <motion.div
        className="hero-field"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, delay: 0.3, ease: easeOut }}
      >
        {!reduced && (
          <Suspense fallback={null}>
            <AudioWaveHorizon active={visible} />
          </Suspense>
        )}
        <div className="hero-fade" />
      </motion.div>
      <div className="container hero-inner" ref={inner}>
        <motion.p className="hero-meta" {...rise(0.1)}>
          <span className="live" />
          Founding engineer · Vaani AI · Bengaluru
        </motion.p>
        <h1 className="hero-name">
          <span className="line">
            <motion.span {...line(0.18)}>Shubham</motion.span>
          </span>
          <span className="line">
            <motion.span className="name-accent" {...line(0.3)}>Gupta</motion.span>
          </span>
        </h1>
        <motion.p className="hero-role" {...rise(0.55)}>
          {profile.tagline}
        </motion.p>
        <motion.p className="hero-tagline" {...rise(0.68)}>
          I designed the C++20 engine behind live phone and web voice agents. Before that, two years of connected-vehicle
          software at Renault Group.
        </motion.p>
        <motion.div className="hero-cta" {...rise(0.82)}>
          <button className="btn primary" onClick={() => scrollToId('vaani')}>
            The work
          </button>
          <a className="btn" href={profile.resume} download>
            Résumé
          </a>
        </motion.div>
      </div>
      <motion.div className="hero-scroll" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
        <span>Scroll</span>
        <i />
      </motion.div>
    </header>
  )
}
