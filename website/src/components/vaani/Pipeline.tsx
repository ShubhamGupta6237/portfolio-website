import type { PipeNode } from './useCallSimulation'

const nodes: { id: PipeNode; label: string }[] = [
  { id: 'mic', label: 'Caller' },
  { id: 'stt', label: 'STT' },
  { id: 'turn', label: 'Turn' },
  { id: 'llm', label: 'LLM' },
  { id: 'tts', label: 'TTS' },
  { id: 'out', label: 'Caller' },
]

const W = 640
const NODE_W = 78
const GAP = (W - 20 - NODE_W * nodes.length) / (nodes.length - 1)
const x = (i: number) => 10 + i * (NODE_W + GAP)
const PATH = `M ${x(0) + NODE_W / 2} 30 L ${x(nodes.length - 1) + NODE_W / 2} 30`
const packetColors = ['#c8f04d', '#c8f04d', '#e6b84d', '#efece6', '#8fd67a']

export function Pipeline({ node }: { node: PipeNode }) {
  return (
    <div className="card pipeline">
      <svg viewBox={`0 0 ${W} 60`} role="img" aria-label="Streaming voice pipeline: caller, STT, turn detection, LLM, TTS, caller">
        <path d={PATH} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3 5" />
        {packetColors.map((c, i) => (
          <circle key={i} r="3.2" fill={c} style={{ filter: `drop-shadow(0 0 4px ${c})` }}>
            <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${-i * 0.52}s`} path={PATH} />
          </circle>
        ))}
        {nodes.map((n, i) => (
          <g key={i} className={`pipe-node ${n.id === node ? 'on' : ''}`}>
            <rect x={x(i)} y={14} width={NODE_W} height={32} rx={9} />
            <text x={x(i) + NODE_W / 2} y={34}>
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
