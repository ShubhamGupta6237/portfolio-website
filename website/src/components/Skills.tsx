import { skillGroups } from '../data/profile'
import { Reveal } from './Reveal'

export function Skills() {
  return (
    <section className="skills" id="skills">
      <div className="container">
        <Reveal>
          <div className="kicker">Stack</div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            Lock-free C++
            <br />
            to production agents.
          </h2>
        </Reveal>
        <div className="skill-grid">
          {skillGroups.map((g, i) => (
            <Reveal key={g.name} delay={(i % 3) * 0.09} y={22}>
              <div className="card skill-card">
                <h4>{g.name}</h4>
                <div className="tags" style={{ marginTop: 0 }}>
                  {g.items.map((s) => (
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
