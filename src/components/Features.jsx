import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './Features.css'

// --- Animated Visuals (SVG-based, hacker aesthetic) ---

const RadarVisual = () => {
  return (
    <div className="feat-visual radar-visual">
      <svg viewBox="0 0 120 120" className="radar-svg">
        <circle cx="60" cy="60" r="55" className="radar-ring" />
        <circle cx="60" cy="60" r="38" className="radar-ring" />
        <circle cx="60" cy="60" r="20" className="radar-ring" />
        <line x1="60" y1="60" x2="60" y2="5" className="radar-cross" />
        <line x1="60" y1="60" x2="115" y2="60" className="radar-cross" />
        <line x1="60" y1="60" x2="60" y2="115" className="radar-cross" />
        <line x1="60" y1="60" x2="5" y2="60" className="radar-cross" />
        <line x1="60" y1="60" x2="109" y2="11" className="radar-sweep-line" />
        <circle cx="85" cy="30" r="3" className="radar-blip blip-1" />
        <circle cx="40" cy="72" r="2.5" className="radar-blip blip-2" />
        <circle cx="70" cy="88" r="2" className="radar-blip blip-3" />
        <circle cx="28" cy="45" r="2" className="radar-blip blip-4" />
      </svg>
    </div>
  )
}

const BlockchainVisual = () => {
  const blocks = [
    { x: 10, label: '#A3F' },
    { x: 42, label: '#9C2' },
    { x: 74, label: '#B7E' },
  ]
  return (
    <div className="feat-visual chain-visual">
      <svg viewBox="0 0 120 60" className="chain-svg">
        {blocks.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y="15" width="30" height="30" rx="3" className="chain-block" />
            <text x={b.x + 15} y="32" className="chain-label" textAnchor="middle">{b.label}</text>
            {i < blocks.length - 1 && (
              <>
                <line x1={b.x + 30} y1="30" x2={b.x + 42} y2="30" className="chain-link" />
                <circle cx={b.x + 36} cy="30" r="2" className="chain-dot" style={{ animationDelay: `${i * 0.4}s` }} />
              </>
            )}
          </g>
        ))}
        <line x1="5" y1="30" x2="10" y2="30" className="chain-link" />
        <line x1="104" y1="30" x2="115" y2="30" className="chain-link" />
        <circle cx="5" cy="30" r="3" className="chain-end-dot" />
        <circle cx="115" cy="30" r="3" className="chain-end-dot" style={{ animationDelay: '0.8s' }} />
      </svg>
      <div className="chain-hash-stream">
        {['0x4a3b...', '0x9f2c...', '0xb71e...'].map((h, i) => (
          <span key={i} className="hash-tag" style={{ animationDelay: `${i * 0.6}s` }}>{h}</span>
        ))}
      </div>
    </div>
  )
}

const ContractVisual = () => {
  const lines = [
    { text: 'function execute(', color: '#00ff41' },
    { text: '  address to,', color: '#aaaaaa' },
    { text: '  uint256 amount', color: '#aaaaaa' },
    { text: ') external {', color: '#00ff41' },
    { text: '  token.transfer', color: '#00ccff' },
    { text: '    (to, amount);', color: '#aaaaaa' },
    { text: '}', color: '#00ff41' },
  ]
  return (
    <div className="feat-visual contract-visual">
      {lines.map((line, i) => (
        <div
          key={i}
          className="contract-line"
          style={{ animationDelay: `${i * 0.15}s`, color: line.color }}
        >
          <span className="contract-ln">{String(i + 1).padStart(2, '0')}</span>
          <span>{line.text}</span>
        </div>
      ))}
      <span className="contract-cursor">▊</span>
    </div>
  )
}

const NetworkVisual = () => {
  const nodes = [
    { cx: 20, cy: 30 }, { cx: 60, cy: 10 }, { cx: 100, cy: 30 },
    { cx: 15, cy: 70 }, { cx: 60, cy: 55 }, { cx: 105, cy: 70 },
    { cx: 40, cy: 90 }, { cx: 80, cy: 90 },
  ]
  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5],
    [3, 6], [4, 7], [5, 7], [6, 7],
  ]
  return (
    <div className="feat-visual network-visual">
      <svg viewBox="0 0 120 105" className="network-svg">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].cx} y1={nodes[a].cy}
            x2={nodes[b].cx} y2={nodes[b].cy}
            className="net-edge"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.cx} cy={n.cy} r="5"
            className="net-node"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </svg>
    </div>
  )
}

