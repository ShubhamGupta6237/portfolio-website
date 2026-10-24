import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function startSmoothScroll(): () => void {
  if (prefersReducedMotion()) return () => {}
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, easing: (t) => 1 - Math.pow(1 - t, 4) })
  lenis.on('scroll', ScrollTrigger.update)
  if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis }).__lenis = lenis
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6 })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

export { gsap, ScrollTrigger }
