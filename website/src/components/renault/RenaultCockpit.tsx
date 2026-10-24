import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { RenaultStepId } from '../../data/profile'
import { easeOut } from '../../lib/motion'
import { DynamicDuster2D } from './DynamicDuster2D'

type RenaultCockpitProps = {
  step: RenaultStepId
  active: boolean
  onSelectStep?: (id: RenaultStepId) => void
}

export function RenaultCockpit({ step, active }: RenaultCockpitProps) {
  const [speed, setSpeed] = useState(88)
  const [boosted, setBoosted] = useState(false)
  const [driveMode, setDriveMode] = useState<'eco' | 'auto' | 'sport'>('auto')
  const [diagTick, setDiagTick] = useState(0)
  const [syncTime, setSyncTime] = useState('0.014s ago')

  const currentStep = step

  // Smooth simulation updates
  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      const targetBase = boosted ? 138 : driveMode === 'eco' ? 68 : driveMode === 'sport' ? 112 : 88
      setSpeed(Math.round(targetBase + (Math.random() - 0.48) * 5))
      setDiagTick((t) => t + 1)
      setSyncTime(`${(0.01 + Math.random() * 0.015).toFixed(3)}s ago`)
    }, 1400)
    return () => clearInterval(interval)
  }, [active, boosted, driveMode])

  const handleDriveMode = (mode: 'eco' | 'auto' | 'sport') => {
    setDriveMode(mode)
    if (mode === 'sport') setBoosted(true)
    else if (boosted) setBoosted(false)
  }

  return (
    <div className="renault-cockpit">
      {/* Cockpit Top Bar */}
      <div className="cockpit-bar">
        <div className="cockpit-branding">
          <span className="brand-dot" />
          <span className="brand-title">AUTOMOTIVE SYSTEMS · IVI PLATFORM</span>
          <span className="brand-sub">MODULAR HYBRID (AWD)</span>
        </div>

        {/* Drive mode selector & interactive boost */}
        <div className="cockpit-controls">
          <div className="drive-modes">
            <button
              type="button"
              className={`mode-btn ${driveMode === 'eco' ? 'active' : ''}`}
              onClick={() => handleDriveMode('eco')}
              title="Eco Hybrid Mode"
            >
              ECO
            </button>
            <button
              type="button"
              className={`mode-btn ${driveMode === 'auto' ? 'active' : ''}`}
              onClick={() => handleDriveMode('auto')}
              title="4WD Auto Mode"
            >
              4WD AUTO
            </button>
            <button
              type="button"
              className={`mode-btn ${driveMode === 'sport' ? 'active' : ''}`}
              onClick={() => handleDriveMode('sport')}
              title="Sport Mode"
            >
              SPORT
            </button>
          </div>

          <button
            type="button"
            className={`cockpit-boost-btn ${boosted ? 'active' : ''}`}
            onClick={() => setBoosted((b) => !b)}
            title="Accelerate / Boost vehicle speed"
          >
            {boosted ? '⚡ BOOST ON' : '⚡ BOOST ACCEL'}
          </button>

          <div className="cockpit-speedo">
            <span className="speed-val">{speed}</span>
            <span className="speed-unit">KM/H</span>
            <span className="gear-tag">{boosted ? 'D7' : 'D6'}</span>
          </div>
        </div>

        <div className="cockpit-telemetry-badge">
          <span className="status-live-dot" />
          <span className="status-text">5G TELEMETRY ACTIVE</span>
        </div>
      </div>

      {/* Main Dynamic 2D Car Hero Viewport */}
      <div className="dynamic-car-viewport">
        <DynamicDuster2D
          step={currentStep}
          active={active}
          speed={speed}
          boosted={boosted}
          driveMode={driveMode}
        />
      </div>

      {/* Subsystem Telemetry Terminal Drawer */}
      <div className="cockpit-drawer">
        <div className="terminal-window">
          {/* Terminal Titlebar with Window Controls */}
          <div className="terminal-titlebar">
            <div className="terminal-dots">
              <span className="term-dot red" />
              <span className="term-dot yellow" />
              <span className="term-dot green" />
            </div>
            <div className="terminal-prompt">
              sys-gateway@ivi-host:~$ <span className="term-cmd">./telemetry-stream --abstract --realtime</span>
            </div>
            <div className="terminal-badge">
              <span className="term-live-indicator" />
              <span>TTY/1 · LINK: NOMINAL</span>
            </div>
          </div>

          {/* Terminal Screen Body */}
          <div className="terminal-screen">
            <AnimatePresence mode="wait">
              {currentStep === 'duster' && (
                <motion.div
                  key="duster"
                  className="terminal-panel"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  <div className="terminal-grid">
                    <div className="term-trace-col">
                      <div className="term-line">
                        <span className="term-tag">[SYS_INIT]</span>
                        <span className="term-key">MODULAR_AWD_CORE</span>
                        <span className="term-val term-cyan">READY / 60 FPS</span>
                        <span className="term-status-ok">ONLINE</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[HAL_IVI]</span>
                        <span className="term-key">DIGITAL_COCKPIT</span>
                        <span className="term-val">10.1" OPEN-GL ES</span>
                        <span className="term-status-ok">VSYNC LOCKED</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[HV_BMS]</span>
                        <span className="term-key">140HP_HEV_TRACTION</span>
                        <span className="term-val">88% SOC · 460 KM</span>
                        <span className="term-status-ok">BALANCED</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[MODEM]</span>
                        <span className="term-key">LOW_LATENCY_5G</span>
                        <span className="term-val">-72 dBm (QAM-256)</span>
                        <span className="term-status-ok">CONNECTED</span>
                      </div>
                    </div>

                    <div className="term-meters-col">
                      <div className="term-meter-card">
                        <div className="meter-label">BUS LOAD</div>
                        <div className="meter-val">28.4%</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '28%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">CPU LOAD</div>
                        <div className="meter-val">18.2%</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '18%', background: '#60a5fa' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">HEAP USAGE</div>
                        <div className="meter-val">114 MB</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '24%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">PKT LOSS</div>
                        <div className="meter-val term-status-ok">0.00%</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '100%', background: '#38d39f' }} /></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'diag' && (
                <motion.div
                  key="diag"
                  className="terminal-panel"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  <div className="terminal-grid">
                    <div className="term-trace-col">
                      <div className="term-line">
                        <span className="term-dim">[14:22:0{diagTick % 9}]</span>
                        <span className="term-tag">[UDS:0x22]</span>
                        <span className="term-key">DID_0xF190 (VIN_HASH)</span>
                        <span className="term-cyan">RESP: [0x62 F1 90]</span>
                        <span className="term-status-ok">ACK (2.4ms)</span>
                      </div>
                      <div className="term-line">
                        <span className="term-dim">[14:22:0{(diagTick + 1) % 9}]</span>
                        <span className="term-tag">[CAN-FD]</span>
                        <span className="term-key">ISO-TP MULTI-FRAME</span>
                        <span className="term-val">CH_01 5Mb/s 64B</span>
                        <span className="term-status-ok">SYNC OK</span>
                      </div>
                      <div className="term-line">
                        <span className="term-dim">[14:22:0{(diagTick + 2) % 9}]</span>
                        <span className="term-tag">[REST/GW]</span>
                        <span className="term-key">/v1/vehicle/telemetry</span>
                        <span className="term-amber">HTTP 200 OK</span>
                        <span className="term-status-ok">STREAM OK</span>
                      </div>
                      <div className="term-line">
                        <span className="term-dim">[14:22:0{(diagTick + 3) % 9}]</span>
                        <span className="term-tag">[DTC_MGR]</span>
                        <span className="term-key">ECU_DIAG_NODES (x14)</span>
                        <span className="term-val">0 DTCs REGISTERED</span>
                        <span className="term-status-ok">NOMINAL</span>
                      </div>
                    </div>

                    <div className="term-status-pills-col">
                      <div className="term-node-status">
                        <span className="node-name">ECU_POWERTRAIN</span>
                        <span className="node-tag">0 DTCs</span>
                        <span className="node-pill ok">NOMINAL</span>
                      </div>
                      <div className="term-node-status">
                        <span className="node-name">ECU_BRAKE_ABS</span>
                        <span className="node-tag">0 DTCs</span>
                        <span className="node-pill ok">NOMINAL</span>
                      </div>
                      <div className="term-node-status">
                        <span className="node-name">ECU_BATTERY_BMS</span>
                        <span className="node-tag">0 DTCs</span>
                        <span className="node-pill ok">NOMINAL</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'config' && (
                <motion.div
                  key="config"
                  className="terminal-panel"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  <div className="config-terminal-wrapper">
                    {/* Visual Cloud Architecture Pipeline */}
                    <div className="cloud-pipeline-bar">
                      <div className="cloud-pipe-node">
                        <svg className="pipe-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span className="pipe-name">SETTINGS APP</span>
                        <span className="pipe-sub">User Preference</span>
                      </div>
                      <svg className="pipe-arrow-svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <div className="cloud-pipe-node">
                        <svg className="pipe-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <ellipse cx="12" cy="5" rx="9" ry="3" />
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                        <span className="pipe-name">ROOM DB CACHE</span>
                        <span className="pipe-sub">SQLite3 DAO</span>
                      </div>
                      <svg className="pipe-arrow-svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <div className="cloud-pipe-node active-cloud">
                        <svg className="pipe-svg cloud-pulse" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                        </svg>
                        <span className="pipe-name">FLEET CONFIG CLOUD</span>
                        <span className="pipe-sub">Remote Service</span>
                      </div>
                      <svg className="pipe-arrow-svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <div className="cloud-pipe-node">
                        <svg className="pipe-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <rect x="9" y="9" width="6" height="6" />
                          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                        </svg>
                        <span className="pipe-name">CONFIG HUB GATEWAY</span>
                        <span className="pipe-sub">In-Vehicle Sync</span>
                      </div>
                    </div>

                    {/* Terminal Synchronization Log */}
                    <div className="term-trace-col" style={{ marginTop: 6 }}>
                      <div className="term-line">
                        <span className="term-tag">[SETTINGS_UI]</span>
                        <span className="term-key">Vehicle Settings App</span>
                        <span className="term-amber">DIRTY_FLAG: SET</span>
                        <span className="term-status-ok">DISPATCHED</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[ROOM_CACHE]</span>
                        <span className="term-key">SQLite3 / Room DAO</span>
                        <span className="term-cyan">BEGIN TX; WRITE; COMMIT</span>
                        <span className="term-status-ok">0.8ms (ATOMIC)</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[FLEET_CLOUD]</span>
                        <span className="term-key">Remote Config Service</span>
                        <span className="term-val">TLS 1.3 JSON Delta (4.2KB)</span>
                        <span className="term-status-ok">SYNC ACK ({syncTime})</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[CONFIG_HUB]</span>
                        <span className="term-key">In-Vehicle Gateway</span>
                        <span className="term-cyan">3-Way Merged [v4.8.2-prod]</span>
                        <span className="term-status-ok">0 CONFLICTS</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'adas' && (
                <motion.div
                  key="adas"
                  className="terminal-panel"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  <div className="terminal-grid">
                    <div className="term-trace-col">
                      <div className="term-line">
                        <span className="term-tag">[OPENCV_CV]</span>
                        <span className="term-key">Dual Boundary Spline</span>
                        <span className="term-cyan">Offset: 0.02m (Centered)</span>
                        <span className="term-status-ok">LOCKED</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[RADAR_FUS]</span>
                        <span className="term-key">77 GHz mmWave Transceiver</span>
                        <span className="term-val">Range: 34.2m · Rel: -0.4 m/s</span>
                        <span className="term-status-ok">TRACKING</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[KALMAN_EST]</span>
                        <span className="term-key">Sensor Fusion Latency</span>
                        <span className="term-amber">11.2ms (Zero Backlog)</span>
                        <span className="term-status-ok">60 FPS PASS</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[SAFETY_LOG]</span>
                        <span className="term-key">Time-To-Collision (TTC)</span>
                        <span className="term-val">3.2s Safely Buffered</span>
                        <span className="term-status-ok">ZERO RISK</span>
                      </div>
                    </div>

                    <div className="term-meters-col">
                      <div className="term-meter-card">
                        <div className="meter-label">CV LATENCY</div>
                        <div className="meter-val term-status-ok">11.2 ms</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '67%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">RADAR RANGE</div>
                        <div className="meter-val">160 m</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '80%', background: '#60a5fa' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">LANE OFFSET</div>
                        <div className="meter-val term-status-ok">&lt;0.02 m</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '95%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">SAFETY STATE</div>
                        <div className="meter-val term-status-ok">SAFE</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '100%', background: '#38d39f' }} /></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'android' && (
                <motion.div
                  key="android"
                  className="terminal-panel"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  <div className="terminal-grid">
                    <div className="term-trace-col">
                      <div className="term-line">
                        <span className="term-tag">[JANK_STATS]</span>
                        <span className="term-key">Render Frame Budget</span>
                        <span className="term-status-ok">16.1ms / 16.6ms Target</span>
                        <span className="term-status-ok">60.0 FPS LOCKED</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[DALVIK_ART]</span>
                        <span className="term-key">Memory Heap Allocation</span>
                        <span className="term-val">114 MB / 512 MB Max</span>
                        <span className="term-status-ok">GC PAUSE &lt;0.4ms</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[TEST_SUITE]</span>
                        <span className="term-key">Automotive Test Matrix</span>
                        <span className="term-cyan">412 / 412 Tests Passing</span>
                        <span className="term-status-ok">100% GREEN</span>
                      </div>
                      <div className="term-line">
                        <span className="term-tag">[RT_THREAD]</span>
                        <span className="term-key">Audio/CAN Core Strand</span>
                        <span className="term-amber">SCHED_FIFO (Priority 98)</span>
                        <span className="term-status-ok">ZERO INVERSION</span>
                      </div>
                    </div>

                    <div className="term-meters-col">
                      <div className="term-meter-card">
                        <div className="meter-label">FPS STABILITY</div>
                        <div className="meter-val term-status-ok">60.0 FPS</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '100%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">FRAME DURATION</div>
                        <div className="meter-val">16.1 ms</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '85%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">TEST COVERAGE</div>
                        <div className="meter-val term-status-ok">100%</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '100%', background: '#38d39f' }} /></div>
                      </div>
                      <div className="term-meter-card">
                        <div className="meter-label">TRAINEE MENTOR</div>
                        <div className="meter-val">2024 → 2026</div>
                        <div className="mini-bar"><div className="mini-fill" style={{ width: '100%', background: '#f59e0b' }} /></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  )
}
