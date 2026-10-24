import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { easeOut } from '../lib/motion'

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}

/** Fades and lifts content in once it enters the viewport. Transform and opacity only, so it stays on the compositor. */
export function Reveal({ children, delay = 0, y = 26, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}
