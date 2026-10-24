import { useEffect, useRef } from 'react'
import type { RenaultStepId } from '../../data/profile'

type DynamicDuster2DProps = {
  step: RenaultStepId
  active: boolean
  speed: number
  boosted: boolean
  driveMode?: 'eco' | 'auto' | 'sport'
}

export function DynamicDuster2D({
  step,
  active,
  speed,
  boosted,
  driveMode = 'auto',
}: DynamicDuster2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({ step, speed, boosted, driveMode, active })
  useEffect(() => {
    propsRef.current = { step, speed, boosted, driveMode, active }
  }, [step, speed, boosted, driveMode, active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let lastTime = performance.now()
    let wheelAngle = 0
    let roadOffset = 0
    let scanPos = 0
    let scanDir = 1
    let radarRadius = 0
    let otaWave = 0
    let energyPhase = 0

    // Particle wind streamlines
    const NUM_STREAMS = 36
    const streams = Array.from({ length: NUM_STREAMS }, () => ({
      x: Math.random() * 850,
      y: 40 + Math.random() * 165,
      len: 25 + Math.random() * 55,
      speed: 1.1 + Math.random() * 0.9,
      alpha: 0.15 + Math.random() * 0.5,
      thickness: 0.8 + Math.random() * 1.4,
    }))

    // Dust motes in headlight cone
    const NUM_DUST = 18
    const dustParticles = Array.from({ length: NUM_DUST }, () => ({
      x: 240 + Math.random() * 220,
      y: -80 + Math.random() * 90,
      r: 0.8 + Math.random() * 1.5,
      vx: -(1.5 + Math.random() * 2),
      vy: (Math.random() - 0.5) * 0.8,
      alpha: 0.2 + Math.random() * 0.6,
    }))

    // Parallax skyline: three depth layers of deterministic buildings that loop seamlessly
    const SKY_PERIOD = 1400
    const buildSkyline = (seed: number, minW: number, maxW: number, minH: number, maxH: number) => {
      let s = seed
      const rnd = () => {
        s = (s * 16807) % 2147483647
        return s / 2147483647
      }
      const out: { x: number; w: number; h: number; lit: number[] }[] = []
      let x = 0
      while (x < SKY_PERIOD) {
        const bw = minW + rnd() * (maxW - minW)
        const bh = minH + rnd() * (maxH - minH)
        const lit = Array.from({ length: 6 }, () => rnd())
        out.push({ x, w: Math.min(bw, SKY_PERIOD - x), h: bh, lit })
        x += bw + 4 + rnd() * 14
      }
      return out
    }
    const skyLayers = [
      { speed: 0.06, color: 'rgba(46, 64, 90, 0.85)', b: buildSkyline(11, 40, 96, 120, 210), windows: true },
      { speed: 0.16, color: 'rgba(22, 32, 48, 0.95)', b: buildSkyline(23, 28, 68, 70, 130), windows: true },
    ]
    let skyOffset = 0
    let lampOffset = 0

    const render = (time: number) => {
      animId = requestAnimationFrame(render)
      if (!propsRef.current.active) {
        lastTime = time
        return
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      if (w <= 0 || h <= 0) return

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }

      // Explicitly set DPR transformation matrix (immune to stack imbalance)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const currentProps = propsRef.current
      const curSpeed = currentProps.speed
      const isBoosted = currentProps.boosted
      const curDriveMode = currentProps.driveMode
      const curStep = currentProps.step

      const driveSpeedFactor = Math.max(0.4, (curSpeed / 85) * (isBoosted ? 1.35 : 1))

      // Matched to the agent telemetry cadence (~2–3× the previous cruise rates)
      wheelAngle += dt * 7.4 * driveSpeedFactor
      roadOffset = (roadOffset + dt * 190 * driveSpeedFactor) % 80
      scanPos += dt * 0.62 * scanDir
      if (scanPos > 1) {
        scanPos = 1
        scanDir = -1
      } else if (scanPos < 0) {
        scanPos = 0
        scanDir = 1
      }
      radarRadius = (radarRadius + dt * 0.9) % 1
      otaWave = (otaWave + dt * 0.95) % 1
      energyPhase = (energyPhase + dt * 1.2) % 1

      // Chassis suspension float & pitch physics (gentle organic cruise)
      const tSec = time * 0.001
      const floatY = Math.sin(tSec * 2.2 * driveSpeedFactor) * 1.1 + Math.cos(tSec * 1.3) * 0.6
      const floatPitch =
        Math.sin(tSec * 1.6 * driveSpeedFactor) * 0.002 + (isBoosted ? -0.008 : 0)

      // --- 0. ENVIRONMENT: night sky, parallax skyline, passing street lamps ---
      const roadY = h - 48
      const accent =
        curDriveMode === 'sport' || isBoosted ? '245, 158, 11' : curDriveMode === 'eco' ? '52, 211, 153' : '56, 189, 248'

      const sky = ctx.createLinearGradient(0, 0, 0, roadY + 20)
      sky.addColorStop(0, 'rgba(6, 9, 14, 0)')
      sky.addColorStop(0.7, `rgba(${accent}, 0.05)`)
      sky.addColorStop(1, `rgba(${accent}, 0.16)`)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, roadY + 20)

      skyOffset += dt * 190 * driveSpeedFactor
      lampOffset += dt * 190 * driveSpeedFactor
      const horizonY = roadY + 14
      for (const layer of skyLayers) {
        const off = (skyOffset * layer.speed) % SKY_PERIOD
        ctx.fillStyle = layer.color
        for (const b of layer.b) {
          const px = ((b.x - off) % SKY_PERIOD + SKY_PERIOD) % SKY_PERIOD - 120
          if (px > w + 10 || px + b.w < -10) continue
          ctx.fillRect(px, horizonY - b.h, b.w, b.h)
          if (layer.windows) {
            ctx.fillStyle = `rgba(${accent}, 0.55)`
            for (let i = 0; i < b.lit.length; i++) {
              if (b.lit[i] > 0.55) {
                ctx.fillRect(px + 5 + (i % 3) * 11, horizonY - b.h + 8 + Math.floor(i / 3) * 14, 3, 3)
              }
            }
            ctx.fillStyle = layer.color
          }
        }
      }

      const LAMP_GAP = 360
      const lampShift = (lampOffset * 0.92) % LAMP_GAP
      for (let x = -lampShift - LAMP_GAP; x < w + LAMP_GAP; x += LAMP_GAP) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, roadY + 18)
        ctx.lineTo(x, roadY - 128)
        ctx.lineTo(x + 20, roadY - 134)
        ctx.stroke()
        const lamp = ctx.createRadialGradient(x + 22, roadY - 132, 0, x + 22, roadY - 132, 44)
        lamp.addColorStop(0, 'rgba(255, 244, 214, 0.55)')
        lamp.addColorStop(1, 'rgba(255, 244, 214, 0)')
        ctx.fillStyle = lamp
        ctx.fillRect(x - 24, roadY - 178, 92, 92)
        const pool = ctx.createLinearGradient(x + 22, roadY - 130, x + 22, roadY + 20)
        pool.addColorStop(0, 'rgba(255, 244, 214, 0.1)')
        pool.addColorStop(1, 'rgba(255, 244, 214, 0)')
        ctx.fillStyle = pool
        ctx.beginPath()
        ctx.moveTo(x + 20, roadY - 130)
        ctx.lineTo(x - 22, roadY + 20)
        ctx.lineTo(x + 66, roadY + 20)
        ctx.closePath()
        ctx.fill()
      }

      // --- 1. ROAD & HIGH-SPEED ASPHALT ---

      // Background ambient highway glow
      const roadGrad = ctx.createLinearGradient(0, roadY - 50, 0, h)
      roadGrad.addColorStop(0, 'rgba(15, 20, 28, 0)')
      roadGrad.addColorStop(0.4, 'rgba(16, 22, 32, 0.7)')
      roadGrad.addColorStop(1, 'rgba(8, 10, 14, 0.98)')
      ctx.fillStyle = roadGrad
      ctx.fillRect(0, roadY - 50, w, h - (roadY - 50))

      // Ground reference line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(0, roadY + 20)
      ctx.lineTo(w, roadY + 20)
      ctx.stroke()

      // Moving road dashes (Amber highway center line)
      const dashColor = isBoosted ? 'rgba(245, 158, 11, 0.75)' : 'rgba(245, 158, 11, 0.45)'
      ctx.strokeStyle = dashColor
      ctx.lineWidth = isBoosted ? 3 : 2.5
      ctx.beginPath()
      for (let x = -roadOffset; x < w + 80; x += 80) {
        ctx.moveTo(x, roadY + 20)
        ctx.lineTo(x + 40, roadY + 20)
      }
      ctx.stroke()

      // Fast ground speed blur streaks
      const blurColor =
        curDriveMode === 'eco'
          ? 'rgba(56, 211, 159, 0.28)'
          : isBoosted
            ? 'rgba(245, 158, 11, 0.35)'
            : 'rgba(56, 211, 159, 0.2)'
      ctx.strokeStyle = blurColor
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = -((roadOffset * 2.6) % 110); x < w + 110; x += 110) {
        ctx.moveTo(x, roadY + 34)
        ctx.lineTo(x + 58, roadY + 34)
      }
      ctx.stroke()

      // Shoulder ticks so ground speed reads immediately
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
      for (let x = -((roadOffset * 1.6) % 56); x < w + 56; x += 56) {
        ctx.fillRect(x, roadY + 40, 10, 2)
      }

      // Soft vehicle contact shadow
      ctx.save()
      const shadowGrad = ctx.createRadialGradient(
        w * 0.46,
        roadY + 16,
        25,
        w * 0.46,
        roadY + 16,
        260
      )
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)')
      shadowGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.6)')
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = shadowGrad
      ctx.beginPath()
      ctx.ellipse(w * 0.46, roadY + 16, 260, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Underglow bleeding onto the asphalt, tinted by drive mode
      const glowX = w * 0.46
      const glow = ctx.createRadialGradient(glowX, roadY + 22, 10, glowX, roadY + 22, 230)
      glow.addColorStop(0, `rgba(${accent}, ${isBoosted ? 0.4 : 0.26})`)
      glow.addColorStop(1, `rgba(${accent}, 0)`)
      ctx.save()
      ctx.translate(glowX, roadY + 22)
      ctx.scale(1, 0.1)
      ctx.translate(-glowX, -(roadY + 22))
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(glowX, roadY + 22, 230, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // --- 2. AERODYNAMIC AIRFLOW STREAMLINES (flat alpha strokes, no per-line gradients) ---
      const strColor = isBoosted ? '245, 158, 11' : '56, 211, 159'
      for (const st of streams) {
        st.x -= dt * 230 * st.speed * driveSpeedFactor
        if (st.x < -80) {
          st.x = w + 40 + Math.random() * 100
          st.y = 40 + Math.random() * 165
        }
        const stretch = st.len * (isBoosted ? 1.6 : 1)
        ctx.strokeStyle = `rgba(${strColor}, ${st.alpha * 0.28})`
        ctx.lineWidth = st.thickness
        ctx.beginPath()
        ctx.moveTo(st.x, st.y)
        ctx.lineTo(st.x + stretch, st.y)
        ctx.stroke()
        ctx.strokeStyle = `rgba(${strColor}, ${st.alpha})`
        ctx.beginPath()
        ctx.moveTo(st.x + stretch * 0.55, st.y)
        ctx.lineTo(st.x + stretch, st.y)
        ctx.stroke()
      }

      // --- 3. CAR CONTAINER WITH SUSPENSION DYNAMICS ---
      ctx.save()
      const isNarrow = w < 580
      const carScale = isNarrow
        ? Math.min(0.7, Math.max(0.36, (w - 24) / 600))
        : Math.min(1.02, Math.max(0.65, w / 660))
      const carCenterX = isNarrow ? w * 0.42 : w * 0.46
      const carBaseY = roadY + 20 + floatY

      ctx.translate(carCenterX, carBaseY)
      ctx.scale(carScale, carScale)
      ctx.rotate(floatPitch)

      // Car local dimensions
      const WHEEL_RADIUS = 34
      const WHEEL_REAR_X = -135
      const WHEEL_FRONT_X = 135
      const WHEEL_Y = -WHEEL_RADIUS

      // --- 3A. HEADLIGHT VOLUMETRIC CONE ---
      ctx.save()
      const lightGrad = ctx.createRadialGradient(240, -56, 12, 490, -25, 270)
      lightGrad.addColorStop(0, 'rgba(255, 255, 245, 0.55)')
      lightGrad.addColorStop(0.25, 'rgba(56, 211, 159, 0.28)')
      lightGrad.addColorStop(1, 'rgba(56, 211, 159, 0)')
      ctx.fillStyle = lightGrad
      ctx.beginPath()
      ctx.moveTo(234, -64)
      ctx.lineTo(470, -100)
      ctx.lineTo(490, 16)
      ctx.lineTo(234, -46)
      ctx.closePath()
      ctx.fill()

      // Dust motes floating in light cone
      for (const d of dustParticles) {
        d.x += d.vx * driveSpeedFactor
        d.y += d.vy
        if (d.x < 240) {
          d.x = 450 + Math.random() * 40
          d.y = -70 + Math.random() * 75
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.8})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // --- 3B. REAR TAILLIGHT TRAIL ---
      ctx.save()
      const tailGrad = ctx.createLinearGradient(-235, -55, -350, -55)
      tailGrad.addColorStop(0, 'rgba(239, 68, 68, 0.75)')
      tailGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.25)')
      tailGrad.addColorStop(1, 'rgba(239, 68, 68, 0)')
      ctx.fillStyle = tailGrad
      ctx.fillRect(-350, -62, 115, 14)
      ctx.restore()

      // --- 3C. CAR BODYWORK (NEW RENAULT DUSTER 2D SIDE PROFILE) ---
      // Underbody dark structural channel
      ctx.fillStyle = '#0b0e14'
      ctx.beginPath()
      ctx.moveTo(-220, -22)
      ctx.lineTo(220, -22)
      ctx.lineTo(220, -10)
      ctx.lineTo(-220, -10)
      ctx.closePath()
      ctx.fill()

      // Main Duster Muscular Body Shell
      ctx.beginPath()
      // Rear bumper & tailgate
      ctx.moveTo(-228, -20)
      ctx.lineTo(-234, -48)
      ctx.lineTo(-230, -78) // rear light corner
      ctx.lineTo(-224, -92) // rear window base
      ctx.lineTo(-172, -140) // C-pillar & roof spoiler
      ctx.lineTo(-160, -143)
      ctx.lineTo(40, -143) // Roofline with roof rack
      ctx.lineTo(135, -94) // Windshield rake to A-pillar base
      ctx.lineTo(175, -88) // Hood forward sweep
      ctx.lineTo(228, -78) // Front headlight brow
      ctx.lineTo(236, -60) // Front grille / bumper nose
      ctx.lineTo(234, -36) // Lower front skid plate
      ctx.lineTo(224, -20) // Front air dam

      // Wheel arches cutouts
      // Front arch
      ctx.lineTo(WHEEL_FRONT_X + 46, -20)
      ctx.arc(WHEEL_FRONT_X, WHEEL_Y, WHEEL_RADIUS + 12, 0, Math.PI, true)
      ctx.lineTo(WHEEL_FRONT_X - 46, -20)

      // Rocker panel
      ctx.lineTo(WHEEL_REAR_X + 46, -20)

      // Rear arch
      ctx.arc(WHEEL_REAR_X, WHEEL_Y, WHEEL_RADIUS + 12, 0, Math.PI, true)
      ctx.lineTo(WHEEL_REAR_X - 46, -20)
      ctx.lineTo(-228, -20)
      ctx.closePath()

      // Metallic body paint gradient (Khaki / Titanium with gloss highlight)
      const bodyGrad = ctx.createLinearGradient(0, -150, 0, -20)
      bodyGrad.addColorStop(0, '#38423a') // Top roof highlight
      bodyGrad.addColorStop(0.3, '#242b26') // Shoulder line
      bodyGrad.addColorStop(0.7, '#191e1a') // Body mid
      bodyGrad.addColorStop(1, '#0e1210') // Lower rocker
      ctx.fillStyle = bodyGrad
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1.6
      ctx.stroke()

      // Moving paint glint sweeping across the roof/shoulder
      const glintX = -150 + ((time * 0.06) % 520) * 0.6
      if (glintX < 60) {
        const glint = ctx.createLinearGradient(glintX - 20, 0, glintX + 26, 0)
        glint.addColorStop(0, 'rgba(255, 255, 255, 0)')
        glint.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)')
        glint.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = glint
        ctx.beginPath()
        ctx.moveTo(glintX, -141)
        ctx.lineTo(glintX + 28, -141)
        ctx.lineTo(glintX + 4, -84)
        ctx.lineTo(glintX - 24, -84)
        ctx.closePath()
        ctx.fill()
      }

      // Body accent swage lines (Chiseled Duster creases)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(-160, -82)
      ctx.lineTo(155, -82) // shoulder crease
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-150, -42)
      ctx.lineTo(140, -42) // lower door crease
      ctx.stroke()

      // Front & Rear Satin Silver Skid Plates
      ctx.fillStyle = '#6b7280'
      ctx.beginPath()
      ctx.roundRect(210, -32, 24, 12, 3)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(-230, -32, 22, 12, 3)
      ctx.fill()

      // Robust Wheel Arch Cladding (New Duster signature square cladding)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.fillStyle = 'rgba(12, 15, 18, 0.9)'
      ctx.lineWidth = 1.2
      // Front cladding
      ctx.beginPath()
      ctx.arc(WHEEL_FRONT_X, WHEEL_Y, WHEEL_RADIUS + 12, 0, Math.PI, true)
      ctx.arc(WHEEL_FRONT_X, WHEEL_Y, WHEEL_RADIUS + 16, Math.PI, 0, false)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Rear cladding
      ctx.beginPath()
      ctx.arc(WHEEL_REAR_X, WHEEL_Y, WHEEL_RADIUS + 12, 0, Math.PI, true)
      ctx.arc(WHEEL_REAR_X, WHEEL_Y, WHEEL_RADIUS + 16, Math.PI, 0, false)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Modular Roof Rails (Duster signature)
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(-125, -149, 145, 4)
      ctx.fillRect(-115, -146, 8, 4)
      ctx.fillRect(10, -146, 8, 4)

      // Greenhouse / Windows (Dark tinted with subtle cyan tint)
      ctx.beginPath()
      ctx.moveTo(-160, -92)
      ctx.lineTo(-155, -137)
      ctx.lineTo(34, -137)
      ctx.lineTo(124, -92)
      ctx.closePath()
      const glassGrad = ctx.createLinearGradient(0, -140, 0, -90)
      glassGrad.addColorStop(0, 'rgba(56, 211, 159, 0.32)')
      glassGrad.addColorStop(0.4, 'rgba(16, 24, 32, 0.85)')
      glassGrad.addColorStop(1, 'rgba(10, 14, 20, 0.96)')
      ctx.fillStyle = glassGrad
      ctx.fill()
      ctx.strokeStyle = 'rgba(56, 211, 159, 0.45)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // Window Pillars (B-pillar, C-pillar)
      ctx.fillStyle = '#0a0d12'
      ctx.fillRect(-35, -137, 10, 45) // B pillar
      ctx.fillRect(-115, -137, 8, 45) // Quarter pillar

      // Side mirror
      ctx.fillStyle = '#1c221d'
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(108, -98, 22, 12, [3, 6, 6, 2])
      ctx.fill()
      ctx.stroke()

      // Headlight LED cluster (New Duster signature Y-shape DRL)
      ctx.fillStyle = '#fff'
      ctx.shadowColor = '#38d39f'
      ctx.shadowBlur = 12
      ctx.fillRect(226, -72, 8, 10)
      ctx.strokeStyle = '#38d39f'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.moveTo(222, -74)
      ctx.lineTo(232, -68)
      ctx.lineTo(222, -62)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Taillight LED (C/Y-shape)
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 10
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2.6
      ctx.beginPath()
      ctx.moveTo(-228, -78)
      ctx.lineTo(-234, -72)
      ctx.lineTo(-228, -66)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Door handles
      ctx.fillStyle = '#2d352e'
      ctx.fillRect(45, -78, 16, 4) // Front door handle
      ctx.fillRect(-85, -102, 10, 12) // Hidden C-pillar rear handle

      // --- 3D. HIGH-TECH STEP MODES ANIMATION (Overlaid on Car) ---

      // STEP 1: VEHICLE PLATFORM & CRUISE
      if (curStep === 'duster') {
        ctx.save()
        const rail = [
          { x: 180, y: -50 },
          { x: -40, y: -32 },
          { x: -135, y: -34 },
        ]
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.lineDashOffset = -time * 0.055
        ctx.beginPath()
        ctx.moveTo(rail[0].x, rail[0].y)
        ctx.lineTo(rail[1].x, rail[1].y)
        ctx.lineTo(rail[2].x, rail[2].y)
        ctx.stroke()
        ctx.setLineDash([])

        for (let i = 0; i < 3; i++) {
          const t = (energyPhase + i / 3) % 1
          const seg = t < 0.55 ? 0 : 1
          const local = seg === 0 ? t / 0.55 : (t - 0.55) / 0.45
          const a = rail[seg]
          const b = rail[seg + 1]
          const px = a.x + (b.x - a.x) * local
          const py = a.y + (b.y - a.y) * local
          ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#38d39f'
          ctx.beginPath()
          ctx.arc(px, py, 3.2, 0, Math.PI * 2)
          ctx.fill()
        }

        const beaconPulse = 0.5 + Math.sin(time * 0.007) * 0.5
        ctx.fillStyle = `rgba(56, 211, 159, ${beaconPulse * 0.28})`
        ctx.beginPath()
        ctx.arc(30, -90, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#38d39f'
        ctx.beginPath()
        ctx.arc(30, -90, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
        ctx.font = '8px "IBM Plex Mono", monospace'
        ctx.fillText('DIGITAL COCKPIT 10.1"', 42, -92)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'
        ctx.fillText(`${curSpeed} KM/H · 5G LIVE`, 42, -80)
        ctx.restore()
      }

      // STEP 2: X-RAY DIAGNOSTIC SCANNER
      if (curStep === 'diag') {
        const scanX = -210 + scanPos * 430
        ctx.save()
        const laserGrad = ctx.createLinearGradient(scanX, -150, scanX, -10)
        laserGrad.addColorStop(0, 'rgba(56, 211, 159, 0)')
        laserGrad.addColorStop(0.5, 'rgba(56, 211, 159, 0.95)')
        laserGrad.addColorStop(1, 'rgba(56, 211, 159, 0)')
        ctx.strokeStyle = laserGrad
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(scanX, -150)
        ctx.lineTo(scanX, -10)
        ctx.stroke()

        ctx.fillStyle = 'rgba(56, 211, 159, 0.08)'
        ctx.fillRect(scanX - 18, -150, 36, 140)
        ctx.fillStyle = 'rgba(56, 211, 159, 0.05)'
        ctx.fillRect(-210, -150, scanX + 210, 140)

        ctx.strokeStyle = 'rgba(56, 211, 159, 0.7)'
        ctx.lineWidth = 1.4
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = -time * 0.05
        ctx.beginPath()
        ctx.moveTo(180, -60)
        ctx.lineTo(30, -70)
        ctx.lineTo(-60, -35)
        ctx.lineTo(-190, -60)
        ctx.stroke()
        ctx.setLineDash([])

        const canPoints = [
          { x: 180, y: -60 },
          { x: 30, y: -70 },
          { x: -60, y: -35 },
          { x: -190, y: -60 },
        ]
        const packetOffsets = [0, 0.38, 0.72]
        for (let i = 0; i < packetOffsets.length; i++) {
          const packetPhase = (time * 0.0017 + packetOffsets[i]) % 1
          const segIdx = Math.min(2, Math.floor(packetPhase * 3))
          const segT = (packetPhase * 3) % 1
          const a = canPoints[segIdx]
          const b = canPoints[segIdx + 1]
          const pX = a.x + (b.x - a.x) * segT
          const pY = a.y + (b.y - a.y) * segT
          ctx.fillStyle = i === 1 ? '#38d39f' : '#f59e0b'
          ctx.beginPath()
          ctx.arc(pX, pY, 3.4, 0, Math.PI * 2)
          ctx.fill()
        }

        const nodes = [
          { x: 180, y: -60, label: 'ECU_POWERTRAIN' },
          { x: 30, y: -70, label: 'IVI_GATEWAY' },
          { x: -60, y: -35, label: 'BMS_48V' },
          { x: -190, y: -60, label: 'CAN_TERMINATOR' },
        ]
        for (const n of nodes) {
          const hot = Math.abs(scanX - n.x) < 22
          ctx.fillStyle = hot ? '#f59e0b' : '#38d39f'
          ctx.beginPath()
          ctx.arc(n.x, n.y, hot ? 5 : 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 1.2
          ctx.stroke()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
          ctx.font = '8px "IBM Plex Mono", monospace'
          ctx.fillText(n.label, n.x - 24, n.y - 8)
        }

        ctx.fillStyle = 'rgba(56, 211, 159, 0.9)'
        ctx.font = '8px "IBM Plex Mono", monospace'
        ctx.fillText(`UDS SCAN  ${Math.round(scanPos * 100)}%`, scanX - 28, -156)
        ctx.restore()
      }

      if (curStep === 'config') {
        ctx.save()

        const cloudX = 10
        const cloudY = -180
        const setX = -55
        const setY = -92
        const hubX = 85
        const hubY = -70

        // 1. Sleek Overhead Vector Cloud Element (Single continuous path - zero overlapping stroke artifacts)
        ctx.save()
        ctx.translate(cloudX, cloudY)

        // Ambient Cloud Glow
        const cGlow = ctx.createRadialGradient(0, -15, 6, 0, -15, 60)
        cGlow.addColorStop(0, 'rgba(96, 165, 250, 0.35)')
        cGlow.addColorStop(0.55, 'rgba(59, 130, 246, 0.1)')
        cGlow.addColorStop(1, 'rgba(59, 130, 246, 0)')
        ctx.fillStyle = cGlow
        ctx.beginPath()
        ctx.arc(0, -15, 60, 0, Math.PI * 2)
        ctx.fill()

        // Continuous Vector Cloud Silhouette
        const cloudPath = new Path2D(
          'M -28 10 ' +
          'C -38 10, -42 2, -42 -5 ' +
          'C -42 -13, -36 -19, -28 -20 ' +
          'C -27 -32, -16 -40, -4 -40 ' +
          'C 10 -40, 20 -31, 23 -19 ' +
          'C 32 -18, 38 -10, 38 -2 ' +
          'C 38 7, 30 10, 22 10 ' +
          'Z'
        )

        // Vector Cloud Body Fill & Glowing Stroke
        ctx.fillStyle = 'rgba(10, 16, 28, 0.94)'
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.9)'
        ctx.lineWidth = 1.8
        ctx.shadowBlur = 14
        ctx.shadowColor = 'rgba(96, 165, 250, 0.7)'

        ctx.fill(cloudPath)
        ctx.stroke(cloudPath)

        // Cloud Security Badge inside body
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(96, 165, 250, 0.12)'
        ctx.fillRect(-18, -16, 36, 13)
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)'
        ctx.lineWidth = 0.9
        ctx.strokeRect(-18, -16, 36, 13)

        ctx.fillStyle = '#60a5fa'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('TLS 1.3', 0, -6.8)

        ctx.restore()

        // Clean Cloud Header Labels (No emojis)
        ctx.fillStyle = '#93c5fd'
        ctx.font = '8px "IBM Plex Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('FLEET CONFIG CLOUD', cloudX, cloudY - 48)
        ctx.fillStyle = '#38d39f'
        ctx.font = '7px "IBM Plex Mono", monospace'
        ctx.fillText('● REMOTE SERVICE [ACTIVE]', cloudX, cloudY - 37)
        ctx.textAlign = 'left'

        // 2. Settings Node in Cabin
        ctx.save()
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'
        ctx.beginPath()
        ctx.arc(setX, setY, 14, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(setX, setY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('VEHICLE SETTINGS', setX - 44, setY + 18)
        ctx.restore()

        // 3. Config Hub Gateway Node in IVI Dashboard
        ctx.save()
        ctx.fillStyle = 'rgba(56, 211, 159, 0.25)'
        ctx.beginPath()
        ctx.arc(hubX, hubY, 14, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#38d39f'
        ctx.beginPath()
        ctx.arc(hubX, hubY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('CONFIG HUB GATEWAY', hubX - 25, hubY + 18)
        ctx.restore()

        // 4. Connecting Curved Data Paths
        // Path A: Settings -> Cloud (Enters clean at bottom-left of cloud)
        ctx.save()
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'
        ctx.lineWidth = 1.4
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = -time * 0.05
        ctx.beginPath()
        ctx.moveTo(setX, setY)
        ctx.quadraticCurveTo(setX - 10, -150, cloudX - 28, cloudY + 10)
        ctx.stroke()

        // Path B: Cloud -> Config Hub (Exits clean from bottom-right of cloud)
        ctx.strokeStyle = 'rgba(56, 211, 159, 0.55)'
        ctx.beginPath()
        ctx.moveTo(cloudX + 22, cloudY + 10)
        ctx.quadraticCurveTo(hubX + 10, -145, hubX, hubY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        const cloudPulse = 18 + otaWave * 28
        ctx.strokeStyle = `rgba(96, 165, 250, ${0.45 - otaWave * 0.35})`
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(cloudX, cloudY - 12, cloudPulse, 0, Math.PI * 2)
        ctx.stroke()

        const drawBezPacket = (t: number, ax: number, ay: number, cx: number, cy: number, bx: number, by: number, color: string) => {
          const inv = 1 - t
          const px = inv * inv * ax + 2 * inv * t * cx + t * t * bx
          const py = inv * inv * ay + 2 * inv * t * cy + t * t * by
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(px, py, 3.6, 0, Math.PI * 2)
          ctx.fill()
        }

        drawBezPacket((time * 0.00095) % 1, setX, setY, setX - 10, -150, cloudX - 28, cloudY + 10, '#f59e0b')
        drawBezPacket((time * 0.00095 + 0.5) % 1, setX, setY, setX - 10, -150, cloudX - 28, cloudY + 10, '#fbbf24')
        drawBezPacket((time * 0.00095 + 0.18) % 1, cloudX + 22, cloudY + 10, hubX + 10, -145, hubX, hubY, '#38d39f')
        drawBezPacket((time * 0.00095 + 0.68) % 1, cloudX + 22, cloudY + 10, hubX + 10, -145, hubX, hubY, '#6ee7b7')

        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
        ctx.font = '8px "IBM Plex Mono", monospace'
        ctx.fillText('SYNC: SETTINGS ➔ CLOUD ➔ CONFIG HUB', -90, -145)
        ctx.fillStyle = '#60a5fa'
        ctx.fillText('PUSH / ACK  4.2KB', 78, -168)

        ctx.restore()
      }

      // STEP 4: ADAS RADAR & SENSOR FIELD
      if (curStep === 'adas') {
        ctx.save()
        const camX = 120
        const camY = -118
        const radarX = 236
        const radarY = -50

        for (let i = 0; i < 4; i++) {
          const rad = 28 + ((radarRadius + i * 0.25) % 1) * 95
          const alpha = 1 - (rad - 28) / 95
          ctx.strokeStyle = `rgba(56, 211, 159, ${alpha * 0.82})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(radarX, radarY, rad, -Math.PI * 0.28, Math.PI * 0.28)
          ctx.stroke()
        }

        ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 7])
        ctx.lineDashOffset = -time * 0.06
        ctx.beginPath()
        ctx.moveTo(150, -22)
        ctx.lineTo(318, 4)
        ctx.moveTo(150, -78)
        ctx.lineTo(318, -98)
        ctx.stroke()
        ctx.setLineDash([])

        const camGrad = ctx.createLinearGradient(camX, camY, camX + 150, camY)
        camGrad.addColorStop(0, 'rgba(96, 165, 250, 0.42)')
        camGrad.addColorStop(1, 'rgba(96, 165, 250, 0)')
        ctx.fillStyle = camGrad
        ctx.beginPath()
        ctx.moveTo(camX, camY)
        ctx.lineTo(camX + 160, camY - 38)
        ctx.lineTo(camX + 160, camY + 46)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#60a5fa'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('CAM', camX - 4, camY - 8)
        ctx.fillStyle = '#38d39f'
        ctx.fillText('RADAR', radarX - 18, radarY + 18)

        const leadBob = Math.sin(time * 0.004) * 3
        const targetX = 250 + leadBob
        const targetY = -52
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1.8
        ctx.strokeRect(targetX - 14, targetY - 12, 28, 22)
        ctx.fillStyle = '#f59e0b'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('LEAD', targetX - 10, targetY - 16)

        ctx.fillStyle = 'rgba(8, 12, 16, 0.72)'
        ctx.fillRect(-8, -132, 92, 28)
        ctx.strokeStyle = 'rgba(56, 211, 159, 0.45)'
        ctx.lineWidth = 1
        ctx.strokeRect(-8, -132, 92, 28)
        ctx.fillStyle = '#38d39f'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('LEAD  34.2 m', -2, -120)
        ctx.fillStyle = '#f59e0b'
        ctx.fillText('TTC   3.2 s', -2, -109)

        const sideX = 210
        const sideY = 6
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)'
        ctx.strokeRect(sideX - 11, sideY - 9, 22, 16)
        ctx.fillStyle = 'rgba(96, 165, 250, 0.9)'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('LANE 12.4m', sideX - 22, sideY + 20)
        ctx.restore()
      }

      // STEP 5: PERFORMANCE ENERGY REGENERATION GLOW
      if (curStep === 'android') {
        ctx.save()
        const regenAlpha = 0.45 + Math.sin(time * 0.018) * 0.35
        ctx.strokeStyle = `rgba(56, 211, 159, ${regenAlpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(WHEEL_FRONT_X, WHEEL_Y, WHEEL_RADIUS + 7, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(WHEEL_REAR_X, WHEEL_Y, WHEEL_RADIUS + 7, 0, Math.PI * 2)
        ctx.stroke()

        const pCount = 5
        for (let i = 0; i < pCount; i++) {
          const pT = (energyPhase + i / pCount) % 1
          const fx = WHEEL_FRONT_X + (-40 - WHEEL_FRONT_X) * pT
          const fy = WHEEL_Y + (-34 - WHEEL_Y) * pT
          const rx = WHEEL_REAR_X + (-40 - WHEEL_REAR_X) * pT
          const ry = WHEEL_Y + (-34 - WHEEL_Y) * pT
          ctx.fillStyle = '#38d39f'
          ctx.beginPath()
          ctx.arc(fx, fy, 2.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#f59e0b'
          ctx.beginPath()
          ctx.arc(rx, ry, 2.3, 0, Math.PI * 2)
          ctx.fill()
        }

        const soc = 0.55 + Math.sin(time * 0.003) * 0.12
        ctx.fillStyle = 'rgba(12, 16, 20, 0.85)'
        ctx.fillRect(-70, -32, 90, 8)
        ctx.fillStyle = 'rgba(56, 211, 159, 0.85)'
        ctx.fillRect(-70, -32, 90 * soc, 8)
        ctx.strokeStyle = '#38d39f'
        ctx.lineWidth = 1
        ctx.strokeRect(-70, -32, 90, 8)
        ctx.fillStyle = '#38d39f'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('48V HYBRID TRACTION BATTERY', -68, -36)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText(`${Math.round(soc * 100)}% SOC  ·  REGEN ${isBoosted ? 'OFF' : 'ON'}`, -68, -20)
        ctx.restore()
      }

      // --- 3E. WHEELS (ALLOY RIMS WITH ROTATING SPOKES) ---
      const drawWheel = (wx: number, wy: number) => {
        ctx.save()
        ctx.translate(wx, wy)

        // Outer Tire (Rubber with tire tread grooves)
        ctx.fillStyle = '#0c0f14'
        ctx.beginPath()
        ctx.arc(0, 0, WHEEL_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Disc brake behind wheel
        ctx.fillStyle = '#1e242c'
        ctx.beginPath()
        ctx.arc(0, 0, WHEEL_RADIUS - 8, 0, Math.PI * 2)
        ctx.fill()

        // Brake Caliper (Performance Gold/Amber)
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(WHEEL_RADIUS - 16, -12, 8, 18)

        // Rim Outer Lip (Burnished Silver)
        ctx.strokeStyle = '#9ca3af'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, WHEEL_RADIUS - 6, 0, Math.PI * 2)
        ctx.stroke()

        // Rotating Spokes Assembly
        ctx.rotate(wheelAngle)

        const SPOKE_COUNT = 5
        for (let i = 0; i < SPOKE_COUNT; i++) {
          ctx.rotate((Math.PI * 2) / SPOKE_COUNT)
          // Y-spoke alloy pattern of New Duster
          ctx.strokeStyle = '#e5e7eb'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -(WHEEL_RADIUS - 7))
          ctx.stroke()

          // Secondary blade
          ctx.strokeStyle = '#4b5563'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(0, -(WHEEL_RADIUS * 0.45))
          ctx.lineTo(6, -(WHEEL_RADIUS - 8))
          ctx.stroke()
        }

        // Center Wheel Hub with aerodynamic turbine cap
        ctx.fillStyle = '#111827'
        ctx.beginPath()
        ctx.arc(0, 0, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.restore()
      }

      drawWheel(WHEEL_REAR_X, WHEEL_Y)
      drawWheel(WHEEL_FRONT_X, WHEEL_Y)

      ctx.restore() // restore car container
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, []) // Persistent animation loop: props are accessed reactively via propsRef

  return (
    <div className="dynamic-car-canvas-wrap">
      <canvas ref={canvasRef} className="duster-canvas" />

      {/* Dynamic Mode HUD Callout Watermark */}
      <div className="mode-watermark">
        {step === 'duster' && <span>CONNECTED DRIVE & TELEMETRY</span>}
        {step === 'diag' && <span>X-RAY DIAGNOSTICS SCANNER [LIVE CAN BUS]</span>}
        {step === 'config' && <span>CLOUD CONFIG HUB [SETTINGS ⇄ CLOUD ⇄ GATEWAY]</span>}
        {step === 'adas' && <span>ADAS COMPUTER VISION [RUST/OPENCV 60FPS]</span>}
        {step === 'android' && <span>ARCHITECTURE & ZERO-JANK 60FPS</span>}
      </div>
    </div>
  )
}
