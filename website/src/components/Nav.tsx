import { useEffect, useRef, useState } from 'react'
import { scrollToId } from '../lib/scroll'

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
    const onScroll = () => {
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
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="nav">
      <button
        className="nav-logo"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
      >
        <span className="dot" />
        SG
      </button>
      <div className="nav-links">
        {links.map((l) => (
          <button key={l.id} className={active === l.id ? 'active' : ''} onClick={() => scrollToId(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="nav-progress" ref={barRef} />
    </nav>
  )
}
