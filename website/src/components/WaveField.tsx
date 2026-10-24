import { useEffect, useRef } from 'react'

/** Layered flowing waveforms that bend toward the pointer, like a voice signal field. */
export function WaveField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const mouse = { x: 0.7, y: 0.5, tx: 0.7, ty: 0.5 }
    const lines = 26

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.tx = (e.clientX - r.left) / r.width
      mouse.ty = (e.clientY - r.top) / r.height
    }

    const draw = (t: number) => {
      const time = t * 0.001
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < lines; i++) {
        const p = i / (lines - 1)
        const baseY = h * (0.3 + p * 0.55)
        const hue = 185 + p * 85
        ctx.beginPath()
        ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${0.05 + (1 - Math.abs(p - 0.5) * 2) * 0.22})`
        ctx.lineWidth = 1.2
        for (let x = 0; x <= w; x += 6) {
          const nx = x / w
          const dist = Math.exp(-Math.pow((nx - mouse.x) * 3.2, 2) - Math.pow((baseY / h - mouse.y) * 3, 2))
          const envelope = 0.35 + dist * 1.6
          const y =
            baseY +
            Math.sin(nx * 9 + time * 1.3 + i * 0.35) * 18 * envelope +
            Math.sin(nx * 23 - time * 2.1 + i * 0.6) * 7 * envelope +
            Math.sin(nx * 3 + time * 0.5) * 30
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={ref} className="wavefield" />
}
