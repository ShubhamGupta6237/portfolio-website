import { animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { stats, timeline } from '../data/profile'
import { easeOut } from '../lib/motion'
import { Reveal } from './Reveal'

function Counter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, { duration: 1.4, ease: easeOut, onUpdate: (v) => setN(Math.round(v)) })
    return () => controls.stop()
  }, [inView, value])
  return (
    <div className="stat-value" ref={ref}>
      {prefix}
      {n}
      {suffix}
    </div>
  )
}

export function Overview() {
  const tlRef = useRef<HTMLDivElement>(null)
  const tlIn = useInView(tlRef, { once: true, margin: '-20% 0px' })

  return (
    <section className="overview" id="overview">
      <div className="container">
        <div className="overview-grid">
          <Reveal>
            <div className="kicker">About</div>
            <p className="overview-about">
              Founding engineer on the real-time brain of voice agents: a C++20 orchestrator that listens, thinks, and
              speaks back in under <span className="hl">200&nbsp;ms</span>. Before Vaani, connected-vehicle software for
              next-generation <span className="hl-y">Renault Group</span> vehicles.
            </p>
          </Reveal>
          <div className="stats">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={0.12 + i * 0.08} y={22}>
                <div className="stat">
                  <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                  <div className="stat-label">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className={`timeline ${tlIn ? 'in' : ''}`} ref={tlRef}>
          {timeline.map((t, i) => (
            <div key={t.year} className="tl-item" style={{ '--i': i } as React.CSSProperties}>
              <div className="node" />
              <div className="tl-year">{t.year}</div>
              <div className="tl-title">{t.title}</div>
              <div className="tl-org">{t.org}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
