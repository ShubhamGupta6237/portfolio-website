import { animate, motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { stats, timeline } from '../data/profile'

function Counter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, { duration: 1.8, ease: [0.2, 0.7, 0.1, 1], onUpdate: (v) => setN(Math.round(v)) })
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.7, 0.1, 1] as const } },
}

export function Overview() {
  const tlRef = useRef<HTMLDivElement>(null)
  const tlIn = useInView(tlRef, { once: true, margin: '-20% 0px' })

  return (
    <section className="overview" id="overview">
      <div className="container">
        <div className="overview-grid">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-15% 0px' }}>
            <div className="kicker">// brief overview</div>
            <p className="overview-about">
              I&apos;m a <span className="hl">founding engineer</span> building the real-time brain of voice AI agents:
              the C++20 engine that listens, thinks, and speaks back in under <span className="hl">200 ms</span>. Before
              that, I shipped connected-vehicle software for the <span className="hl-y">New Renault Duster</span>.
            </p>
          </motion.div>
          <div className="stats">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="stat"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
              >
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={`timeline ${tlIn ? 'in' : ''}`} ref={tlRef}>
          {timeline.map((t, i) => (
            <motion.div
              key={t.year}
              className="tl-item"
              initial={{ opacity: 0, y: 20 }}
              animate={tlIn ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.25, duration: 0.7 }}
            >
              <div className="node" />
              <div className="tl-year">{t.year}</div>
              <div className="tl-title">{t.title}</div>
              <div className="tl-org">{t.org}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
