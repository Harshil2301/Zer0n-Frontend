export const TABS = [
  {
    id: 'intro', label: 'Introduction',
    content: {
      title: 'ZerOn Platform — Introduction',
      lead: 'The first autonomous Web3-native vulnerability scanner powered by a Mixture of Agents (MoA) architecture.',
      body: [
        { h: 'What is ZerOn?', p: 'ZerOn is a full-stack cybersecurity platform that automates penetration testing using a swarm of 6 specialist AI agents orchestrated by a master LLM. It combines Web3 biometric identity (Sybil resistance), real-time vulnerability scanning, and on-chain escrow-based bug bounty payouts in a single cohesive product.' },
        { h: 'Core Innovation', p: 'The Mixture of Agents (MoA) architecture deploys SQLi, XSS, SSRF, Auth, IDOR, and Security Headers agents in parallel. Each agent uses a different LLM provider (NVIDIA, Groq, Cohere, Mistral, Cloudflare). A two-stage judge (Cerebras → SambaNova DeepSeek-R1) validates every finding before delivery, eliminating false positives.' },
        { h: 'Target Users', p: 'Enterprise security teams running authenticated scans on their own domains; independent security researchers earning crypto bug bounties; and bot operators running ZERON.EXE locally for passive bounty earning.' },
      ],
      badges: [
        ['React 18 + Vite 5','Frontend SPA'],
        ['Node.js + Express','Backend API'],
        ['6 LLM Agents','MoA Engine'],
        ['Firebase + IPFS','Storage'],
        ['Ethers.js v6','Web3'],
        ['Socket.io v4','Real-time'],
      ]
    }
  },
  {
    id: 'architecture', label: 'Architecture',
    content: {
      title: 'System Architecture',
      lead: 'A hybrid Web2/Web3 stack — React SPA frontend, Node.js MoA backend, Firebase persistence, and EVM smart contracts.',
      body: [
        { h: 'Frontend (ZerOn-main)', p: 'React 18 + Vite 5 SPA with React Router v7. 10 routes covering the full user journey from landing page to dashboard. Framer Motion animations, Socket.io-client for live scan streaming, face-api.js + MediaPipe for biometric KYC, and ethers.js v6 for Web3 wallet interaction. Hosted via static Edge networks (e.g. Vercel) for minimal latency.' },
        { h: 'Backend (ZerOn Bug Hunter)', p: 'Node.js 18 + Express.js REST API with Socket.io for real-time streaming. The MasterAgent (Gemini 1.5 Flash) orchestrates 6 specialist agents via Promise.allSettled() in parallel. Each agent has exponential backoff — a single failure never crashes the swarm. A robust task queue ensures asynchronous scanning without blocking the main event loop.' },
        { h: 'Database Schema (Firestore)', p: 'Firestore is strictly schema-less, but the project follows these entity rules: `users` track plan limits, biometrics, and wallet addresses. `scans` contain nested arrays of findings. `faceVectors` hold 128-d arrays indexing the user biometric identity. `contacts` serves as a simple lead-gen dump for the frontend form.' },
        { h: 'Web3 & Identity Layer', p: 'Ethers.js v6 connects to MetaMask (window.ethereum) or Core Wallet (window.avalanche). Plan subscriptions trigger on-chain transactions. Vulnerability reports are pinned to IPFS (via Pinata) for tamper-evident proof storage, accessible globally. Decentralised Escrow smart contracts handle trustless payouts.' },
      ],
      layers: [
        { label: 'Layer 1: Browser (React SPA)', sub: 'face-api.js • Socket.io-client • ethers.js • Firebase SDK Client', color: '#00d4ff' },
        { label: 'Layer 2: Transport (REST + WebSockets)', sub: 'POST /api/v1/scan/initiate • Socket.io events • Nginx Reverse Proxy', color: '#888' },
        { label: 'Layer 3: Node.js MoA Engine', sub: 'MasterAgent → 6 Specialist Agents → Two-Stage Judge Framework', color: '#00ff88' },
        { label: 'Layer 4: Data Persistence', sub: 'Firebase Firestore • RAG Memory JSON • Redis Caching', color: '#ffaa00' },
        { label: 'Layer 5: Decentralised Consensus', sub: 'Avalanche Fuji EVM • BountyEscrow.sol (Auto-Funding) • Pinata IPFS Proofs', color: '#a78bfa' },
      ]
    }
  },
  {
    id: 'api', label: 'API Reference',
    content: {
      title: 'REST API Reference',
      lead: 'Backend runs on http://localhost:5000. All scan endpoints emit real-time events via Socket.io.',
      endpoints: [
        { method: 'POST', url: '/api/v1/scan/initiate', desc: 'Initiates a new vulnerability scan. Validates user limits via Firebase before starting.', params: [['targetUrl','string','required','The full URL to scan (e.g. http://testphp.vulnweb.com)'], ['userId','string','required','Firebase user UUID for plan limit tracking'], ['depth','string','optional','basic, advanced, or expert']] },
        { method: 'GET', url: '/api/v1/scan/:scanId/status', desc: 'Returns current scan status, phase, and progress (0–100). Includes current active agent.', params: [['scanId','string','required','UUID returned from /api/scan/initiate']] },
        { method: 'GET', url: '/api/v1/scan/:scanId/results', desc: 'Returns full findings array with CVSS scores, CWE IDs, payloads, and remediation.', params: [['scanId','string','required','UUID of a completed scan']] },
        { method: 'GET', url: '/api/v1/scan/:scanId/report/pdf', desc: 'Downloads the auto-generated PDF report for a completed scan.', params: [['scanId','string','required','UUID of a completed scan']] },
        { method: 'POST', url: '/api/v1/scan/:scanId/terminate', desc: 'Gracefully terminates a running scan and saves partial results to Firestore.', params: [['scanId','string','required','UUID of the running scan']] },
        { method: 'POST', url: '/api/v1/bounty/verify', desc: 'Internal oracle endpoint to verify IPFS payload against target before contract execution.', params: [['ipfsHash','string','required','CID of the uploaded payload proof']] },
      ],
      socketEvents: [
        ['progress_{scanId}','server→client','Phase updates, agent logs, percentage progress (0–100)'],
        ['scan_complete_{scanId}','server→client','Final findings summary, total count, severity breakdown'],
        ['agent_update_{scanId}','server→client','Per-agent activity logs (which agent found what)'],
        ['error_{scanId}','server→client','Scan error details if pipeline fails'],
        ['transaction_mined','server→client','Emitted when the bounty escrow contract transaction confirms on-chain'],
      ]
    }
  },
  {
    id: 'agents', label: 'AI Agents (MoA)',
    content: {
      title: 'Mixture of Agents (MoA)',
      lead: 'Six specialist LLM agents fire in parallel. Each targets a specific vulnerability class. A two-stage judge validates all findings.',
      agents: [
        { name: 'MasterAgent', model: 'Gemini 1.5 Flash', role: 'Orchestrator', desc: 'Pre-scan fingerprinting: analyses attack surface and decides which specialist agents to activate. Conserves API quota by skipping irrelevant agents. Generates polyglot remediation scripts.' },
        { name: 'SqliAgent', model: 'NVIDIA Llama 3.1 70B', role: 'SQL Injection', desc: 'Tests error-based, boolean-blind (TRUE/FALSE response length diff >100 bytes), time-based (SLEEP 5s threshold 4500ms), UNION-based, and OOB DNS SQLi variants. High accuracy on complex WAF bypasses.' },
        { name: 'XssAgent', model: 'Groq Llama 3 70B', role: 'Cross-Site Scripting', desc: 'Injects unique marker ZER0N_XSS_{random}, detects reflection context (attribute/script/HTML), then fires context-specific payloads. Blind XSS fallback if marker not reflected.' },
        { name: 'SSRFAgent', model: 'Cohere Command-R', role: 'Server-Side Request Forgery', desc: 'Probes AWS 169.254.169.254, GCP metadata.google.internal, Azure, Redis dict://, file:///etc/passwd, IPv6 ::1 loopback, and open redirect chains.' },
        { name: 'AuthAgent', model: 'Mistral 7B', role: 'Authentication Failures', desc: 'Tests OWASP A07:2021 — default credentials, missing auth headers, session fixation, broken JWT validation, and privilege escalation paths.' },
        { name: 'IdorAgent', model: 'Groq + Cloudflare Workers AI', role: 'IDOR', desc: 'Finds id/user/account/order parameters. Tests sequential IDs [n, n+1, n+2]. Confirms IDOR via LLM structural analysis of response bodies — not just HTTP 200 status.' },
        { name: 'HeaderAgent', model: 'Rule-based', role: 'Security Headers', desc: 'Checks CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy, CORP, and COEP. Maps each missing header to its CVE and severity.' },
        { name: 'Judge (Stage 1)', model: 'Cerebras llama3.1-8b', role: 'Fast Triage', desc: 'Ultra-fast inference classifies each raw finding as: Confirmed / False Positive / Needs Further Review. Ambiguous findings escalate to Stage 2.' },
        { name: 'Judge (Stage 2)', model: 'SambaNova DeepSeek-R1', role: 'Deep Reasoning', desc: 'Chain-of-thought reasoning for ambiguous findings. Analyses payload, response, context, and RAG memory before final verdict. False positives logged to rag-memory.json.' },
      ]
    }
  },
  {
    id: 'web3', label: 'Web3 & KYC',
    content: {
      title: 'Web3 Identity & KYC',
      lead: 'Sybil-resistant biometric identity + on-chain plan subscriptions + IPFS proof storage.',
      body: [
        { h: 'Biometric Liveness (FaceScan)', p: 'MediaPipe Face Mesh tracks 468 landmarks at 30fps. Eye Aspect Ratio (EAR) blink detection: EAR = (|p2-p6| + |p3-p5|) / (2×|p1-p4|), threshold 0.23. Head yaw detection via nose-tip deviation. LBP texture variance analysis blocks photo spoofing. Face-lost timeout recovers from abandoned scans. Fully client-side — no video frames transmitted.' },
        { h: 'Face Embedding & Matching', p: 'face-api.js TinyFaceDetector extracts a 128-dimensional float vector after liveness confirmation and a Face Quality Gate. Vectors are AES-256 encrypted at rest in Firestore. Matching uses Euclidean distance (< 0.45 threshold) with a 3-zone confidence system triggering MFA on uncertain matches.' },
        { h: 'Wallet Integration', p: 'Ethers.js v6 detects window.avalanche (Core Wallet) or window.ethereum (MetaMask). eth_requestAccounts connects. eth_sendTransaction sends 0.01 ETH (0x2386F26FC10000 wei) to treasury for Pro plan. Transaction hash stored in Firebase users/{uuid}.transactionHash.' },
        { h: 'Smart Contract Escrow (Avalanche Fuji)', p: 'The backend acts as a Web3 Oracle. Upon verifying a vulnerability, it connects to the Avalanche Fuji C-Chain, auto-funds the BountyEscrow.sol contract if empty, and executes releaseBounty() to autonomously pay the researcher. Real transaction hashes are logged.' },
        { h: 'IPFS Proof Storage', p: 'After each confirmed vulnerability, a Proof-of-Concept bundle (payload, vulnerable response, timestamp) is pinned to the real IPFS network via Pinata API. The CID is stored in the scan record and displayed in the Transactions tab with a public IPFS gateway link.' },
        { h: 'Plans & Limits', p: 'Basic (Free, 1 domain): wallet signature only. Pro ($29/mo, 3 domains): testnet ETH transaction. Enterprise ($99/mo, 6 domains): manual contact. Dev Bypass (9 domains): no wallet required. domainsUsed tracked in Firebase and enforced before each scan start.' },
      ]
    }
  },
  {
    id: 'quickstart', label: 'Quick Start',
    content: {
      title: 'Quick Start Guide',
      lead: 'Get the full ZerOn stack running locally in under 10 minutes.',
      steps: [
        { n: '01', title: 'Clone Both Repositories', code: 'git clone https://github.com/your-org/ZerOn-main\ngit clone https://github.com/your-org/ZerOn-Bug-Hunter-main' },
        { n: '02', title: 'Install Frontend Dependencies', code: 'cd ZerOn-main\nnpm install' },
        { n: '03', title: 'Download face-api.js Models', code: '# Place in ZerOn-main/public/models/\n# tiny_face_detector_model-weights_manifest.json\n# face_landmark_68_model-weights_manifest.json\n# face_recognition_model-weights_manifest.json' },
        { n: '04', title: 'Configure Firebase', code: '# Edit src/config/firebase.config.js\n# Add your Firebase project credentials' },
        { n: '05', title: 'Install Backend Dependencies', code: 'cd ZerOn-Bug-Hunter-main\nnpm install' },
        { n: '06', title: 'Configure Backend .env', code: 'GEMINI_API_KEY=your_key\nNVIDIA_API_KEY=your_key\nGROQ_API_KEY=your_key\nCOHERE_API_KEY=your_key\nMISTRAL_API_KEY=your_key\nCEREBRAS_API_KEY=your_key\nSAMBANOVA_API_KEY=your_key\nFIREBASE_PROJECT_ID=your_project' },
        { n: '07', title: 'Start Backend Server', code: 'node server-simple.js\n# Server starts on http://localhost:5000' },
        { n: '08', title: 'Start Frontend Dev Server', code: 'cd ZerOn-main\nnpm run dev\n# Frontend starts on http://localhost:3000' },
        { n: '09', title: 'Access Dev Bypass Dashboard', code: '# Navigate to:\nhttp://localhost:3000/dashboard?id=dev-bypass\n# Full Premium dashboard, no face scan needed' },
        { n: '10', title: 'Run First Scan', code: '# In Security Scan tab, enter:\nhttp://testphp.vulnweb.com\n# Click "Deploy Autonomous Agent"\n# Watch live terminal stream Phase 0 → Phase 4' },
      ]
    }
  },
]
