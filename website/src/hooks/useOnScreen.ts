import { useEffect, useState, type RefObject } from 'react'

export function useOnScreen(ref: RefObject<Element | null>, rootMargin = '80px') {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])

  return on
}
