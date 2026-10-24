import type { RenaultStepId } from '../../data/profile'

const body =
  'M 148 292 L 138 248 L 148 198 L 168 148 L 212 118 L 248 110 L 508 104 Q 538 104 556 118 L 628 168 L 718 176 Q 748 180 754 204 L 760 256 L 748 292 L 698 292 L 698 266 Q 694 236 666 232 L 604 232 Q 576 236 572 266 L 572 292 L 328 292 L 328 266 Q 324 236 296 232 L 234 232 Q 206 236 202 266 L 202 292 Z'
const glass = 'M 188 128 L 214 118 L 500 112 Q 524 112 538 124 L 592 166 L 176 170 Z'
const lines = [
  'M 268 116 L 268 170',
  'M 392 114 L 392 284',
  'M 592 172 L 590 230',
  'M 248 170 L 258 232',
  'M 268 282 L 572 282',
  'M 154 198 Q 430 188 742 198',
  'M 220 96 L 492 92',
  'M 236 96 L 236 108',
  'M 476 92 L 476 106',
]
const cladding = [
  'M 562 292 L 562 264 Q 558 224 604 224 L 666 224 Q 708 226 712 264 L 712 292',
  'M 192 292 L 192 264 Q 188 224 234 224 L 296 224 Q 338 226 342 264 L 342 292',
  'M 738 262 L 758 256',
]
const details = [
  'M 438 188 L 462 188',
  'M 300 188 L 324 188',
  'M 580 166 L 598 156 L 606 168',
  'M 746 210 L 754 248',
  'M 736 212 L 743 246',
]
const headlight = ['M 714 186 L 752 194', 'M 732 190 L 740 210']
const taillight = ['M 148 156 L 170 154', 'M 158 155 L 154 176']

function Wheel({ cx }: { cx: number }) {
  return (
    <g className="wheel">
      <circle cx={cx} cy={300} r={52} className="car-line" pathLength={1} />
      <circle cx={cx} cy={300} r={34} className="car-line soft" pathLength={1} />
      {[0, 60, 120].map((a) => {
        const r = (a * Math.PI) / 180
        return (
          <line
            key={a}
            x1={cx - Math.cos(r) * 32}
            y1={300 - Math.sin(r) * 32}
            x2={cx + Math.cos(r) * 32}
            y2={300 + Math.sin(r) * 32}
            className="car-line soft"
            pathLength={1}
          />
        )
      })}
      <circle cx={cx} cy={300} r={6} className="car-line" pathLength={1} />
    </g>
  )
}

function Hotspot({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} className="hotspot-ring" strokeWidth={2} />
      <circle cx={x} cy={y} r={10} className="hotspot-ring" strokeWidth={1} style={{ animationDelay: '0.9s' }} />
      <circle cx={x} cy={y} r={5} className="hotspot-core" />
    </g>
  )
}

