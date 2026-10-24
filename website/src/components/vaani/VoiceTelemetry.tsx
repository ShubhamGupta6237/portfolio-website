import { useEffect, useRef, useState, type RefObject } from 'react'
import type { AgentState } from './useCallSimulation'

type VoiceTelemetryProps = {
  ampRef: RefObject<number>
  state: AgentState
  active: boolean
}

const stateMeta: Record<AgentState, { label: string; color: string; badge: string }> = {
  listening: { label: 'Listening to Caller', color: '#38d39f', badge: 'VAD ACTIVE' },
  thinking: { label: 'Thinking / Turn Resolve', color: '#f59e0b', badge: 'ONNX FUSION' },
  speaking: { label: 'Synthesizing & Streaming', color: '#60a5fa', badge: 'TTS PIPELINE' },
  interrupted: { label: 'Barge-In Detected', color: '#f87171', badge: 'STALE DROPPED' },
}

export function VoiceTelemetry({ ampRef, state, active }: VoiceTelemetryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [vuL, setVuL] = useState(-28)
  const [vuR, setVuR] = useState(-29)
  const meta = stateMeta[state]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let lastTime = performance.now()

    // Spectrum bars: 40 discrete frequency bands
    const NUM_BARS = 38
    const bars = Array.from({ length: NUM_BARS }, () => ({
      val: 0.05,
      target: 0.05,
      peak: 0.05,
      peakTimer: 0,
    }))

    // Waveform history for continuous oscilloscope stream
    const WAVE_POINTS = 80
    const waveHistory = new Float32Array(WAVE_POINTS).fill(0)

    let phase = 0

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time
      phase += dt * (state === 'thinking' ? 6.0 : state === 'speaking' ? 3.5 : 2.0)

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const rawAmp = ampRef.current ?? 0.08
      const curAmp = state === 'interrupted' ? 0.85 : rawAmp

      // Update VU levels
      const dbTarget = Math.max(-48, Math.min(0, 20 * Math.log10(curAmp + 0.001)))
      setVuL((prev) => prev + (dbTarget - prev) * 0.22)
      setVuR((prev) => prev + (dbTarget - 1.5 + Math.sin(phase * 2) * 1.2 - prev) * 0.22)

      // Frequency distribution weights (human speech voice curve 200Hz - 4kHz peaks in middle)
      for (let i = 0; i < NUM_BARS; i++) {
        const norm = i / (NUM_BARS - 1)
        const voiceBell = Math.sin(norm * Math.PI) * 0.85 + 0.15

        let target = 0.05
        if (state === 'speaking') {
          const harmonic =
            Math.sin(norm * 14 + phase) * 0.25 +
            Math.cos(norm * 24 - phase * 1.5) * 0.18 +
            Math.sin(phase * 4 + i) * 0.15
          target = Math.max(0.08, (curAmp * 0.9 + harmonic) * voiceBell)
        } else if (state === 'listening') {
          const jitter = Math.sin(phase * 3 + i * 1.4) * 0.12 + Math.cos(phase * 5 - i * 0.8) * 0.08
          target = Math.max(0.06, (curAmp * 0.7 + jitter) * voiceBell)
        } else if (state === 'thinking') {
          // Sweeping radar scan pulse across spectrum
          const sweep = Math.exp(-Math.pow((norm - (Math.sin(phase) * 0.45 + 0.5)) * 6, 2))
          target = 0.08 + sweep * 0.55
        } else if (state === 'interrupted') {
          target = (0.2 + Math.random() * 0.35) * Math.exp(-norm * 3)
        }

        const b = bars[i]
        b.val += (target - b.val) * (state === 'interrupted' ? 0.35 : 0.2)
        if (b.val > b.peak) {
          b.peak = b.val
          b.peakTimer = 0.4
        } else {
          b.peakTimer -= dt
          if (b.peakTimer <= 0) {
            b.peak = Math.max(b.val, b.peak - dt * 0.6)
          }
        }
      }

      // Update oscilloscope wave
      const newWave =
        state === 'speaking'
          ? Math.sin(phase * 8) * curAmp * 0.6 + Math.sin(phase * 19) * curAmp * 0.3
          : state === 'listening'
            ? Math.sin(phase * 6) * curAmp * 0.4 + (Math.random() - 0.5) * curAmp * 0.15
            : state === 'thinking'
              ? Math.sin(phase * 4) * 0.15
              : (Math.random() - 0.5) * 0.7 // transient burst on cut

      for (let i = 0; i < WAVE_POINTS - 1; i++) {
        waveHistory[i] = waveHistory[i + 1]
      }
      waveHistory[WAVE_POINTS - 1] = newWave

      // --- 1. Draw subtle background grid ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      const gridYCount = 4
      for (let i = 1; i <= gridYCount; i++) {
        const y = (h * i) / (gridYCount + 1)
        ctx.beginPath()
        ctx.moveTo(16, y)
        ctx.lineTo(w - 16, y)
        ctx.stroke()
      }

      // --- 2. Draw Spectrum Bars ---
      const padX = 20
      const barAreaW = w - padX * 2
      const barW = Math.max(3, (barAreaW / NUM_BARS) * 0.72)
      const barGap = (barAreaW - barW * NUM_BARS) / (NUM_BARS - 1)
      const baseFloorY = h - 34

      for (let i = 0; i < NUM_BARS; i++) {
        const b = bars[i]
        const bx = padX + i * (barW + barGap)
        const barH = Math.max(3, b.val * (h * 0.58))
        const by = baseFloorY - barH

        // Modern gradient per state
        const grad = ctx.createLinearGradient(0, by, 0, baseFloorY)
        if (state === 'speaking') {
          grad.addColorStop(0, 'rgba(96, 165, 250, 0.95)') // Crisp blue highlight
          grad.addColorStop(0.5, 'rgba(56, 211, 159, 0.75)') // Mint midtone
          grad.addColorStop(1, 'rgba(56, 211, 159, 0.12)')
        } else if (state === 'listening') {
          grad.addColorStop(0, 'rgba(56, 211, 159, 0.9)')
          grad.addColorStop(0.6, 'rgba(56, 211, 159, 0.4)')
          grad.addColorStop(1, 'rgba(56, 211, 159, 0.08)')
        } else if (state === 'thinking') {
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.9)')
          grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)')
          grad.addColorStop(1, 'rgba(245, 158, 11, 0.08)')
        } else {
          grad.addColorStop(0, 'rgba(248, 113, 113, 0.95)')
          grad.addColorStop(1, 'rgba(248, 113, 113, 0.15)')
        }

        // Rounded bar
        ctx.fillStyle = grad
        ctx.beginPath()
        const rad = Math.min(2, barW / 2)
        ctx.roundRect(bx, by, barW, barH, [rad, rad, 0, 0])
        ctx.fill()

        // Peak line
        const peakY = baseFloorY - Math.max(4, b.peak * (h * 0.58))
        ctx.fillStyle =
          state === 'interrupted'
            ? 'rgba(248, 113, 113, 0.9)'
            : state === 'thinking'
              ? 'rgba(245, 158, 11, 0.9)'
              : 'rgba(255, 255, 255, 0.85)'
        ctx.fillRect(bx, peakY, barW, 1.5)
      }

      // --- 3. Draw Oscilloscope Waveform overlay across center ---
      ctx.beginPath()
      const waveMidY = h * 0.42
      const waveHeight = h * 0.28
      for (let i = 0; i < WAVE_POINTS; i++) {
        const wx = padX + (i / (WAVE_POINTS - 1)) * (w - padX * 2)
        const wy = waveMidY + waveHistory[i] * waveHeight
        if (i === 0) ctx.moveTo(wx, wy)
        else ctx.lineTo(wx, wy)
      }
      ctx.strokeStyle =
        state === 'interrupted'
          ? 'rgba(248, 113, 113, 0.7)'
          : state === 'thinking'
            ? 'rgba(245, 158, 11, 0.4)'
            : 'rgba(255, 255, 255, 0.28)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // --- 4. Frequency axis labels ---
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = '9px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'
      const freqMarkers = [
        { label: '250Hz', norm: 0.12 },
        { label: '1kHz', norm: 0.38 },
        { label: '4kHz', norm: 0.65 },
        { label: '16kHz', norm: 0.9 },
      ]
      for (const m of freqMarkers) {
        const mx = padX + m.norm * (w - padX * 2)
        ctx.fillText(m.label, mx, h - 18)
      }

      ctx.restore()

      if (active) {
        animId = requestAnimationFrame(render)
      }
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [active, state, ampRef])

  return (
    <div className="voice-telemetry">
      {/* Top Telemetry Header */}
      <div className="telemetry-top">
        <div className="telemetry-state" style={{ '--state-color': meta.color } as React.CSSProperties}>
          <span className="telemetry-pip" />
          <span className="telemetry-label">{meta.label}</span>
          <span className="telemetry-badge">{meta.badge}</span>
        </div>

        <div className="telemetry-tech-specs">
          <span className="spec-tag">OPUS 48kHz</span>
          <span className="spec-tag">SPSC STRAND</span>
        </div>
      </div>

      {/* Main Spectrum & Waveform Display */}
      <div className="telemetry-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>

      {/* Bottom Telemetry & Audio Bus Status */}
      <div className="telemetry-bottom">
        <div className="vu-meter-group">
          <div className="vu-channel">
            <span className="vu-label">L</span>
            <div className="vu-track">
              <div
                className="vu-bar"
                style={{
                  width: `${Math.max(0, Math.min(100, ((vuL + 48) / 48) * 100))}%`,
                  background: vuL > -6 ? 'var(--red)' : vuL > -14 ? 'var(--yellow)' : 'var(--cyan)',
                }}
              />
            </div>
          </div>
          <div className="vu-channel">
            <span className="vu-label">R</span>
            <div className="vu-track">
              <div
                className="vu-bar"
                style={{
                  width: `${Math.max(0, Math.min(100, ((vuR + 48) / 48) * 100))}%`,
                  background: vuR > -6 ? 'var(--red)' : vuR > -14 ? 'var(--yellow)' : 'var(--cyan)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="telemetry-metrics">
          <div className="metric-pill">
            <span className="metric-key">V2V LATENCY</span>
            <span className="metric-val">181 ms</span>
          </div>
          <div className="metric-pill">
            <span className="metric-key">JITTER</span>
            <span className="metric-val">0.6 ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}