const visuals = {
  radar: <RadarVisual />,
  chain: <BlockchainVisual />,
  contract: <ContractVisual />,
  network: <NetworkVisual />,
}

// --- Feature data ---
const features = [
  {
    id: 'security',
    tag: '01',
    title: 'SECURITY AUTOMATION',
    description: 'ZerOn provides automated security scanning and vulnerability detection for smart contracts and dApps. Real-time monitoring with AI-powered threat analysis ensures comprehensive protection against emerging security risks.',
    visual: 'radar',
    code: `const scanner = new ZerOnScanner({
  target: contractAddress,
  scanTypes: ['sqli','xss','reentrancy']
});
const result = await scanner.scan();
if (result.vulnerabilities.length > 0) {
  await reportVulnerability(result);
}`,
  },
  {
    id: 'blockchain',
    tag: '02',
    title: 'BLOCKCHAIN STORAGE',
    description: 'Immutable proof storage on blockchain with IPFS integration. All security reports and findings are cryptographically verified and stored permanently, ensuring audit trails and compliance requirements are met.',
    visual: 'chain',
    code: `contract ZerOnVault {
  mapping(bytes32 => Report) reports;
  function storeReport(bytes32 hash,
    Report memory report)
    external onlyValidator {
    reports[hash] = report;
    emit SecurityReportStored(hash);
  }
}`,
  },
  {
    id: 'smart',
    tag: '03',
    title: 'SMART CONTRACTS',
    description: 'Automated payout system using smart contracts for verified vulnerabilities. Instant cryptocurrency payments when security issues are confirmed, eliminating manual processes and payment delays.',
    visual: 'contract',
    code: `function processPayout(
  address researcher,
  uint256 amount,
  bytes32 vulnHash
) external onlyVerified(vulnHash) {
  token.transfer(researcher, amount);
  emit PayoutProcessed(researcher, amount);
}`,
  },
  {
    id: 'network',
    tag: '04',
    title: 'GLOBAL NETWORK',
    description: 'Distributed bot network providing worldwide coverage and reduced latency. Multiple scanning nodes ensure 24/7 security monitoring with regional compliance and optimized performance.',
    visual: 'network',
    code: `class ZerOnNode {
  async startScanning() {
    const targets = await this.getTargets();
    for (const target of targets) {
      const result = await this.scan(target);
      await this.reportResults(result);
    }
  }
}`,
  },
]

const Features = () => {
  const [hovered, setHovered] = useState(null)

  return (
    <section className="features section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">
            <span className="terminal-prefix">//</span>
            <span className="title-main">ZerOn Security Platform Features</span>
          </h2>
          <p className="section-subtitle">
            Advanced cybersecurity automation for Web3 applications with blockchain-verified results and instant cryptocurrency payouts for verified vulnerabilities.
          </p>
        </motion.div>

        <div className="toolkit-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className={`toolkit-card ${hovered === feature.id ? 'is-hovered' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHovered(feature.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Animated border sweep on hover */}
              <div className="card-border-sweep" />

              {/* Card Header */}
              <div className="card-header">
                <div className="card-header-left">
                  <span className="card-tag">[{feature.tag}]</span>
                  <h3 className="card-title">{feature.title}</h3>
                </div>
                <span className="learn-more">[LEARN MORE]</span>
              </div>

              {/* Body: description + visual */}
              <div className="card-content">
                <div className="content-left">
                  <p className="card-description">{feature.description}</p>
                </div>
                <div className="content-right">
                  <div className="visual-section">
                    {visuals[feature.visual]}
                  </div>
                </div>
              </div>

              {/* Code window */}
              <div className="code-section">
                <div className="code-window">
                  <div className="code-header">
                    <div className="window-controls">
                      <span className="control close" />
                      <span className="control minimize" />
                      <span className="control maximize" />
                    </div>
                    <span className="code-filename">zeron.{['blockchain', 'smart'].includes(feature.id) ? 'sol' : 'js'}</span>
                  </div>
                  <div className="code-content">
                    <pre><code>{feature.code}</code></pre>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
