import { useEffect, useRef } from 'react'

export function AudioWaveHorizon({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let lastTime = performance.now()
    let phase = 0

    // High-speed airborne acoustic impulse motes drifting along the soundwave currents
    const NUM_MOTES = 32
    const motes = Array.from({ length: NUM_MOTES }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 300,
      r: 1 + Math.random() * 2,
      speedX: 1.2 + Math.random() * 2.2,
      speedY: (Math.random() - 0.5) * 0.8,
      alpha: 0.25 + Math.random() * 0.55,
      hue: Math.random() > 0.6 ? '#38d39f' : Math.random() > 0.3 ? '#38bdf8' : '#f59e0b',
    }))

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      // Active, dynamic wave velocity - noticeably faster and more energetic
      phase += dt * 3.4

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      if (w <= 0 || h <= 0) {
        if (active) animId = requestAnimationFrame(render)
        return
      }

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Center elevations: passing directly across the mid-upper region where the hero name is mentioned
      const nameLevelY = h * 0.44
      const horizonY = h * 0.64

      // 1. Broad vocal energy atmospheric radiance centered on the name region
      const voiceGlow = ctx.createRadialGradient(w * 0.35, nameLevelY, 20, w * 0.35, nameLevelY, w * 0.55)
      voiceGlow.addColorStop(0, 'rgba(56, 211, 159, 0.18)')
      voiceGlow.addColorStop(0.45, 'rgba(56, 189, 248, 0.09)')
      voiceGlow.addColorStop(0.8, 'rgba(245, 158, 11, 0.04)')
      voiceGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = voiceGlow
      ctx.fillRect(0, 0, w, h)

      // Dynamic speech phoneme burst cadence
      const speechCadence = 1 + Math.sin(time * 0.0032) * 0.3 + Math.cos(time * 0.0055) * 0.18

      // Subtle background perspective depth grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)'
      ctx.lineWidth = 1
      const NUM_RADIALS = 18
      for (let i = 0; i <= NUM_RADIALS; i++) {
        const xFloor = (w * i) / NUM_RADIALS
        ctx.beginPath()
        ctx.moveTo(w * 0.5, horizonY - 80)
        ctx.lineTo(xFloor, h)
        ctx.stroke()
      }

      // Horizontal depth rings
      for (let i = 1; i <= 6; i++) {
        const y = horizonY + Math.pow(i / 6, 2) * (h - horizonY)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // 4 Active multi-harmonic frequency waves passing across the hero canvas
      const waves = [
        // Wave 1: Primary Vocal Formant (Mint) - travels right across the name region
        {
          yBase: nameLevelY,
          amp: 48 * speechCadence,
          freq: 0.0042,
          speed: 1.35,
          color: 'rgba(56, 211, 159, 0.12)',
          stroke: 'rgba(56, 211, 159, 0.85)',
          strokeWidth: 2.2,
          glowColor: 'rgba(56, 211, 159, 0.65)',
          drawPins: true,
        },
        // Wave 2: Carrier Wave (Sky Blue) - fast counter-oscillation with micro-ripples
        {
          yBase: nameLevelY + 28,
          amp: 36 * speechCadence,
          freq: 0.0068,
          speed: -1.75,
          color: 'rgba(56, 189, 248, 0.09)',
          stroke: 'rgba(56, 189, 248, 0.75)',
          strokeWidth: 1.8,
          glowColor: 'rgba(56, 189, 248, 0.5)',
          drawPins: false,
        },
        // Wave 3: Harmonic Resonance (Warm Amber) - acoustic overtone
        {
          yBase: nameLevelY - 22,
          amp: 32 * speechCadence,
          freq: 0.0034,
          speed: 1.05,
          color: 'rgba(245, 158, 11, 0.06)',
          stroke: 'rgba(245, 158, 11, 0.65)',
          strokeWidth: 1.5,
          glowColor: 'rgba(245, 158, 11, 0.45)',
          drawPins: false,
        },
        // Wave 4: Deep Horizon Bass Swell (Indigo/Purple) - lower grounding wave
        {
          yBase: horizonY + 15,
          amp: 42 * speechCadence,
          freq: 0.0028,
          speed: -0.9,
          color: 'rgba(129, 140, 248, 0.08)',
          stroke: 'rgba(129, 140, 248, 0.55)',
          strokeWidth: 1.4,
          glowColor: 'rgba(129, 140, 248, 0.35)',
          drawPins: false,
        },
      ]

      const stepX = 10

      for (const wave of waves) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, h)

        const wavePoints: { x: number; y: number }[] = []

        for (let x = 0; x <= w + stepX; x += stepX) {
          const wavePhase = phase * wave.speed
          // Multi-harmonic acoustic waveform formula (fundamental + 2nd harmonic + 3rd formant ripple)
          const y =
            wave.yBase +
            Math.sin(x * wave.freq + wavePhase) * wave.amp +
            Math.sin(x * wave.freq * 2.4 - wavePhase * 1.8) * (wave.amp * 0.44) +
            Math.cos(x * wave.freq * 4.6 + wavePhase * 2.8) * (wave.amp * 0.22)

          wavePoints.push({ x, y })
          if (x === 0) ctx.lineTo(0, y)
          else ctx.lineTo(x, y)
        }

        ctx.lineTo(w, h)
        ctx.closePath()

        ctx.fillStyle = wave.color
        ctx.fill()

        // Glowing wave perimeter line
        ctx.shadowBlur = 10
        ctx.shadowColor = wave.glowColor
        ctx.strokeStyle = wave.stroke
        ctx.lineWidth = wave.strokeWidth
        ctx.stroke()
        ctx.restore()

        // Real-time FFT spectrum equalizer pins dancing on the primary voice wave
        if (wave.drawPins) {
          ctx.save()
          ctx.strokeStyle = 'rgba(56, 211, 159, 0.35)'
          ctx.lineWidth = 1
          for (let i = 0; i < wavePoints.length; i += 3) {
            const pt = wavePoints[i]
            const pinHeight = 12 + Math.sin(pt.x * 0.03 + phase * 4) * 8
            ctx.beginPath()
            ctx.moveTo(pt.x, pt.y)
            ctx.lineTo(pt.x, pt.y - pinHeight)
            ctx.stroke()

            // Apex pulse dot
            ctx.fillStyle = '#38d39f'
            ctx.beginPath()
            ctx.arc(pt.x, pt.y - pinHeight, 1.4, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        }
      }

      // Active voice motes drifting rapidly across the soundfield
      for (const m of motes) {
        m.x += m.speedX * (dt * 60)
        m.y += m.speedY * (dt * 60)
        if (m.x > w + 20) m.x = -20
        if (m.y < nameLevelY - 140 || m.y > horizonY + 120) {
          m.y = nameLevelY - 80 + Math.random() * 160
        }

        ctx.save()
        ctx.fillStyle = m.hue
        ctx.globalAlpha = m.alpha
        ctx.shadowBlur = 6
        ctx.shadowColor = m.hue
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (active) {
        animId = requestAnimationFrame(render)
      }
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [active])

  return (
    <div className="audio-wave-horizon">
      <canvas ref={canvasRef} />
    </div>
  )
}
