export const profile = {
  name: 'Shubham Gupta',
  roles: ['Founding Engineer', 'Real-Time Voice AI', 'C++20 Systems', 'AI-Native Builder'],
  tagline: 'I build AI that talks back in real time.',
  location: 'Meerut, Uttar Pradesh',
  email: 'shubhamgupta.6237@gmail.com',
  phone: '+91-9368529122',
  linkedin: 'https://www.linkedin.com/in/shubham-gupta-251141210/',
  resume: '/Shubham_Gupta_Resume.pdf',
  about:
    'Founding engineer at Vaani AI Research, where I built the C++20 engine behind its phone and web voice agents from scratch. Before that I shipped connected-vehicle software for the New Renault Duster. I care about latency budgets, clean architecture, and using AI agents to ship production code faster.',
}

export const stats = [
  { value: 200, prefix: '<', suffix: 'ms', label: 'voice-to-voice budget' },
  { value: 21, prefix: '', suffix: '', label: 'AI vendors with live failover' },
  { value: 15, prefix: '', suffix: '+', label: 'in-call LLM tools' },
  { value: 30, prefix: '', suffix: 'K', label: 'node codebase knowledge graph' },
]

export const timeline = [
  { year: '2020 – 2024', title: 'B.E. Computer Science', org: 'Chandigarh University' },
  { year: 'Jul 2024', title: 'Graduate Engineering Trainee', org: 'Renault Group' },
  { year: 'Jul 2025', title: 'Engineer, New Duster', org: 'Renault Group' },
  { year: 'May 2026', title: 'Founding Engineer, SSE', org: 'Vaani AI Research' },
]

export type VaaniStepId =
  | 'engine'
  | 'failover'
  | 'human'
  | 'turn'
  | 'hotpath'
  | 'plugins'
  | 'scale'
  | 'ainative'

export const vaaniSteps: { id: VaaniStepId; kicker: string; title: string; body: string; tags: string[] }[] = [
  {
    id: 'engine',
    kicker: '01 · The engine',
    title: 'Built the voice AI engine from zero',
    body: 'A production C++20 orchestrator running live conversations over SIP telephony, WebRTC, and chat on LiveKit. STT, turn detection, LLM, and TTS stream in parallel inside a sub-200 ms voice-to-voice budget.',
    tags: ['C++20', 'LiveKit', 'SIP', 'WebRTC', 'Streaming'],
  },
  {
    id: 'failover',
    kicker: '02 · Resilience',
    title: 'Made live calls outage-proof',
    body: 'Router-based failover with PCM replay across 21 AI vendors: 7 STT, 6 LLM, 8 TTS, including self-hosted Gemma on vLLM. A vendor going down mid-call never drops the caller.',
    tags: ['Deepgram', 'Sarvam', 'OpenAI', 'Gemini', 'Cartesia', 'ElevenLabs'],
  },
  {
    id: 'human',
    kicker: '03 · Feels human',
    title: 'Speculative replies, instant barge-in',
    body: 'Speculative LLM execution starts answering before the caller finishes. Generation IDs on every turn mean the moment someone interrupts, stale tokens and audio are dropped instantly.',
    tags: ['Speculative LLM', 'Generation IDs', 'Soft / hard interrupt'],
  },
  {
    id: 'turn',
    kicker: '04 · Timing',
    title: 'Taught it when to speak',
    body: 'Multimodal end-of-turn detection fuses a text EOU classifier with the Smart-Turn audio model on ONNX Runtime / OpenVINO, with VAD and neural noise suppression across 8/16/48 kHz audio.',
    tags: ['ONNX Runtime', 'OpenVINO', 'Smart-Turn', 'VAD'],
  },
  {
    id: 'hotpath',
    kicker: '05 · Hot path',
    title: 'Zero locks. Zero allocations.',
    body: 'The audio strand runs on lock-free ring buffers, strand-safe timers, and Boost.Asio, proven with RapidCheck property tests under ASan, UBSan, and TSan.',
    tags: ['Lock-free', 'Boost.Asio', 'RapidCheck', 'TSan'],
  },
  {
    id: 'plugins',
    kicker: '06 · Architecture',
    title: 'Built to extend, not edit',
    body: 'An ABI-stable stage contract, dlopen plugin host, and CI-enforced dependency lint. Call recording, persona memory, 12 session watchers, and 15+ LLM tools shipped with zero core-engine changes.',
    tags: ['ABI-stable', 'dlopen', 'Capability registry'],
  },
  {
    id: 'scale',
    kicker: '07 · Production',
    title: 'Production-grade at scale',
    body: 'An actor-model agent server with Redis-backed concurrency and pooled vendor connections on Kubernetes: HPA, zero-downtime deploys, 300 s graceful drain, OpenTelemetry and Prometheus.',
    tags: ['Kubernetes', 'Redis', 'OpenTelemetry', 'Prometheus'],
  },
  {
    id: 'ainative',
    kicker: '08 · AI-native',
    title: 'Engineering with agents',
    body: 'Authored agent rules, AGENTS.md, Cursor skills (including a 4-phase architecture audit), and a 30K-node codebase knowledge graph so coding agents ship production C++ safely.',
    tags: ['Cursor', 'Agent skills', 'Knowledge graph'],
  },
]

