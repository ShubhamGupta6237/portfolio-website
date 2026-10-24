import { useEffect, useRef } from 'react'
type Ribbon = {
  rgb: string
  width: number
  alpha: number
  yShift: number
  ampMul: number
  k1: number
  k2: number
  k3: number
  s1: number
  s2: number
  s3: number
  offset: number
  filled: boolean
}

type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; rgb: string }

const RIBBONS: Ribbon[] = [
  { rgb: '56, 211, 159', width: 2, alpha: 0.95, yShift: 0, ampMul: 1, k1: 1, k2: 2.3, k3: 4.1, s1: 1.2, s2: 1.9, s3: 2.7, offset: 0, filled: true },
  { rgb: '56, 189, 248', width: 1.5, alpha: 0.8, yShift: 0.16, ampMul: 0.82, k1: 1.25, k2: 2.7, k3: 4.8, s1: -1.5, s2: 2.1, s3: -2.4, offset: 1.4, filled: false },
  { rgb: '129, 140, 248', width: 1.3, alpha: 0.7, yShift: -0.14, ampMul: 0.7, k1: 0.8, k2: 1.9, k3: 3.6, s1: 0.9, s2: -1.6, s3: 2.2, offset: 2.6, filled: false },
  { rgb: '245, 158, 11', width: 1.1, alpha: 0.6, yShift: 0.3, ampMul: 0.55, k1: 1.5, k2: 3.1, k3: 5.2, s1: -1.1, s2: 1.4, s3: -3, offset: 3.9, filled: false },
]

function snapHz(raw: number) {
  const candidates = [30, 60, 90, 120, 144, 165, 240]
  let best = 60
  let bestDist = Infinity
  for (const hz of candidates) {
    const d = Math.abs(raw - hz)
    if (d < bestDist) {
      best = hz
      bestDist = d
    }
  }
  return best
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Float32Array, n: number) {
  ctx.moveTo(pts[0], pts[1])
  for (let i = 1; i < n - 1; i++) {
    const x0 = pts[i * 2]
    const y0 = pts[i * 2 + 1]
    const x1 = pts[(i + 1) * 2]
    const y1 = pts[(i + 1) * 2 + 1]
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) * 0.5, (y0 + y1) * 0.5)
  }
  ctx.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1])
}

