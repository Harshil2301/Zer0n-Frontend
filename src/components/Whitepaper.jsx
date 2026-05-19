import React, { useState } from 'react';
import { Shield, Lock, Globe, Cpu, Database, Activity, Code, Server, PlayCircle, Fingerprint, FileText, CheckCircle, ChevronDown, ChevronUp, Eye, Zap, Brain, Network } from 'lucide-react';
import Navigation from './Navigation';
import ParticleField from './ParticleField';
import DataStream from './DataStream';
import './Whitepaper.css';

const Section = ({ number, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="wp-section">
      <div className="section-title no-print" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <span className="section-number">{number}</span>
        <h2>{title}</h2>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '1.2rem' }}>{open ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
      </div>
      <div className="section-title print-only" style={{ display: 'none' }}>
        <span className="section-number">{number}</span>
        <h2>{title}</h2>
      </div>
      <div className={`section-body ${open ? 'open' : 'closed'}`}>{children}</div>
    </section>
  );
};

const Whitepaper = () => {
  return (
    <div className="whitepaper-page">
      <Navigation />
      <div className="grid-overlay"></div>
      <ParticleField count={30} className="hero-particles" />
      <DataStream direction="vertical" density={8} className="background terminal-green sparse" />
      <div className="whitepaper-document">

        {/* ── HEADER ── */}
        <div className="document-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Shield size={40} color="#00d4ff" />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#00d4ff', letterSpacing: '0.15em' }}>TECHNICAL ASSESSMENT DOCUMENT</span>
          </div>
          <h1>ZerOn Security Platform</h1>
          <p>Autonomous Multi-Agent Web Vulnerability Scanner with Web3 Identity & Decentralised Escrow</p>
          <div className="document-meta">
            <span>Version 1.0</span> • <span>May 2026</span> • <span>Prepared for Academic Evaluation</span>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
            <button className="download-btn no-print" onClick={() => window.print()}>⬇ Export as Full PDF</button>
          </div>
        </div>

        {/* ── SECTIONS ── */}
        <div className="document-content">

          <Section number="1.0" title="Project Evaluation Guide" defaultOpen={true}>
            <h3>Full User Journey (End-to-End)</h3>
            <ul className="step-list">
              <li><strong>Step 1 — Landing Page (/):</strong> Observe the animated cyber background, hero section, HowItWorks (Init → Scan → Verify), LiveDemo terminal, and Features grid. Click "Start Hunting" to enter the KYC flow.</li>
              <li><strong>Step 2 — Face Scan (/face-scan):</strong> Allow camera access. Blink twice when prompted (watch EAR meter). Turn head left then right. System detects liveness and extracts 128-d face embedding.</li>
              <li><strong>Step 3 — Identity (/identity):</strong> Sign in with Google or email. Complete personal + professional profile. Watch the animated profile completion percentage.</li>
              <li><strong>Step 4 — Plan Selection (/plan-selection):</strong> Connect MetaMask or Core Wallet. Select a plan. For Pro: sign the testnet transaction. Transaction hash stored in Firebase.</li>
              <li><strong>Step 5 — Dashboard (/dashboard):</strong> The main SPA. Four tabs: Security Scan, History, Transactions, Settings.</li>
              <li><strong>Step 6 — New Scan:</strong> Enter a target domain (e.g., <code>http://testphp.vulnweb.com</code>). Click "Deploy Autonomous Agent". Watch the live terminal stream Phase 0 through Phase 4 progress in real-time via Socket.io.</li>
              <li><strong>Step 7 — Scan History:</strong> View past scans sorted by date. Recharts pie chart shows Critical/High/Medium/Low severity breakdown. Download PDF report (preserves dark cyberpunk theme via print-color-adjust).</li>
              <li><strong>Step 8 — Transactions:</strong> View plan tier, wallet address, real Avalanche Fuji escrow contract payouts, Snowtrace transaction hashes, and IPFS proof CID links.</li>
              <li><strong>Step 9 — Settings:</strong> Update profile, change theme (Dark/Light/Auto), switch language (EN/ES/FR/DE), toggle notification preferences.</li>
              <li><strong>Step 10 — Documentation (/documentation):</strong> Developer portal — architecture, smart contracts, API reference, bot integration guide.</li>
            </ul>

            <h3>Other Pages to Evaluate</h3>
            <ul className="step-list">
              <li><strong>Roadmap (/roadmap):</strong> 4-phase strategic plan — Phase 1 & 2 complete, Phase 3 at 85%, Phase 4 planned for Q3-Q4 2026.</li>
              <li><strong>Download Center (/download):</strong> ZERON.EXE CLI tool — designed for bot operators running autonomous agents locally.</li>
              <li><strong>Contact (/contact):</strong> Firebase Firestore-backed contact form. Submissions saved to <code>contacts</code> collection in real-time.</li>
            </ul>
          </Section>

          <Section number="2.0" title="Executive Summary">
            <p>
              <strong>ZerOn</strong> is a full-stack, production-grade cybersecurity platform that automates web vulnerability discovery through a <strong>Mixture of Agents (MoA)</strong> architecture — a swarm of six specialist AI models orchestrated by a master agent. It is the first platform to combine autonomous penetration testing with <strong>Web3 biometric identity verification (Sybil resistance)</strong> and <strong>on-chain escrow-based bug bounty payouts</strong> in a single cohesive product.
            </p>
            <p>
              The platform addresses three critical gaps in modern cybersecurity: (1) the shortage of skilled penetration testers relative to the attack surface growth, (2) the lack of trust in traditional bug bounty payout systems, and (3) the absence of a Sybil-resistant identity mechanism for anonymous security researchers. ZerOn resolves all three by combining AI automation, blockchain identity, and decentralised finance.
            </p>
            <div className="architecture-grid">
              {[
                { icon: Brain, title: 'MoA AI Engine', desc: '6 specialist agents (SQLi, XSS, SSRF, Auth, IDOR, Headers) orchestrated by Gemini 1.5 Flash with a two-stage judge.' },
                { icon: Fingerprint, title: 'Web3 KYC', desc: 'MediaPipe 468-landmark liveness detection + face-api.js 128-d embeddings for Sybil-resistant biometric identity.' },
                { icon: Globe, title: '5-Phase Pipeline', desc: 'Recon → Discovery → Attack Surface → Exploitation → Reporting pipeline processes targets end-to-end.' },
                { icon: Database, title: 'RAG Memory', desc: 'Persistent false-positive memory prevents repeat mistakes across scans using a JSON-based retrieval store.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="arch-card">
                  <Icon className="arch-icon" />
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section number="3.0" title="System Architecture">
            <p>ZerOn is a hybrid Web2/Web3 application consisting of three tightly integrated layers:</p>
            <div className="audience-split" style={{ marginTop: '1.5rem' }}>
              <div className="audience-column">
                <h4>🖥 Frontend — ZerOn-main</h4>
                <ul>
                  <li>React 18 + Vite 5 SPA, deployed on Vercel</li>
                  <li>React Router v7 — 10 routes from landing to dashboard</li>
                  <li>Framer Motion animations + Lucide React icons</li>
                  <li>Socket.io-client for real-time scan streaming</li>
                  <li>Ethers.js v6 for Web3 wallet interaction</li>
                  <li>face-api.js + MediaPipe for biometric KYC</li>
                  <li>Firebase SDK v12 — Auth + Firestore persistence</li>
                  <li>Recharts for vulnerability severity pie charts</li>
                  <li>jsPDF + html2canvas for PDF report export</li>
                  <li>i18n via custom Context (EN / ES / FR / DE)</li>
                </ul>
              </div>
              <div className="audience-column">
                <h4>⚙ Backend — ZerOn Bug Hunter</h4>
                <ul>
                  <li>Node.js 18 + Express.js REST API</li>
                  <li>Socket.io for real-time progress streaming</li>
                  <li>MasterAgent (Gemini 1.5 Flash) — orchestrator</li>
                  <li>6 Specialist Agents — NVIDIA, Groq, Cohere, Mistral, Cloudflare</li>
                  <li>Two-Stage Judge — Cerebras → SambaNova DeepSeek-R1</li>
                  <li>Puppeteer for JavaScript-rendered SPA crawling</li>
                  <li>Axios + Cheerio for recursive HTTP crawling</li>
                  <li>Firebase Admin SDK for Firestore writes</li>
                  <li>RAG Memory — JSON-based false positive store</li>
                  <li>PDFKit for vulnerability report generation</li>
                </ul>
              </div>
            </div>
            <h3 style={{ marginTop: '2rem' }}>Data Flow</h3>
            <div className="instruction-box">
              <Code className="instruction-icon" />
              <div>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', lineHeight: 2 }}>
                  User (Browser) → FaceScan KYC → Identity Onboarding → Plan Selection (Web3 Wallet)<br/>
                  → Dashboard → NewScan Tab → POST /api/scan/start (Backend)<br/>
                  → Socket.io stream → 5-Phase Pipeline → MoA Swarm → Two-Stage Judge<br/>
                  → Firebase Firestore (persist) → Socket.io complete → Dashboard (results)
                </p>
              </div>
            </div>
          </Section>

          <Section number="4.0" title="Web3 Identity & Sybil Resistance (KYC Flow)">
            <p>The identity system is the platform's most technically complex component. It prevents Sybil attacks — one real human face = one verified account — using a three-stage pipeline:</p>

            <h3>Stage 1 — Biometric Liveness Detection (/face-scan)</h3>
            <div className="architecture-grid">
              <div className="arch-card">
                <Eye className="arch-icon" />
                <h3>MediaPipe Face Mesh</h3>
                <p>468 facial landmarks tracked at 30fps via requestAnimationFrame. Includes LBP texture variance analysis for photo/screen anti-spoofing. Runs entirely client-side.</p>
              </div>
              <div className="arch-card">
                <Fingerprint className="arch-icon" />
                <h3>Eye Aspect Ratio (EAR)</h3>
                <p>Blink detection: EAR = (|p2-p6| + |p3-p5|) / (2×|p1-p4|). Threshold 0.23 for 1–30 frames. Two blinks required.</p>
              </div>
              <div className="arch-card">
                <Activity className="arch-icon" />
                <h3>Head Pose Yaw</h3>
                <p>Nose tip deviation from eye midpoint. signal = noseDevX + chinDev. Left &lt; -0.10, Right &gt; +0.10. 4 consecutive frames required each direction.</p>
              </div>
              <div className="arch-card">
                <Brain className="arch-icon" />
                <h3>Face Embedding & Encryption</h3>
                <p>face-api.js extracts a 128-dimensional vector, gated by a quality check (occlusion detection). Vectors are AES-256 encrypted at rest. Matching uses Euclidean distance with a 3-zone confidence threshold (MFA fallback for uncertain matches).</p>
              </div>
            </div>

            <h3>Stage 2 — Identity Onboarding (/identity)</h3>
            <ul className="step-list">
              <li><strong>Step 1:</strong> Login method — Google OAuth (signInWithPopup) or Email/Password with email verification link sent.</li>
              <li><strong>Step 2:</strong> Personal info — Full Name, Email. Profile completion % calculated live with weighted fields (Name 15%, Email 20%, Phone 15%, Org 15%, Role 10%, Location 10%, Verified 15%).</li>
              <li><strong>Step 3:</strong> Professional info — Organization, Role, Location, Phone. Saves to Firebase <code>users/{'{uuid}'}</code> on submit.</li>
            </ul>

            <h3>Stage 3 — Web3 Plan Subscription (/plan-selection)</h3>
            <ul className="step-list">
              <li><strong>Basic (Free):</strong> 1 domain scan — wallet signature only via <code>eth_requestAccounts</code>.</li>
              <li><strong>Pro ($29/mo):</strong> 3 domain scans — testnet transaction of 0.01 ETH (<code>0x2386F26FC10000</code> wei) via <code>eth_sendTransaction</code>.</li>
              <li><strong>Enterprise ($99/mo):</strong> 6 domain scans — manual contact flow. Transaction hash stored in Firebase.</li>
              <li>Supports MetaMask (<code>window.ethereum</code>) and Core Wallet (<code>window.avalanche</code>) — Ethers.js v6.</li>
            </ul>
          </Section>

          <Section number="5.0" title="The 5-Phase Scanning Pipeline">
            {[
              { phase: 'Phase 0 — Recon & Scope (0–15%)', items: ['ScopeService parses the target domain', 'SubdomainEnumerator: DNS brute-force (80+ prefixes), Certificate Transparency logs via crt.sh API, common subdomain construction', 'AssetCatalog builds the discovered asset inventory', 'TargetScorer ranks assets by exploitability'] },
              { phase: 'Phase 1 — Discovery (15–35%)', items: ['CrawlerService: Axios + Cheerio recursive crawler (maxDepth:3, maxPages:1000)', 'WaybackService queries archive.org for historical URLs', 'JSFileAnalyzer extracts hidden API endpoints from JavaScript bundles', 'RobotsAndSitemapService parses robots.txt and sitemap.xml', 'DirectoryFuzzer probes common paths (/admin, /.env, /phpinfo.php)', 'FingerprintService detects tech stack (WordPress, Laravel, Django, etc.)', 'ApiDiscoveryService maps discovered REST/GraphQL endpoints'] },
              { phase: 'Phase 2 — Attack Surface Analysis (35–55%)', items: ['ParameterDiscovery extracts all GET/POST parameters', 'PayloadGenerator creates context-aware payloads per parameter type', 'VulnerabilityTemplates maps parameters to OWASP vulnerability classes', 'Type-aware routing: id/user/password → SQLi/Auth agents; url/redirect/src → SSRF agent'] },
              { phase: 'Phase 3 — MoA Exploitation (55–90%)', items: ['MasterAgent (Gemini 1.5 Flash) fingerprints attack surface, decides which agents activate', 'Promise.allSettled() fires all agents in parallel with exponential backoff', 'SqliAgent (NVIDIA Llama 70B): error-based, boolean-blind, time-based (SLEEP 5s), UNION-based SQLi', 'XssAgent (Groq Llama 70B): context-aware marker injection, attribute/script/HTML context detection', 'SSRFAgent (Cohere Cmd-R): probes AWS/GCP/Azure metadata, Redis, localhost, IPv6 loopback', 'AuthAgent (Mistral): tests A07 authentication failures, default credentials', 'IdorAgent (Groq + Cloudflare): tests sequential IDs [n, n+1, n+2], confirms with LLM response analysis', 'HeaderAgent (Rule-based): checks 8 security headers (CSP, HSTS, X-Frame-Options, etc.)', 'Two-Stage Judge: Cerebras llama3.1-8b (fast triage) → SambaNova DeepSeek-R1 (chain-of-thought for ambiguous)', 'RAG Memory logs false positives to rag-memory.json to prevent repeat mistakes'] },
              { phase: 'Phase 4 — Reporting (90–100%)', items: ['DeduplicationEngine collapses duplicate findings by type + endpoint', 'ReportGenerator produces structured JSON with CVSS scores, CWE IDs, OWASP references', 'BugBountyReportService formats for HackerOne/Bugcrowd submission', 'GeminiIntegration generates AI remediation code per finding (Node.js, Python, PHP, Java)', 'PDFReportService generates downloadable PDF report', 'Firebase update: scans/{scanId} → status:completed, findings:[]', 'IPFS Pinning: Proofs are pinned to the real Pinata IPFS network generating cryptographic CIDs', 'Web3 Bounty Escrow: EscrowService acts as a real Web3 Oracle on Avalanche Fuji, automatically triggering and funding smart contract payouts to the researcher.'] },
            ].map(({ phase, items }) => (
              <div key={phase} style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#00ff88', marginBottom: '0.75rem' }}>{phase}</h3>
                <ul className="step-list">
                  {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </Section>

          <Section number="6.0" title="Vulnerability Types Detected">
            <div className="architecture-grid">
              {[
                { title: 'SQL Injection (CWE-89)', desc: "Error-based, Boolean-blind, Time-based (SLEEP 5s), UNION-based, OOB DNS. Matches 'SQL syntax', 'ORA-XXXXX', pg_query errors.", color: '#ff4444' },
                { title: 'XSS (CWE-79)', desc: 'Context-aware: marker ZER0N_XSS_{random} injected first to confirm reflection, then context-specific payloads (attribute, script, HTML context).', color: '#ff8800' },
                { title: 'SSRF (CWE-918)', desc: 'Tests AWS 169.254.169.254, GCP metadata.google.internal, Azure, Redis dict://, file:///etc/passwd, IPv6 loopback.', color: '#ff4444' },
                { title: 'IDOR (CWE-284)', desc: 'Sequential ID enumeration [n, n+1, n+2], confirmed by Groq LLM response body structural analysis.', color: '#ff8800' },
                { title: 'Auth Failures (CWE-287)', desc: 'Default credentials, missing auth headers, session fixation, broken JWT validation. Maps to OWASP A07:2021.', color: '#ffaa00' },
                { title: 'Security Headers', desc: 'CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy, CORP, COEP.', color: '#ffff00' },
                { title: 'Info Disclosure (CWE-200)', desc: '/etc/passwd, .env files, stack traces, AWS credentials, private keys, directory listings. 8 confidence-scored patterns.', color: '#ff8800' },
                { title: 'RCE / Path Traversal', desc: '../../../etc/passwd, windows\\system.ini, phpinfo.php, /proc/self/environ. Validated via response content matching.', color: '#ff0000' },
              ].map(({ title, desc, color }) => (
                <div key={title} className="arch-card" style={{ borderLeft: `3px solid ${color}` }}>
                  <h3 style={{ color }}>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section number="7.0" title="Firebase Data Architecture">
            <p>All persistent state is stored in Firebase Firestore (NoSQL). The backend uses Firebase Admin SDK; the frontend uses Firebase Client SDK v12.</p>
            <div className="audience-split">
              <div className="audience-column">
                <h4>Firestore Collections</h4>
                <ul>
                  <li><strong>users/{'{uuid}'}:</strong> Profile, plan type, domains used, wallet address, transaction hash</li>
                  <li><strong>faceVectors/{'{uuid}'}:</strong> 128-d float array embedding, UUID, createdAt</li>
                  <li><strong>scans/{'{scanId}'}:</strong> Domain, status, progress, currentPhase, findings[], summary</li>
                  <li><strong>scanreturn/{'{userId}'}:</strong> Array of scan references (scanId, domain, createdAt, status)</li>
                  <li><strong>contacts/(auto-ID):</strong> Contact form submissions with serverTimestamp</li>
                </ul>
              </div>
              <div className="audience-column">
                <h4>Firebase Auth Methods</h4>
                <ul>
                  <li>Google OAuth — <code>signInWithPopup</code></li>
                  <li>Email/Password — <code>createUserWithEmailAndPassword</code></li>
                  <li>Email Verification — <code>sendEmailVerification</code></li>
                  <li>Session persistence — <code>onAuthStateChanged</code></li>
                  <li>UUID v4 generated per user, passed via URL <code>?id=</code> params</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section number="8.0" title="AI Models & API Integration (Deep Dive)">
            <p>The backend integrates <strong>7 distinct LLM providers</strong>, orchestrating them via the MoA (Mixture of Agents) swarm. Each agent is instantiated with a specific temperature and prompt template based on its empirical strengths:</p>
            <ul className="step-list">
              <li><strong>Gemini 1.5 Flash (Google):</strong> <em>MasterAgent</em> — Operates with temperature 0.3. Responsible for pre-scan fingerprinting, attack surface analysis, and dynamically deciding which specialist agents to activate to conserve API quotas. It also generates the per-vulnerability remediation code (Node.js, Python, PHP, Java) in the final reporting phase.</li>
              <li><strong>NVIDIA Llama 3.1 70B:</strong> <em>SqliAgent</em> — Excels at deep structural reasoning. Handles SQL injection variant selection (error-based, boolean-blind, time-based with SLEEP 5s, UNION-based). Identifies backend database engines (MySQL, PostgreSQL, Oracle, MSSQL) from stack traces.</li>
              <li><strong>Groq Llama 3 70B:</strong> <em>XssAgent</em> & <em>IdorAgent</em> — Chosen for ultra-fast token generation. For XSS, it rapidly parses HTML to identify if the <code>ZER0N_XSS_{'{random}'}</code> marker reflected in an attribute, script tag, or raw HTML context. For IDOR, it structurally compares response bodies of sequential IDs.</li>
              <li><strong>Cohere Command-R:</strong> <em>SSRFAgent</em> — Optimized for RAG and information retrieval tasks. It analyses SSRF probes targeting AWS (169.254.169.254), GCP (metadata.google.internal), Azure, Redis (dict://), local files (file:///etc/passwd), and IPv6 loopbacks.</li>
              <li><strong>Mistral 7B:</strong> <em>AuthAgent</em> — Focuses on authentication failure pattern recognition. Tests OWASP A07:2021 categories, including default credentials, missing auth headers, session fixation, and broken JWT signature validation.</li>
              <li><strong>Cerebras llama3.1-8b:</strong> <em>Two-Stage Judge (Stage 1)</em> — Provides sub-second inference for initial triage. Classifies every raw finding as: Confirmed, False Positive, or Needs Further Review.</li>
              <li><strong>SambaNova DeepSeek-R1:</strong> <em>Two-Stage Judge (Stage 2)</em> — Activated only for "Needs Further Review" findings. Uses deep chain-of-thought reasoning to analyse the payload, HTTP response, environmental context, and the RAG memory before issuing a final verdict. False positives are logged to <code>rag-memory.json</code>.</li>
              <li><strong>Cloudflare Workers AI:</strong> Supplementary reasoning for the IdorAgent to confirm complex privilege escalation paths across different user roles.</li>
            </ul>
          </Section>

          <Section number="9.0" title="Security & Academic Context">
            <p>ZerOn is heavily grounded in established academic and industry cybersecurity standards, validating its viability as a production-grade enterprise tool rather than just a prototype.</p>
            <div className="audience-split">
              <div className="audience-column">
                <h4>Industry Standards Alignment</h4>
                <ul>
                  <li><strong>OWASP Top 10 (2021):</strong> Comprehensive coverage of all 10 risk categories, particularly A01 (Broken Access Control), A03 (Injection), and A10 (SSRF).</li>
                  <li><strong>CWE/SANS Top 25:</strong> Actively hunts for CWE-89 (SQLi), CWE-79 (XSS), CWE-918 (SSRF), CWE-287 (Improper Auth), CWE-284 (Improper Access Control), and CWE-200 (Info Exposure).</li>
                  <li><strong>CVSS v3.1 Scoring:</strong> Automatically calculates base scores for all confirmed findings based on Attack Vector, Complexity, Privileges Required, and User Interaction.</li>
                  <li><strong>Reporting Standards:</strong> Exports findings in formats compatible with HackerOne and Bugcrowd submission guidelines.</li>
                  <li><strong>Privacy & GDPR:</strong> The biometric face mesh extraction runs entirely within the client's browser; no PII video frames or images are ever transmitted to the backend.</li>
                  <li><strong>Blockchain Tamper-Evidence:</strong> All verified proofs are anchored on the Avalanche Fuji testnet using SHA-256 hashes.</li>
                </ul>
              </div>
              <div className="audience-column">
                <h4>Research Contributions (Zer0n-Bench)</h4>
                <ul>
                  <li><strong>Zer0n-Bench v1.0:</strong> A seminal 10,050-entry multi-domain vulnerability benchmark dataset created during the project's development.</li>
                  <li><strong>Domain Coverage:</strong> Spans 13 CWE types across Web Applications, Smart Contracts (Solidity), and APIs.</li>
                  <li><strong>False Positive Reduction:</strong> The implementation of the Red/Blue Team consensus mechanism (the two-stage judge) successfully reduced the false positive rate from 14% to 6%.</li>
                  <li><strong>Validation Metrics:</strong> Achieved an inter-annotator agreement of κ = 0.76 (substantial agreement) during human validation phases.</li>
                  <li><strong>Blockchain Anchoring:</strong> Demonstrates per-entry integrity proofs on the Avalanche C-Chain to solve the "trust gap" in open-source datasets.</li>
                  <li><strong>Publications:</strong> Paper accepted in the Data4SoftSec Workshop (IEEE co-related) and submitted to the 2nd IEEE Cyber AI 2026 Conference.</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section number="10.0" title="Smart Contracts & Escrow Mechanics">
             <p>The decentralised nature of ZerOn relies on Ethereum Virtual Machine (EVM) compatible smart contracts. These contracts replace traditional bug bounty platforms (like HackerOne) acting as trusted intermediaries.</p>
             <ul className="step-list">
               <li><strong>The Ping-Pong Model:</strong> Enterprises ("Pings") deploy a BountyEscrow contract funded with a cryptocurrency bounty pool. Security bots ("Pongs") continuously scan these targets.</li>
               <li><strong>Oracle Verification:</strong> When a bot discovers a vulnerability, it does not directly claim the funds. Instead, it uploads the Proof of Concept (PoC) to IPFS. A decentralised oracle network (representing the Two-Stage AI Judge) verifies the IPFS proof.</li>
               <li><strong>Trustless Execution:</strong> Upon oracle verification, the contract's <code>releaseBounty(address botWallet, string ipfsHash)</code> function is triggered. The contract checks its balance, emits a <code>VulnerabilityVerified</code> event, and automatically transfers the funds to the bot's Web3 wallet address.</li>
               <li><strong>Supported Networks:</strong> Developed using Solidity 0.8.x and hardhat. Deployed on Avalanche Fuji Testnet for low-latency, low-fee transactions, with mainnet architecture supporting Ethereum and Arbitrum.</li>
             </ul>
          </Section>

          <Section number="11.0" title="Tech Stack Summary">
            <div className="architecture-grid">
              {[
                { title: 'Frontend', items: ['React 18, Vite 5, React Router v7', 'Framer Motion, Lucide React', 'Recharts, Lottie React', 'face-api.js 0.22, @mediapipe/face_mesh', 'ethers.js v6, socket.io-client v4', 'Firebase v12, jsPDF, html2canvas'] },
                { title: 'Backend', items: ['Node.js 18, Express.js', 'Socket.io v4, Puppeteer', 'Axios, Cheerio, node-fetch', 'Firebase Admin SDK', 'PDFKit, uuid, bcrypt', 'dotenv, nodemon, cors'] },
                { title: 'AI / LLMs', items: ['Google Gemini 1.5 Flash', 'NVIDIA Llama 3.1 70B', 'Groq Llama 3 70B (2×)', 'Cohere Command-R', 'Mistral 7B', 'Cerebras llama3.1-8b', 'SambaNova DeepSeek-R1'] },
                { title: 'Web3 / Infra', items: ['Ethers.js v6 (MetaMask + Core Wallet)', 'Avalanche Fuji Testnet', 'IPFS / Pinata for proof storage', 'Firebase Firestore (NoSQL)', 'Firebase Auth (Google + Email)', 'Vercel (frontend deployment)'] },
              ].map(({ title, items }) => (
                <div key={title} className="arch-card">
                  <h3 style={{ marginBottom: '0.75rem' }}>{title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.map(item => <li key={item} style={{ padding: '0.2rem 0', color: '#ccc', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>▸ {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

        </div>

        <div className="document-footer">
          <p>© 2026 ZerOn Technologies — Academic Project</p>
          <p>Parul University, FET — Department of Computer Science & Engineering</p>
          <p>This document is prepared for platform evaluation purposes. All scanning performed on authorised targets only.</p>
        </div>
      </div>
    </div>
  );
};

export default Whitepaper;