export type RenaultStepId = 'duster' | 'diag' | 'config' | 'adas' | 'android'

export const renaultSteps: { id: RenaultStepId; kicker: string; title: string; body: string; tags: string[] }[] = [
  {
    id: 'duster',
    kicker: '01 · The program',
    title: 'New Renault Duster',
    body: 'Built Android and embedded software for the connected-vehicle and in-vehicle apps of the New Duster, using Kotlin, Java, and Jetpack (MVVM).',
    tags: ['Kotlin', 'Java', 'Jetpack', 'MVVM'],
  },
  {
    id: 'diag',
    kicker: '02 · Diagnostics',
    title: 'DiagRef Handler',
    body: 'Owned the Duster\u2019s diagnostics reference handling, wiring vehicle diagnostics through microservices and REST APIs.',
    tags: ['Diagnostics', 'Microservices', 'REST'],
  },
  {
    id: 'config',
    kicker: '03 · Configuration',
    title: 'Config Hub Bridge',
    body: 'Built the bridge that keeps vehicle configuration in sync between in-vehicle apps and backend services, with SQLite / Room persistence.',
    tags: ['Sync', 'SQLite', 'Room'],
  },
  {
    id: 'adas',
    kicker: '04 · Safety',
    title: 'ADAS features',
    body: 'Developed driver-assistance features and prototyped Rust and OpenCV image processing for automotive safety R&D.',
    tags: ['ADAS', 'Rust', 'OpenCV'],
  },
  {
    id: 'android',
    kicker: '05 · Craft',
    title: 'Performance, quality, people',
    body: 'Tuned features for low latency with unit tests, code reviews, and CI/CD in Agile sprints, and mentored new graduate trainees. Started here in 2024 as a Graduate Engineering Trainee.',
    tags: ['Low latency', 'CI/CD', 'Mentoring'],
  },
]

export const skillGroups = [
  { name: 'Languages', items: ['C++20', 'Kotlin', 'Java', 'Python', 'Rust', 'SQL', 'Bash'] },
  { name: 'Voice & AI', items: ['LiveKit', 'WebRTC', 'SIP', 'STT / TTS', 'LLM orchestration', 'RAG', 'pgvector', 'ONNX Runtime', 'OpenVINO', 'vLLM'] },
  { name: 'Systems', items: ['Real-time audio', 'Lock-free structures', 'Boost.Asio', 'Actor model', 'Plugin / ABI design', 'CMake', 'vcpkg'] },
  { name: 'Cloud', items: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Redis', 'PostgreSQL', 'OpenTelemetry', 'Prometheus'] },
  { name: 'Mobile & Embedded', items: ['Android SDK', 'Jetpack', 'Room', 'Gradle', 'Embedded Linux', 'OpenCV'] },
  { name: 'AI Tooling', items: ['Cursor', 'Claude', 'Agentic coding', 'Agent rules & skills', 'Knowledge graphs'] },
]
