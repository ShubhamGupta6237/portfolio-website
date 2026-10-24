import { motion, useMotionValue, useSpring } from 'framer-motion'
import type { PointerEvent, ReactNode } from 'react'

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  download?: boolean
  external?: boolean
}

/** Button/link that leans toward the cursor while hovered. */
export function Magnetic({ children, href, onClick, className = 'btn', download, external }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 15 })
  const sy = useSpring(y, { stiffness: 220, damping: 15 })

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.3)
    y.set((e.clientY - r.top - r.height / 2) * 0.4)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  if (href) {
    return (
      <motion.a
        href={href}
        className={className}
        style={{ x: sx, y: sy }}
        onPointerMove={onMove}
        onPointerLeave={reset}
        download={download}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
      >
        {children}
      </motion.a>
    )
  }
  return (
    <motion.button className={className} style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset} onClick={onClick}>
      {children}
    </motion.button>
  )
}
