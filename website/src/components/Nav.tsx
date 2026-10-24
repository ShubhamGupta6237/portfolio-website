import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import { easeOut } from '../lib/motion'
import { scrollToId, scrollToTop } from '../lib/scroll'

const links = [
  { id: 'overview', num: '01', label: 'About' },
  { id: 'vaani', num: '02', label: 'Vaani AI' },
  { id: 'renault', num: '03', label: 'Renault Group' },
  { id: 'skills', num: '04', label: 'Skills' },
  { id: 'contact', num: '05', label: 'Contact' },
]

export function Nav() {
  const barRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      barRef.current?.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0))
      const mid = window.innerHeight * 0.4
      let current = ''
      for (const { id } of links) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= mid) current = id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuOpen(false)
      }
      window.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleNavClick = (id: string) => {
    setMenuOpen(false)
    scrollToId(id)
  }

  const handleLogoClick = () => {
    setMenuOpen(false)
    scrollToTop()
  }

  return (
    <>
      <motion.nav
        className="nav"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1, ease: easeOut }}
      >
        <button className="nav-logo" onClick={handleLogoClick} aria-label="Back to top">
          SG
        </button>

        <div className="nav-links">
          {links.map((l) => (
            <button key={l.id} className={active === l.id ? 'active' : ''} onClick={() => handleNavClick(l.id)}>
              {active === l.id && (
                <motion.span
                  className="nav-pill"
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-actions">
          <button className="nav-contact" onClick={() => handleNavClick('contact')}>
            Contact
          </button>

          <button
            className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            <span className="ham-line top" />
            <span className="ham-line mid" />
            <span className="ham-line bot" />
          </button>
        </div>

        <div className="nav-progress" ref={barRef} />
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              className="mobile-menu-drawer"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-menu-header">
                <div className="mobile-status-badge">
                  <span className="live-dot" />
                  <span>Founding Engineer · Real-Time Voice AI</span>
                </div>
              </div>

              <div className="mobile-menu-links">
                {links.map((l, i) => (
                  <motion.button
                    key={l.id}
                    className={`mobile-link-item ${active === l.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(l.id)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                  >
                    <span className="mobile-link-num">{l.num}</span>
                    <span className="mobile-link-title">{l.label}</span>
                    {active === l.id && <span className="mobile-link-dot" />}
                  </motion.button>
                ))}
              </div>

              <div className="mobile-menu-footer">
                <a className="btn primary mobile-resume-btn" href={profile.resume} download>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Résumé</span>
                </a>
                <div className="mobile-socials">
                  <a href={`mailto:${profile.email}`} className="mobile-social-link">
                    {profile.email}
                  </a>
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="mobile-social-link">
                    LinkedIn ↗
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
