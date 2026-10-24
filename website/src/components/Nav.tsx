import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { easeOut } from '../lib/motion'
import { scrollToId, scrollToTop } from '../lib/scroll'

const links = [
  { id: 'overview', label: 'About' },
  { id: 'vaani', label: 'Vaani' },
  { id: 'renault', label: 'Renault' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

export function Nav() {
  const barRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState('')

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

  return (
    <motion.nav
      className="nav"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.1, ease: easeOut }}
    >
      <button className="nav-logo" onClick={scrollToTop} aria-label="Back to top">
        SG
      </button>
      <div className="nav-links">
        {links.map((l) => (
          <button key={l.id} className={active === l.id ? 'active' : ''} onClick={() => scrollToId(l.id)}>
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
      <button className="nav-contact" onClick={() => scrollToId('contact')}>
        Contact
      </button>
      <div className="nav-progress" ref={barRef} />
    </motion.nav>
  )
}
