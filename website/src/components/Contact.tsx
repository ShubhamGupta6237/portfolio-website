import { motion } from 'framer-motion'
import { profile } from '../data/profile'
import { Magnetic } from './Magnetic'

export function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="kicker">// contact</div>
        <motion.h2
          className="contact-title"
          style={{ marginTop: 18 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.2, 0.7, 0.1, 1] }}
        >
          Let&apos;s build something
          <br />
          that <span className="grad-vaani">talks back.</span>
        </motion.h2>

        <div className="contact-links">
          <Magnetic className="btn primary" href={`mailto:${profile.email}`}>
            {profile.email}
          </Magnetic>
          <Magnetic href={profile.linkedin} external>
            LinkedIn ↗
          </Magnetic>
          <Magnetic href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}>{profile.phone}</Magnetic>
          <Magnetic href={profile.resume} download>
            Résumé PDF ↓
          </Magnetic>
        </div>

        <motion.div
          className="card edu"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <div className="kicker">education</div>
            <h4 style={{ marginTop: 8 }}>Chandigarh University</h4>
            <div style={{ color: 'var(--muted)', marginTop: 4 }}>Bachelor of Engineering, Computer Science</div>
          </div>
          <div className="mono" style={{ color: 'var(--muted)' }}>
            2020 – 2024
          </div>
        </motion.div>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Shubham Gupta</span>
          <span>{profile.location}</span>
          <span>Built with React, GSAP, Three.js</span>
        </footer>
      </div>
    </section>
  )
}
