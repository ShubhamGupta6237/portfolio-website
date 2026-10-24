import { motion } from 'framer-motion'
import { skillGroups } from '../data/profile'

const all = skillGroups.flatMap((g) => g.items)
const rowA = all.slice(0, Math.ceil(all.length / 2))
const rowB = all.slice(Math.ceil(all.length / 2))

function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className={`marquee ${reverse ? 'reverse' : ''}`}>
      {[0, 1].map((copy) => (
        <div className="marquee-track" key={copy} aria-hidden={copy === 1}>
          {items.map((s) => (
            <span className="marquee-item" key={s}>
              {s}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Skills() {
  return (
    <section className="skills" id="skills">
      <div className="container">
        <div className="kicker">// toolkit</div>
        <h2 className="section-title" style={{ marginTop: 18 }}>
          From lock-free C++
          <br />
          to <span className="grad-vaani">AI agents</span>.
        </h2>
      </div>
      <Marquee items={rowA} />
      <Marquee items={rowB} reverse />
      <div className="container skill-grid">
        {skillGroups.map((g, i) => (
          <motion.div
            key={g.name}
            className="card skill-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ delay: (i % 3) * 0.1, duration: 0.7 }}
          >
            <h4>{g.name}</h4>
            <div className="tags" style={{ marginTop: 0 }}>
              {g.items.map((s) => (
                <span className="tag" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
