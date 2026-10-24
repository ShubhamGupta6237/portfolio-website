import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { VaaniStepId } from '../../data/profile'
import { useInterval } from '../../hooks/useInterval'

function PanelShell({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <>
      <div className="panel-head">
        <span>{title}</span>
        {badge && <span className="badge">{badge}</span>}
      </div>
      <div className="panel-body">{children}</div>
    </>
  )
}

/* 01 — overlapping streams */
const streams = [
  { label: 'mic audio', start: 0, w: 62, color: 'rgba(255,255,255,0.35)' },
  { label: 'stt interim', start: 4, w: 56, color: '#c8f04d' },
  { label: 'turn detect', start: 24, w: 10, color: '#e6b84d' },
  { label: 'llm tokens', start: 28, w: 42, color: '#d4c4a0' },
  { label: 'tts audio', start: 32, w: 46, color: '#efece6' },
  { label: 'playback', start: 36, w: 52, color: '#4ade80' },
]

function StreamsPanel() {
  return (
    <PanelShell title="streaming cascade · stages overlap in time" badge="< 200 ms">
      <div className="streams">
        {streams.map((s) => (
          <div className="stream-row" key={s.label}>
            <span>{s.label}</span>
            <div className="stream-track">
              <div
                className="stream-bar"
                style={
                  {
                    '--start': `${s.start}%`,
                    '--w': `${s.w}%`,
                    '--delay': `${s.start * 0.028}s`,
                    background: s.color,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        ))}
        <div className="stream-marker">
          <span>first audio out</span>
        </div>
      </div>
    </PanelShell>
  )
}

/* 02 — vendor failover */
const vendorCols = [
  { name: '7 STT', kind: 'STT', items: ['Deepgram', 'Sarvam', 'AssemblyAI', 'Speechmatics', 'Soniox'] },
  { name: '6 LLM', kind: 'LLM', items: ['Gemini', 'OpenAI', 'Azure OpenAI', 'Groq', 'Gemma · vLLM'] },
  { name: '8 TTS', kind: 'TTS', items: ['Cartesia', 'ElevenLabs', 'Sarvam', 'Deepgram Aura', 'AWS Polly'] },
]

function FailoverPanel() {
  const [active, setActive] = useState([0, 0, 0])
  const [down, setDown] = useState<(number | null)[]>([null, null, null])
  const [log, setLog] = useState('all routers healthy')
  const col = useRef(0)

  useInterval(
    () => {
      const c = col.current
      col.current = (c + 1) % 3
      const cur = active[c]
      const next = (cur + 1) % vendorCols[c].items.length
      setDown((d) => d.map((v, i) => (i === c ? cur : v)))
      setActive((a) => a.map((v, i) => (i === c ? next : v)))
      const from = vendorCols[c].items[cur]
      const to = vendorCols[c].items[next]
      const action = c === 0 ? 'replaying buffered PCM' : c === 1 ? 're-routing token stream' : 'resuming synthesis'
      setLog(`${vendorCols[c].kind}: ${from} ✕ → ${to} ✓ ${action}`)
      window.setTimeout(() => setDown((d) => d.map((v, i) => (i === c ? null : v))), 1500)
    },
    2400,
    true,
  )

  return (
    <PanelShell title="router failover · 21 vendors" badge="0 dropped calls">
      <div className="vendors">
        {vendorCols.map((c, ci) => (
          <div className="vendor-col" key={c.name}>
            <h5>{c.name}</h5>
            {c.items.map((v, vi) => (
              <div key={v} className={`vendor ${active[ci] === vi ? 'active' : ''} ${down[ci] === vi ? 'down' : ''}`}>
                <span>{v}</span>
                <span>{active[ci] === vi ? '●' : down[ci] === vi ? '✕' : ''}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <motion.div key={log} className="failover-log" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        › {log}
      </motion.div>
    </PanelShell>
  )
}

/* 03 — barge-in with generation IDs */
function BargeInPanel() {
  const [tick, setTick] = useState(0)
  const [gen, setGen] = useState(41)
  const [dropped, setDropped] = useState(0)
  const phase = tick % 18
  const chunkCount = Math.min(phase, 11)
  const stale = phase >= 12 && phase < 15

  useInterval(
    () => {
      setTick((t) => t + 1)
      if (phase === 14) {
        setGen((g) => g + 1)
        setDropped(chunkCount)
      }
    },
    260,
    true,
  )

  return (
    <PanelShell title="barge-in · stale audio dropped by generation id" badge="instant">
      <div className="barge">
        <div className="gen-row">
          generation <span className="gen-id">#{gen}</span>
          <span style={{ marginLeft: 'auto' }}>dropped last turn: {dropped} chunks</span>
        </div>
        <div className="chunks">
          {phase < 15 &&
            Array.from({ length: chunkCount }, (_, i) => <div key={`${gen}-${i}`} className={`chunk ${stale ? 'stale' : ''}`} />)}
        </div>
        <div className={`interrupt-flash ${stale ? 'on' : ''}`}>⚡ caller started speaking → bump generation, flush TTS queue</div>
      </div>
    </PanelShell>
  )
}

/* 04 — multimodal turn detection */
const utterance = "so I'd like to move it to Friday".split(' ')

function TurnPanel() {
  const [t, setT] = useState(0)
  useInterval(() => setT((v) => (v + 0.05) % 5), 50, true)

  const text = t < 3 ? Math.min(0.85, 0.12 + 0.24 * t + 0.04 * Math.sin(t * 7)) : 0.85
  const audio = t < 2.6 ? 0.1 + 0.05 * Math.abs(Math.sin(t * 9)) : Math.min(0.92, 0.1 + (t - 2.6) * 0.75)
  const fused = 0.6 * text + 0.4 * audio
  const committed = fused >= 0.65
  const shown = utterance.slice(0, Math.min(utterance.length, Math.floor(t * 3)))

  const meters = [
    { label: 'text EOU · 0.6', value: text, fill: '#5ef2ff' },
    { label: 'smart-turn · 0.4', value: audio, fill: '#8b5cf6' },
    { label: 'fused score', value: fused, fill: committed ? '#4ade80' : '#ffb020' },
  ]

  return (
    <PanelShell title="multimodal end-of-turn · threshold 0.65" badge="ONNX">
      <div className="turn">
        <div className="mono" style={{ fontSize: 13, color: 'var(--text)', minHeight: 20 }}>
          “{shown.join(' ')}
          {t > 2.6 ? '”' : '…'}
        </div>
        {meters.map((m) => (
          <div className="meter" key={m.label}>
            <span>{m.label}</span>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${m.value * 100}%`, background: m.fill }} />
              {m.label === 'fused score' && <div className="meter-threshold" />}
            </div>
            <span>{m.value.toFixed(2)}</span>
          </div>
        ))}
        <div className={`turn-commit ${committed ? 'on' : ''}`}>
          {committed ? '✓ commit utterance → fire LLM' : '… waiting: caller may still be talking'}
        </div>
      </div>
    </PanelShell>
  )
}

/* 05 — lock-free ring buffer */
const SEGMENTS = 24
const arc = (i: number) => {
  const seg = (Math.PI * 2) / SEGMENTS
  const a0 = i * seg + 0.03 - Math.PI / 2
  const a1 = (i + 1) * seg - 0.03 - Math.PI / 2
  const r = 80
  return `M ${100 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${100 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)}`
}

function HotPathPanel() {
  const [w, setW] = useState(6)
  const [r, setR] = useState(0)
  const [frames, setFrames] = useState(0)

  useInterval(
    () => {
      setW((v) => (v + 1) % SEGMENTS)
      setR((v) => {
        const lag = (w - v + SEGMENTS) % SEGMENTS
        return lag > 3 + Math.random() * 5 ? (v + 1 + (Math.random() > 0.6 ? 1 : 0)) % SEGMENTS : v
      })
      setFrames((f) => f + 1)
    },
    110,
    true,
  )

  const filled = (i: number) => {
    const span = (w - r + SEGMENTS) % SEGMENTS
    const off = (i - r + SEGMENTS) % SEGMENTS
    return off < span
  }

  return (
    <PanelShell title="audio strand · lock-free SPSC ring buffer" badge="ASan · TSan clean">
      <div className="hotpath">
        <svg viewBox="0 0 200 200">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <path key={i} d={arc(i)} className={`ring-seg ${filled(i) ? 'filled' : ''} ${i === w ? 'write' : ''} ${i === r ? 'read' : ''}`} />
          ))}
          <text x="100" y="96" textAnchor="middle" className="svg-label" style={{ fill: 'var(--text)' }}>
            PCM
          </text>
          <text x="100" y="114" textAnchor="middle" className="svg-label small">
            producer → consumer
          </text>
        </svg>
        <div className="counters">
          <div>
            <b className="zero">0</b>heap allocations on hot path
          </div>
          <div>
            <b className="zero">0</b>mutex locks
          </div>
          <div>
            <b>{frames.toLocaleString()}</b>audio frames processed
          </div>
        </div>
      </div>
    </PanelShell>
  )
}

/* 06 — plugin architecture */
const pluginItems = [
  { label: 'call_recording', x: 20, y: 18 },
  { label: 'persona_memory', x: 80, y: 18 },
  { label: 'audio_analysis', x: 14, y: 52 },
  { label: '12 session watchers', x: 86, y: 52 },
  { label: '15+ LLM tools', x: 24, y: 88 },
  { label: 'plugin.so · dlopen', x: 76, y: 88 },
]

function PluginsPanel() {
  return (
    <PanelShell title="plugin host · ABI-stable contract" badge="CI-enforced">
      <div className="plugins">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {pluginItems.map((p, i) => (
            <motion.line
              key={p.label}
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke="rgba(94,242,255,0.35)"
              strokeWidth="0.4"
              strokeDasharray="1.5 1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {pluginItems.map((p, i) => (
          <motion.div
            key={p.label}
            className="plugin"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ opacity: 0, scale: 0.4, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            transition={{ delay: 0.4 + i * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
          >
            {p.label}
          </motion.div>
        ))}
        <div className="core">
          VoicePipeline
          <small>core diff: 0 lines</small>
        </div>
      </div>
    </PanelShell>
  )
}

/* 07 — Kubernetes scale */
const podSeq = [2, 3, 5, 8, 8, 6, 4, 2]

function ScalePanel() {
  const [i, setI] = useState(0)
  const count = podSeq[i % podSeq.length]
  const prev = podSeq[(i - 1 + podSeq.length) % podSeq.length]
  const draining = Math.max(0, prev - count)
  useInterval(() => setI((v) => v + 1), 1500, true)

  return (
    <PanelShell title="agent server on kubernetes · hpa" badge="zero-downtime">
      <div className="scale">
        <div className="pods">
          {Array.from({ length: count + draining }, (_, p) => {
            const isDraining = p >= count
            const load = isDraining ? 1 : 2 + ((p * 7 + i * 3) % 4)
            return (
              <motion.div
                key={p}
                layout
                className={`pod ${isDraining ? 'draining' : ''}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {isDraining ? 'draining · 300 s' : `pod-${p + 1}`}
                <div className="bars">
                  {Array.from({ length: 6 }, (_, b) => (
                    <i key={b} className={b < load ? 'on' : ''} />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
        <div className="scale-meta">
          {['HPA', 'Redis session slots', 'pooled vendor sockets', 'OpenTelemetry', 'Prometheus /metrics'].map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}

/* 08 — AI-native knowledge graph */
const hubs = ['VoicePipeline', 'AgentServer', 'AsyncToolExecutor', 'AssemblyAiStt', 'IErrorHandler']

function GraphPanel() {
  const ref = useRef<HTMLCanvasElement>(null)
  const seed = useMemo(() => Math.random(), [])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const hubPos = hubs.map((_, i) => {
      const a = (i / hubs.length) * Math.PI * 2 + seed
      return { x: 0.3 + Math.cos(a) * (i === 0 ? 0 : 0.19), y: 0.52 + Math.sin(a) * (i === 0 ? 0 : 0.32) }
    })
    const nodes = Array.from({ length: 90 }, (_, i) => {
      const hub = i % hubs.length
      const a = Math.random() * Math.PI * 2
      const d = 0.05 + Math.random() * (hub === 0 ? 0.2 : 0.12)
      return { hub, ox: Math.cos(a) * d, oy: Math.sin(a) * d * 1.2, ph: Math.random() * 6 }
    })
    let raf = 0
    const draw = (t: number) => {
      const time = t * 0.001
      ctx.clearRect(0, 0, w, h)
      const pts = nodes.map((n) => {
        const hp = hubPos[n.hub]
        return {
          x: (hp.x + n.ox + Math.sin(time * 0.6 + n.ph) * 0.008) * w,
          y: (hp.y + n.oy + Math.cos(time * 0.5 + n.ph) * 0.01) * h,
          hub: n.hub,
        }
      })
      ctx.lineWidth = 0.6
      for (let i = 0; i < pts.length; i++) {
        const hp = hubPos[pts[i].hub]
        ctx.strokeStyle = 'rgba(94,242,255,0.12)'
        ctx.beginPath()
        ctx.moveTo(pts[i].x, pts[i].y)
        ctx.lineTo(hp.x * w, hp.y * h)
        ctx.stroke()
      }
      for (let i = 1; i < hubPos.length; i++) {
        const pulse = (time * 0.5 + i * 0.2) % 1
        ctx.strokeStyle = 'rgba(139,92,246,0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(hubPos[0].x * w, hubPos[0].y * h)
        ctx.lineTo(hubPos[i].x * w, hubPos[i].y * h)
        ctx.stroke()
        ctx.fillStyle = '#f472b6'
        ctx.beginPath()
        ctx.arc(
          (hubPos[0].x + (hubPos[i].x - hubPos[0].x) * pulse) * w,
          (hubPos[0].y + (hubPos[i].y - hubPos[0].y) * pulse) * h,
          2.2,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
      for (const p of pts) {
        ctx.fillStyle = 'rgba(94,242,255,0.7)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.font = '11px JetBrains Mono, monospace'
      hubPos.forEach((hp, i) => {
        ctx.fillStyle = i === 0 ? '#8b5cf6' : '#5ef2ff'
        ctx.beginPath()
        ctx.arc(hp.x * w, hp.y * h, i === 0 ? 7 : 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#eef0f6'
        ctx.fillText(hubs[i], hp.x * w + 9, hp.y * h - 8)
      })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [seed])

  return (
    <PanelShell title="codebase knowledge graph · 30K+ nodes" badge="agent-ready">
      <div className="graph">
        <canvas ref={ref} />
        <div className="graph-files">
          {['AGENTS.md', 'skills/adding-a-new-capability', 'skills/architectural-audit', 'rules/production-cpp'].map((f, i) => (
            <motion.span
              key={f}
              className="tag"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
            >
              {f}
            </motion.span>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}

export function VaaniPanel({ id }: { id: VaaniStepId }) {
  switch (id) {
    case 'engine':
      return <StreamsPanel />
    case 'failover':
      return <FailoverPanel />
    case 'human':
      return <BargeInPanel />
    case 'turn':
      return <TurnPanel />
    case 'hotpath':
      return <HotPathPanel />
    case 'plugins':
      return <PluginsPanel />
    case 'scale':
      return <ScalePanel />
    case 'ainative':
      return <GraphPanel />
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}
