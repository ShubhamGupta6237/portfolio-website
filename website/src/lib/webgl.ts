export const canvasGl = {
  antialias: false,
  alpha: true,
  powerPreference: 'high-performance' as const,
  stencil: false,
  depth: true,
}

export const canvasDpr: [number, number] = [1, 1.5]

export function isLiteGpu() {
  if (typeof window === 'undefined') return true
  const cores = navigator.hardwareConcurrency || 4
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 4
  return window.innerWidth < 760 || cores <= 4 || lowMemory || Boolean(nav.connection?.saveData)
}
