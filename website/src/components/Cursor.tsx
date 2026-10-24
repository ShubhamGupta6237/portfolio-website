import { useEffect, useRef } from 'react'

export function Cursor() {
  const glow = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let gx = x
    let gy = y
    let raf = 0

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const interactive = (e.target as HTMLElement | null)?.closest('a, button, .marquee-item')
      dot.current?.classList.toggle('big', Boolean(interactive))
    }
    const loop = () => {
      gx += (x - gx) * 0.08
      gy += (y - gy) * 0.08
      if (glow.current) glow.current.style.transform = `translate3d(${gx}px, ${gy}px, 0)`
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="cursor-glow" ref={glow} />
      <div className="cursor-dot" ref={dot} />
    </>
  )
}
