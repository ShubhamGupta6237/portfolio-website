import { useEffect, useRef } from 'react'

/** setInterval that only runs while `active` is true and always calls the latest callback. */
export function useInterval(callback: () => void, ms: number, active: boolean) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => saved.current(), ms)
    return () => window.clearInterval(id)
  }, [ms, active])
}