export function AudioWaveHorizon({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    // Hardware-only check: a narrow window shouldn't downgrade a capable machine
    const nav = navigator as Navigator & { deviceMemory?: number }
    const lite = (navigator.hardwareConcurrency || 4) <= 4 || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)
    let cssW = 0
    let cssH = 0
    let hidden = document.hidden
    let animId = 0
    let lastTime = 0
    let lastFrame = 0
    let t = 0
    let slowFrames = 0
    let targetFps = lite ? 30 : 60
    let frameInterval = 1000 / targetFps
    let dprCap = lite ? 1 : 1.5
    const hzSamples: number[] = []

    const motes: Mote[] = []
    const strokeGrads: CanvasGradient[] = []
    let fillGrad: CanvasGradient | null = null
    let barGrad: CanvasGradient | null = null
    let washGrad: CanvasGradient | null = null

    const getLayout = (w: number, h: number) => {
      const narrow = w < 760
      const wide = w >= 1280
      const anchorY = h * (narrow ? 0.74 : 0.64)
      const amp = Math.max(28, Math.min(h * (narrow ? 0.1 : 0.105), wide ? 112 : 92))
      const cycles = narrow ? 1.6 : wide ? 3.1 : 2.4
      const ribbonCount = lite ? 2 : narrow ? 3 : 4
      const barCount = lite ? 0 : narrow ? 26 : wide ? 72 : 52
      const moteCount = lite || narrow ? 6 : 12
      return { narrow, wide, anchorY, amp, cycles, ribbonCount, barCount, moteCount }
    }

    const buildGradients = (w: number, h: number) => {
      const L = getLayout(w, h)
      strokeGrads.length = 0
      for (const r of RIBBONS) {
        const g = ctx.createLinearGradient(0, 0, w, 0)
        g.addColorStop(0, `rgba(${r.rgb}, 0)`)
        g.addColorStop(L.narrow ? 0.08 : 0.28, `rgba(${r.rgb}, ${r.alpha * 0.45})`)
        g.addColorStop(L.narrow ? 0.5 : 0.62, `rgba(${r.rgb}, ${r.alpha})`)
        g.addColorStop(0.94, `rgba(${r.rgb}, ${r.alpha * 0.6})`)
        g.addColorStop(1, `rgba(${r.rgb}, 0)`)
        strokeGrads.push(g)
      }
      fillGrad = ctx.createLinearGradient(0, L.anchorY - L.amp * 1.6, 0, L.anchorY + L.amp * 2.6)
      fillGrad.addColorStop(0, 'rgba(56, 211, 159, 0.22)')
      fillGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.07)')
      fillGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')
      barGrad = ctx.createLinearGradient(0, 0, w, 0)
      barGrad.addColorStop(0, 'rgba(56, 211, 159, 0)')
      barGrad.addColorStop(0.4, 'rgba(56, 211, 159, 0.55)')
      barGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.6)')
      barGrad.addColorStop(1, 'rgba(129, 140, 248, 0)')
      washGrad = ctx.createRadialGradient(w * 0.62, L.anchorY, 0, w * 0.62, L.anchorY, Math.max(w, h) * 0.5)
      washGrad.addColorStop(0, 'rgba(56, 211, 159, 0.1)')
      washGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.04)')
      washGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')
    }

    const spawnMotes = (w: number, h: number) => {
      const L = getLayout(w, h)
      motes.length = 0
      for (let i = 0; i < L.moteCount; i++) {
        motes.push({
          x: Math.random() * w,
          y: L.anchorY - L.amp * 1.4 + Math.random() * L.amp * 2.8,
          r: 0.7 + Math.random() * 1.3,
          vx: 0.25 + Math.random() * 0.7,
          vy: -(0.05 + Math.random() * 0.25),
          a: 0.25 + Math.random() * 0.45,
          rgb: Math.random() > 0.5 ? '56, 211, 159' : '125, 211, 252',
        })
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      cssW = rect.width
      cssH = rect.height
      if (cssW <= 0 || cssH <= 0) return
      dprCap = lite || cssW < 760 ? 1 : cssW < 1280 ? 1.25 : 1.5
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      const pw = Math.floor(cssW * dpr)
      const ph = Math.floor(cssH * dpr)
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw
        canvas.height = ph
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildGradients(cssW, cssH)
      spawnMotes(cssW, cssH)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const onVis = () => {
      hidden = document.hidden
      if (!hidden) {
        lastTime = 0
        lastFrame = 0
      }
    }
    document.addEventListener('visibilitychange', onVis)

    let pts = new Float32Array(0)

    const render = (time: number) => {
      if (active) animId = requestAnimationFrame(render)
      if (hidden) return

      // Learn the display's refresh rate from the first frames, then lock to it
      if (lastTime > 0 && hzSamples.length < 18) {
        const gap = time - lastTime
        if (gap > 4 && gap < 50) hzSamples.push(gap)
        if (hzSamples.length === 18) {
          const hz = snapHz(1000 / median(hzSamples))
          targetFps = lite ? Math.min(30, hz) : hz
          frameInterval = 1000 / targetFps
        }
      }
      if (lastFrame > 0 && time - lastFrame < frameInterval * 0.82) {
        lastTime = time
        return
      }

      const dt = lastTime === 0 ? 1 / targetFps : Math.min((time - lastTime) / 1000, 0.08)
      lastTime = time
      lastFrame = time
      t += dt

      const w = cssW
      const h = cssH
      if (w <= 0 || h <= 0 || !fillGrad || !barGrad || !washGrad) return

      const L = getLayout(w, h)
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      const frameStart = performance.now()

      ctx.fillStyle = washGrad
      ctx.fillRect(0, 0, w, h)

      // Voice energy: a slow breathing level plus quick syllable bursts
      const breath = 0.78 + Math.sin(t * 0.9) * 0.14 + Math.sin(t * 2.3 + 1.2) * 0.08
      const syllable = 0.86 + Math.max(0, Math.sin(t * 5.1)) * 0.2 * Math.max(0, Math.sin(t * 0.7 + 0.6))
      const energy = breath * syllable

      const fps = targetFps
      const samples = Math.round(Math.min(L.wide ? 150 : 100, Math.max(40, w / (fps <= 30 ? 16 : 9))))
      const n = samples + 1
      if (pts.length < n * 2) pts = new Float32Array(n * 2)
      const baseK = (Math.PI * 2 * L.cycles) / w

      // Equalizer bars hugging the baseline (mirrored), strongest to the right
      if (L.barCount > 0) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.strokeStyle = barGrad
        ctx.lineWidth = L.narrow ? 1.6 : 2
        ctx.beginPath()
        const x0 = w * (L.narrow ? 0.06 : 0.34)
        const x1 = w * 0.97
        for (let i = 0; i < L.barCount; i++) {
          const u = i / (L.barCount - 1)
          const x = x0 + (x1 - x0) * u
          const env = smooth(0, 0.35, u) * (1 - smooth(0.88, 1, u))
          const wob =
            0.5 + 0.5 * Math.sin(t * 3.1 + i * 0.55) * Math.sin(t * 1.3 + i * 0.21 + 1) + 0.18 * Math.sin(t * 6.4 + i)
          const bh = Math.max(1.5, L.amp * 0.62 * env * energy * Math.max(0.12, wob))
          ctx.moveTo(x, L.anchorY + L.amp * 1.15 - bh)
          ctx.lineTo(x, L.anchorY + L.amp * 1.15 + bh)
        }
        ctx.stroke()
      }

      // Ribbons
      ctx.globalCompositeOperation = 'lighter'
      for (let ri = 0; ri < L.ribbonCount; ri++) {
        const r = RIBBONS[ri]
        const yBase = L.anchorY + r.yShift * L.amp
        for (let i = 0; i < n; i++) {
          const x = (w * i) / samples
          const u = x / w
          const env = L.narrow ? 0.45 + 0.55 * smooth(0, 0.55, u) : 0.16 + 0.84 * smooth(0.12, 0.78, u)
          const taper = 1 - smooth(0.9, 1, u) * 0.7
          const pulse = 0.72 + 0.28 * Math.sin(x * 0.0042 - t * 0.9 + r.offset)
          const a = L.amp * r.ampMul * env * taper * pulse * energy
          const y =
            yBase +
            Math.sin(x * baseK * r.k1 + t * r.s1 * 1.6 + r.offset) * a * 0.62 +
            Math.sin(x * baseK * r.k2 - t * r.s2 * 1.6 + r.offset * 0.7) * a * 0.28 +
            Math.sin(x * baseK * r.k3 + t * r.s3 * 1.6) * a * 0.12
          pts[i * 2] = x
          pts[i * 2 + 1] = y
        }

        if (r.filled) {
          ctx.beginPath()
          tracePath(ctx, pts, n)
          ctx.lineTo(w, yBase + L.amp * 2.8)
          ctx.lineTo(0, yBase + L.amp * 2.8)
          ctx.closePath()
          ctx.fillStyle = fillGrad
          ctx.fill()
        }

        // Soft halo, then crisp core line
        ctx.beginPath()
        tracePath(ctx, pts, n)
        ctx.strokeStyle = strokeGrads[ri]
        ctx.globalAlpha = 0.22
        ctx.lineWidth = r.width * 5
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.lineWidth = r.width
        ctx.stroke()
      }

      // Drifting motes
      ctx.globalCompositeOperation = 'lighter'
      for (const m of motes) {
        m.x += m.vx * dt * 60
        m.y += m.vy * dt * 60
        if (m.x > w + 10) m.x = -10
        if (m.y < L.anchorY - L.amp * 1.6 || m.y > L.anchorY + L.amp * 1.6) {
          m.y = L.anchorY + (Math.random() - 0.5) * L.amp * 2.2
        }
        ctx.fillStyle = `rgba(${m.rgb}, ${m.a})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      // Back off if this machine is struggling
      const cost = performance.now() - frameStart
      if (cost > (1000 / Math.max(fps, 30)) * 0.72) {
        slowFrames += 1
        if (slowFrames > 18 && targetFps > 30) {
          targetFps = targetFps > 60 ? 60 : 30
          frameInterval = 1000 / targetFps
          slowFrames = 0
        }
      } else {
        slowFrames = Math.max(0, slowFrames - 1)
      }
    }

    if (active) animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [active])

  return (
    <div className="audio-wave-horizon">
      <canvas ref={canvasRef} />
    </div>
  )
}
