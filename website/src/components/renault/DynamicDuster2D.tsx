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
  speed,
  boosted,
  driveMode = 'auto',
}: DynamicDuster2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({ step, speed, boosted, driveMode })
  useEffect(() => {
    propsRef.current = { step, speed, boosted, driveMode }
  }, [step, speed, boosted, driveMode])

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

    const render = (time: number) => {
      animId = requestAnimationFrame(render)

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

      // Physics animation updates (calm, smooth, modern rates)
      wheelAngle += dt * 4.2 * driveSpeedFactor
      roadOffset = (roadOffset + dt * 105 * driveSpeedFactor) % 80
      scanPos += dt * 0.2 * scanDir
      if (scanPos > 1) {
        scanPos = 1
        scanDir = -1
      } else if (scanPos < 0) {
        scanPos = 0
        scanDir = 1
      }
      radarRadius = (radarRadius + dt * 0.32) % 1
      otaWave = (otaWave + dt * 0.35) % 1
      energyPhase = (energyPhase + dt * 0.45) % 1

      // Chassis suspension float & pitch physics (gentle organic cruise)
      const tSec = time * 0.001
      const floatY = Math.sin(tSec * 2.2 * driveSpeedFactor) * 1.1 + Math.cos(tSec * 1.3) * 0.6
      const floatPitch =
        Math.sin(tSec * 1.6 * driveSpeedFactor) * 0.002 + (isBoosted ? -0.008 : 0)

      // --- 1. ROAD & HIGH-SPEED ASPHALT ---
      const roadY = h - 48

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

      // --- 2. AERODYNAMIC AIRFLOW STREAMLINES ---
      for (const st of streams) {
        st.x -= dt * 130 * st.speed * driveSpeedFactor
        if (st.x < -80) {
          st.x = w + 40 + Math.random() * 100
          st.y = 40 + Math.random() * 165
        }

        const strGrad = ctx.createLinearGradient(st.x, st.y, st.x + st.len, st.y)
        const strColor = isBoosted ? '245, 158, 11' : curDriveMode === 'eco' ? '56, 211, 159' : '56, 211, 159'
        strGrad.addColorStop(0, `rgba(${strColor}, 0)`)
        strGrad.addColorStop(0.5, `rgba(${strColor}, ${st.alpha * 0.65})`)
        strGrad.addColorStop(1, `rgba(${strColor}, ${st.alpha})`)

        ctx.strokeStyle = strGrad
        ctx.lineWidth = st.thickness
        ctx.beginPath()
        ctx.moveTo(st.x, st.y)
        ctx.lineTo(st.x + st.len, st.y)
        ctx.stroke()
      }

      // --- 3. CAR CONTAINER WITH SUSPENSION DYNAMICS ---
      ctx.save()
      const carScale = Math.min(1.02, Math.max(0.68, w / 660))
      const carCenterX = w * 0.46
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
        // Powertrain energy distribution line (calm, subtle pulse)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.lineDashOffset = -time * 0.02
        ctx.beginPath()
        ctx.moveTo(180, -50) // Front motor
        ctx.lineTo(-40, -32) // Battery pack
        ctx.lineTo(-135, -34) // Rear e-axle
        ctx.stroke()
        ctx.setLineDash([])

        // Cabin IVI pulse beacon
        const beaconPulse = 0.5 + Math.sin(time * 0.0025) * 0.5
        ctx.fillStyle = `rgba(56, 211, 159, ${beaconPulse * 0.25})`
        ctx.beginPath()
        ctx.arc(30, -90, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#38d39f'
        ctx.beginPath()
        ctx.arc(30, -90, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.font = '8px "IBM Plex Mono", monospace'
        ctx.fillText('DIGITAL COCKPIT 10.1"', 42, -92)
        ctx.restore()
      }

      // STEP 2: X-RAY DIAGNOSTIC SCANNER
      if (curStep === 'diag') {
        const scanX = -210 + scanPos * 430
        ctx.save()
        // Vertical scanning laser beam
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

        // Scanning laser glow ripple
        ctx.fillStyle = 'rgba(56, 211, 159, 0.07)'
        ctx.fillRect(scanX - 16, -150, 32, 140)

        // Internal CAN Bus wiring harness
        ctx.strokeStyle = 'rgba(56, 211, 159, 0.7)'
        ctx.lineWidth = 1.4
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = -time * 0.015
        ctx.beginPath()
        ctx.moveTo(180, -60) // Engine ECU
        ctx.lineTo(30, -70) // Central IVI
        ctx.lineTo(-60, -35) // Battery BMS
        ctx.lineTo(-190, -60) // Rear telematics
        ctx.stroke()
        ctx.setLineDash([])

        // Animated CAN data packets moving calmly along backbone
        const packetPhase = (time * 0.0006) % 1
        const canPoints = [
          { x: 180, y: -60 },
          { x: 30, y: -70 },
          { x: -60, y: -35 },
          { x: -190, y: -60 },
        ]
        const segIdx = Math.floor(packetPhase * 3)
        const segT = (packetPhase * 3) % 1
        const p1 = canPoints[segIdx]
        const p2 = canPoints[segIdx + 1]
        const pX = p1.x + (p2.x - p1.x) * segT
        const pY = p1.y + (p2.y - p1.y) * segT

        ctx.fillStyle = '#f59e0b'
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(pX, pY, 3.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Glowing ECU nodes
        const nodes = [
          { x: 180, y: -60, label: 'ECU_POWERTRAIN' },
          { x: 30, y: -70, label: 'IVI_GATEWAY' },
          { x: -60, y: -35, label: 'BMS_48V' },
          { x: -190, y: -60, label: 'CAN_TERMINATOR' },
        ]
        for (const n of nodes) {
          ctx.fillStyle = '#38d39f'
          ctx.beginPath()
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 1.2
          ctx.stroke()

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
          ctx.font = '8px "IBM Plex Mono", monospace'
          ctx.fillText(n.label, n.x - 24, n.y - 8)
        }
        ctx.restore()
      }

      // STEP 3: CLOUD CONFIG HUB (SETTINGS ➔ CLOUD ➔ CONFIG HUB)
      // STEP 3: CLOUD CONFIG HUB (SETTINGS ➔ CLOUD ➔ CONFIG HUB)
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
        ctx.lineDashOffset = -time * 0.015
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

        // 5. Calm Data Packets traveling along bezier curves
        // Packet 1: Settings -> Cloud (Slow, gentle ~3.5s per cycle)
        const tUp = (time * 0.00035) % 1
        const invTUp = 1 - tUp
        const p1x = invTUp * invTUp * setX + 2 * invTUp * tUp * (setX - 10) + tUp * tUp * (cloudX - 28)
        const p1y = invTUp * invTUp * setY + 2 * invTUp * tUp * -150 + tUp * tUp * (cloudY + 10)

        ctx.fillStyle = '#f59e0b'
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p1x, p1y, 3.8, 0, Math.PI * 2)
        ctx.fill()

        // Packet 2: Cloud -> Config Hub (Out-of-phase by 0.5)
        const tDown = (time * 0.00035 + 0.5) % 1
        const invTDown = 1 - tDown
        const p2x = invTDown * invTDown * (cloudX + 22) + 2 * invTDown * tDown * (hubX + 10) + tDown * tDown * hubX
        const p2y = invTDown * invTDown * (cloudY + 10) + 2 * invTDown * tDown * -145 + tDown * tDown * hubY

        ctx.fillStyle = '#38d39f'
        ctx.shadowColor = '#38d39f'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p2x, p2y, 3.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Subtitle status
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.font = '8px "IBM Plex Mono", monospace'
        ctx.fillText('SYNC: SETTINGS ➔ CLOUD ➔ CONFIG HUB', -90, -145)

        ctx.restore()
      }

      // STEP 4: ADAS RADAR & SENSOR FIELD
      if (curStep === 'adas') {
        ctx.save()
        const camX = 120
        const camY = -118
        const radarX = 236
        const radarY = -50

        // Forward LiDAR / Radar sonar pulses
        for (let i = 0; i < 3; i++) {
          const rad = ((radarRadius + i * 0.33) % 1) * 165
          const alpha = 1 - rad / 165
          ctx.strokeStyle = `rgba(56, 211, 159, ${alpha * 0.8})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(radarX, radarY, rad, -Math.PI * 0.22, Math.PI * 0.22)
          ctx.stroke()
        }

        // Camera vision cone from windshield
        const camGrad = ctx.createLinearGradient(camX, camY, camX + 220, camY)
        camGrad.addColorStop(0, 'rgba(96, 165, 250, 0.42)')
        camGrad.addColorStop(1, 'rgba(96, 165, 250, 0)')
        ctx.fillStyle = camGrad
        ctx.beginPath()
        ctx.moveTo(camX, camY)
        ctx.lineTo(camX + 245, camY - 55)
        ctx.lineTo(camX + 245, camY + 65)
        ctx.closePath()
        ctx.fill()

        // Detected lead vehicle target box
        const targetX = 350
        const targetY = -42
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1.8
        ctx.strokeRect(targetX - 18, targetY - 16, 36, 30)
        // Corner brackets
        ctx.fillStyle = '#f59e0b'
        ctx.font = '8.5px "IBM Plex Mono", monospace'
        ctx.fillText('LEAD: 34.2m', targetX - 26, targetY - 20)
        ctx.fillText('TTC: 3.2s', targetX - 22, targetY + 26)
        ctx.restore()
      }

      // STEP 5: PERFORMANCE ENERGY REGENERATION GLOW
      if (curStep === 'android') {
        ctx.save()
        // Regenerative braking energy halo around wheels
        const regenAlpha = 0.45 + Math.sin(time * 0.008) * 0.35
        ctx.strokeStyle = `rgba(56, 211, 159, ${regenAlpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(WHEEL_FRONT_X, WHEEL_Y, WHEEL_RADIUS + 7, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(WHEEL_REAR_X, WHEEL_Y, WHEEL_RADIUS + 7, 0, Math.PI * 2)
        ctx.stroke()

        // Energy flow particles towards battery
        const pCount = 5
        for (let i = 0; i < pCount; i++) {
          const pT = (energyPhase + i / pCount) % 1
          const ex = WHEEL_FRONT_X + (-40 - WHEEL_FRONT_X) * pT
          const ey = WHEEL_Y + (-34 - WHEEL_Y) * pT
          ctx.fillStyle = '#38d39f'
          ctx.beginPath()
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // Battery Pack under floor
        ctx.fillStyle = 'rgba(56, 211, 159, 0.25)'
        ctx.fillRect(-70, -32, 90, 8)
        ctx.strokeStyle = '#38d39f'
        ctx.lineWidth = 1
        ctx.strokeRect(-70, -32, 90, 8)
        ctx.fillStyle = '#38d39f'
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillText('48V HYBRID TRACTION BATTERY', -68, -36)
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
        {step === 'duster' && <span>01 · CONNECTED DRIVE & TELEMETRY</span>}
        {step === 'diag' && <span>02 · X-RAY DIAGNOSTICS SCANNER [LIVE CAN BUS]</span>}
        {step === 'config' && <span>03 · CLOUD CONFIG HUB [SETTINGS ⇄ CLOUD ⇄ GATEWAY]</span>}
        {step === 'adas' && <span>04 · ADAS COMPUTER VISION [RUST/OPENCV 60FPS]</span>}
        {step === 'android' && <span>05 · ARCHITECTURE & ZERO-JANK 60FPS</span>}
      </div>
    </div>
  )
}
