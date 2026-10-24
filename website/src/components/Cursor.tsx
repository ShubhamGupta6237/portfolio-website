import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/scroll'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, .btn'

function canUseCursor() {
  if (typeof window === 'undefined') return false
  if (prefersReducedMotion()) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canUseCursor()) return
    const root = rootRef.current
    if (!root) return

    document.documentElement.classList.add('has-cursor')

    const ring = root.querySelector<HTMLElement>('.cursor-ring')
    const dot = root.querySelector<HTMLElement>('.cursor-dot')
    if (!ring || !dot) return

    let mx = window.innerWidth * 0.5
    let my = window.innerHeight * 0.5
    let rx = mx
    let ry = my
    let dx = mx
    let dy = my
    let hover = false
    let visible = false
    let animId = 0

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!visible) {
        visible = true
        rx = mx
        ry = my
        dx = mx
        dy = my
        root.classList.add('on')
      }
    }

    const onLeave = () => {
      visible = false
      hover = false
      root.classList.remove('on', 'hover')
    }

    const isInteractive = (el: EventTarget | null) =>
      el instanceof Element && Boolean(el.closest(INTERACTIVE))

    const onOver = (e: PointerEvent) => {
      hover = isInteractive(e.target)
      root.classList.toggle('hover', hover)
    }

    const tick = () => {
      animId = requestAnimationFrame(tick)
      const pull = hover ? 0.28 : 0.18
      rx += (mx - rx) * pull
      ry += (my - ry) * pull
      dx += (mx - dx) * 0.46
      dy += (my - dy) * 0.46
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    window.addEventListener('blur', onLeave)
    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return (
    <div className="cursor" ref={rootRef} aria-hidden>
      <span className="cursor-ring" />
      <span className="cursor-dot" />
    </div>
  )
}
