import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { profile } from '../data/profile'
import { scrollToId } from '../lib/scroll'
import { Magnetic } from './Magnetic'
import { WaveField } from './WaveField'

function useTypedRoles(roles: string[]) {
  const [text, setText] = useState('')
  useEffect(() => {
    let role = 0
    let i = 0
    let deleting = false
    let id = 0
    const step = () => {
      const full = roles[role]
      if (!deleting) {
        i++
        setText(full.slice(0, i))
        if (i === full.length) {
          deleting = true
          id = window.setTimeout(step, 1600)
          return
        }
      } else {
        i--
        setText(full.slice(0, i))
        if (i === 0) {
          deleting = false
          role = (role + 1) % roles.length
        }
      }
      id = window.setTimeout(step, deleting ? 35 : 70)
    }
    id = window.setTimeout(step, 900)
    return () => window.clearTimeout(id)
  }, [roles])
  return text
}

export function Hero() {
  const typed = useTypedRoles(profile.roles)
  const words = profile.name.split(' ')

  return (
    <header className="hero" id="top">
      <WaveField />
      <div className="container hero-inner">
        <motion.div
          className="hero-status"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="live" />
          Founding Engineer @ Vaani AI Research
        </motion.div>

        <h1 className="hero-name" aria-label={profile.name}>
          {words.map((word, wi) => (
            <span className="word" key={word}>
              {word.split('').map((ch, ci) => (
                <motion.span
                  key={ci}
                  className="char"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.3 + wi * 0.25 + ci * 0.04, duration: 0.9, ease: [0.2, 0.8, 0.1, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>

        <motion.div className="hero-role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <span className="typed">{typed}</span>
          <span className="caret" />
        </motion.div>

        <motion.p
          className="hero-tagline"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          {profile.tagline} Sub-200 ms voice agents in C++20, and before that, software for the New Renault Duster.
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <Magnetic className="btn primary" onClick={() => scrollToId('vaani')}>
            See the work ↓
          </Magnetic>
          <Magnetic href={profile.resume} download>
            Résumé PDF
          </Magnetic>
        </motion.div>
      </div>
      <div className="scroll-cue">
        <span className="line" />
        SCROLL
      </div>
    </header>
  )
}
