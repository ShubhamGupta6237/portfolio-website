import { useEffect, useRef, useState } from 'react'

export type AgentState = 'listening' | 'thinking' | 'speaking' | 'interrupted'
export type PipeNode = 'mic' | 'stt' | 'turn' | 'llm' | 'tts' | 'out'

export type Message = {
  id: number
  who: 'user' | 'agent'
  text: string
  interim?: boolean
  cut?: boolean
}

type Turn = { who: 'user' | 'agent'; text: string; cutAfterWords?: number }

const script: Turn[] = [
  { who: 'user', text: 'Hi, I need to move my appointment to Friday.' },
  { who: 'agent', text: 'Sure! I have 11 AM or 4 PM on Friday. Which works better?' },
  { who: 'user', text: '4 PM, please.' },
  { who: 'agent', text: 'Done, you are booked for Friday at 4 PM and I will send a WhatsApp confirmation', cutAfterWords: 9 },
  { who: 'user', text: 'Wait, can we make it 5 instead?' },
  { who: 'agent', text: 'Of course. Friday at 5 PM is confirmed.' },
]

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

/** Plays a scripted voice call: interim STT, turn commit, streamed LLM tokens, TTS, and a barge-in. */
export function useCallSimulation(running: boolean) {
  const [state, setState] = useState<AgentState>('listening')
  const [node, setNode] = useState<PipeNode>('mic')
  const [messages, setMessages] = useState<Message[]>([])
  const [latency, setLatency] = useState<number | null>(null)
  const ampRef = useRef(0.08)
  const runningRef = useRef(running)

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    let alive = true
    let nextId = 1

    const waitWhilePaused = async () => {
      while (alive && !runningRef.current) await sleep(200)
    }

    const update = (id: number, patch: Partial<Message>) =>
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)))

    const push = (m: Message) => setMessages((ms) => [...ms.slice(-4), m])

    const run = async () => {
      while (alive) {
        setMessages([])
        setLatency(null)
        for (const turn of script) {
          await waitWhilePaused()
          if (!alive) return
          const words = turn.text.split(' ')
          const id = nextId++

          if (turn.who === 'user') {
            setState('listening')
            setNode('stt')
            push({ id, who: 'user', text: '', interim: true })
            for (let i = 0; i < words.length; i++) {
              ampRef.current = 0.35 + Math.random() * 0.25
              update(id, { text: words.slice(0, i + 1).join(' ') })
              await sleep(150 + Math.random() * 90)
              if (!alive) return
            }
            update(id, { interim: false })
            ampRef.current = 0.08
            setState('thinking')
            setNode('turn')
            await sleep(320)
            setNode('llm')
            await sleep(260)
          } else {
            setLatency(152 + Math.round(Math.random() * 40))
            setState('speaking')
            setNode('tts')
            push({ id, who: 'agent', text: '' })
            let cut = false
            for (let i = 0; i < words.length; i++) {
              ampRef.current = 0.7 + Math.random() * 0.3
              update(id, { text: words.slice(0, i + 1).join(' ') })
              await sleep(120 + Math.random() * 60)
              if (!alive) return
              if (turn.cutAfterWords && i + 1 >= turn.cutAfterWords) {
                cut = true
                break
              }
            }
            if (cut) {
              update(id, { cut: true })
              setState('interrupted')
              ampRef.current = 0.2
              await sleep(500)
              continue
            }
            ampRef.current = 0.06
            setNode('out')
            await sleep(700)
          }
        }
        await sleep(2200)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [])

  return { state, node, messages, latency, ampRef }
}