export function Duster({ step, drawn }: { step: RenaultStepId; drawn: boolean }) {
  const on = (id: RenaultStepId) => `layer ${step === id ? 'on' : ''}`
  const moving = step === 'adas'

  return (
    <svg
      viewBox="40 0 820 380"
      className={`${drawn ? 'drawn' : ''} ${moving ? 'spinning' : ''}`}
      role="img"
      aria-label="Line drawing of the New Renault Duster with highlighted software components"
    >
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(239,223,0,0.16)" />
          <stop offset="100%" stopColor="rgba(239,223,0,0.02)" />
        </linearGradient>
        <radialGradient id="shadow">
          <stop offset="0%" stopColor="rgba(239,223,0,0.25)" />
          <stop offset="100%" stopColor="rgba(239,223,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx={445} cy={350} rx={340} ry={16} fill="url(#shadow)" />
      <line x1={40} y1={362} x2={860} y2={362} className="lane" />

      <path d={glass} className="car-glass" />
      <path d={body} className="car-line" pathLength={1} />
      <path d={glass} className="car-line soft" pathLength={1} />
      {lines.map((d) => (
        <path key={d} d={d} className="car-line soft" pathLength={1} />
      ))}
      {cladding.map((d) => (
        <path key={d} d={d} className="car-line" pathLength={1} style={{ strokeWidth: 3.5 }} />
      ))}
      {details.map((d) => (
        <path key={d} d={d} className="car-line soft" pathLength={1} />
      ))}
      {headlight.map((d) => (
        <path key={d} d={d} className="car-line white" pathLength={1} style={{ strokeWidth: 3.5 }} />
      ))}
      {taillight.map((d) => (
        <path key={d} d={d} className="car-line" pathLength={1} style={{ stroke: '#f87171', strokeWidth: 3.5 }} />
      ))}
      <Wheel cx={264} />
      <Wheel cx={634} />

      <g className={on('duster')}>
        <text x={445} y={36} textAnchor="middle" className="svg-label" style={{ fontSize: 15 }}>
          NEW DUSTER · connected & in-vehicle apps
        </text>
        <text x={445} y={56} textAnchor="middle" className="svg-label small">
          Kotlin · Java · Jetpack MVVM
        </text>
      </g>

      <g className={on('diag')}>
        <path d="M 548 212 C 590 148 640 78 690 68" className="flow-line" />
        <Hotspot x={548} y={212} />
        <rect x={690} y={38} width={160} height={58} rx={10} fill="rgba(5,6,10,0.85)" stroke="var(--yellow)" />
        <text x={704} y={62} className="svg-label">
          DiagRef Handler
        </text>
        <text x={704} y={82} className="svg-label small">
          diagnostics → REST
        </text>
      </g>

      <g className={on('config')}>
        <path
          d="M 300 34 a 22 22 0 0 1 40 -10 a 18 18 0 0 1 32 8 a 16 16 0 0 1 -4 32 h -64 a 16 16 0 0 1 -4 -30 Z"
          fill="rgba(94,242,255,0.08)"
          stroke="var(--cyan)"
          strokeWidth={1.5}
        />
        <text x={336} y={52} textAnchor="middle" className="svg-label small" style={{ fill: 'var(--cyan)' }}>
          backend
        </text>
        <path d="M 330 108 L 330 70" className="flow-line" />
        <path d="M 348 70 L 348 108" className="flow-line rev" />
        <Hotspot x={339} y={110} />
        <text x={430} y={44} className="svg-label">
          Config Hub Bridge
        </text>
        <text x={430} y={64} className="svg-label small">
          vehicle config sync · SQLite / Room
        </text>
      </g>

      <g className={on('adas')}>
        {[0, 0.5, 1, 1.5].map((d) => (
          <path key={`f${d}`} d="M 772 198 Q 820 234 772 270" className="radar front" style={{ animationDelay: `${d}s` }} />
        ))}
        {[0, 0.5, 1, 1.5].map((d) => (
          <path key={`r${d}`} d="M 128 198 Q 80 234 128 270" className="radar rear" style={{ animationDelay: `${d}s` }} />
        ))}
        <path d="M 576 126 L 700 58 M 576 126 L 720 108" stroke="rgba(239,223,0,0.5)" strokeDasharray="4 4" fill="none" />
        <Hotspot x={576} y={126} />
        <text x={720} y={50} className="svg-label">
          ADAS
        </text>
        <text x={720} y={70} className="svg-label small">
          sensing · driver assistance
        </text>
      </g>

      <g className={on('android')}>
        <path d="M 562 172 C 590 118 616 78 640 60" className="flow-line" />
        <Hotspot x={562} y={172} />
        <g className="screen-ui">
          <rect x={640} y={12} width={200} height={118} rx={12} fill="rgba(5,6,10,0.9)" stroke="var(--yellow)" />
          <rect x={654} y={26} width={70} height={8} rx={4} fill="var(--yellow)" />
          <rect className="bar" x={654} y={44} width={172} height={20} rx={6} />
          <rect className="bar" x={654} y={70} width={82} height={44} rx={6} />
          <rect className="bar" x={744} y={70} width={82} height={44} rx={6} />
          <text x={762} y={34} className="svg-label small">
            MVVM
          </text>
        </g>
      </g>
    </svg>
  )
}
