import { profile } from '../data/profile'
import { scrollToTop } from '../lib/scroll'
import { Reveal } from './Reveal'

const currentYear = new Date().getFullYear()

export function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <Reveal>
          <div className="kicker">Contact</div>
          <h2 className="contact-title">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="contact-links">
            <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a className="btn" href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}>
              {profile.phone}
            </a>
            <a className="btn" href={profile.resume} download>
              Résumé
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card edu">
            <div>
              <div className="kicker">Education</div>
              <h4 style={{ marginTop: 8 }}>Chandigarh University</h4>
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>Bachelor of Engineering, Computer Science</div>
            </div>
            <div className="mono" style={{ color: 'var(--muted)' }}>
              2020 – 2024
            </div>
          </div>
        </Reveal>

        <footer className="footer">
          <span>© {currentYear} Shubham Gupta</span>
          <span>{profile.location}</span>
          <button className="to-top" onClick={scrollToTop}>
            Back to top ↑
          </button>
        </footer>
      </div>
    </section>
  )
}
