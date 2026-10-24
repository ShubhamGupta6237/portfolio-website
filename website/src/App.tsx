import { MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import { Contact } from './components/Contact'
import { Cursor } from './components/Cursor'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { Overview } from './components/Overview'
import { RenaultSection } from './components/renault/RenaultSection'
import { Skills } from './components/Skills'
import { VaaniSection } from './components/vaani/VaaniSection'
import { ScrollTrigger, startSmoothScroll } from './lib/scroll'

export default function App() {
  useEffect(() => {
    const stop = startSmoothScroll()
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return stop
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Overview />
        <VaaniSection />
        <RenaultSection />
        <Skills />
        <Contact />
      </main>
    </MotionConfig>
  )
}
