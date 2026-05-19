import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Code, Database, Shield, Play, CheckCircle } from 'lucide-react'
import './HowItWorks.css'

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('init')

  const productTabs = [
    { id: 'init', label: 'Init', active: true },
    { id: 'scan', label: 'Scan', active: false },
    { id: 'verify', label: 'Verify', active: false }
  ]

  const codeBlocks = {
    init: {
      title: 'INITIALIZE SECURITY CONTRACT',
      code: `// Initialize ZerOn Security Contract
const contract = await ZerOn.init({
  target: "https://your-app.com",
  bounty: "0.5 ETH",
  scope: ["XSS", "SQLi", "CSRF"],
  duration: "30 days"
});

console.log("Contract deployed:", contract.address);
console.log("Bounty pool:", contract.balance);`,
      terminal: [
        '$ zeron init --target https://your-app.com',
        '✓ Smart contract deployed: 0x742d3...',
        '✓ Bounty pool funded: 0.5 ETH',
        '✓ Security bots activated',
        '',
        'Ready for vulnerability detection...'
      ]
    },
    scan: {
      title: 'AUTONOMOUS VULNERABILITY SCANNING',
      code: `// Security Bot Auto-Discovery
const scanner = new ZerOn.SecurityBot({
  patterns: vulnDatabase.getAllPatterns(),
  depth: "comprehensive",
  stealth: true
});

await scanner.scan(target)
  .onVulnerability((vuln) => {
    console.log(\`Found: \${vuln.type}\`);
    blockchain.submitProof(vuln.evidence);
  });`,
      terminal: [
        '$ zeron scan --comprehensive',
        'Scanning target: https://your-app.com',
        '━━━━━━━━━━━━━━━━━━━━━━━ 48%',
        '',
        '⚠️  SQL Injection detected',
        '⚠️  XSS vulnerability found',
        '✓  Evidence submitted to IPFS'
      ]
    },
    verify: {
      title: 'SMART CONTRACT VERIFICATION & PAYOUT',
      code: `// Automated Verification & Payment
contract.on('VulnerabilitySubmitted', async (evidence) => {
  const verification = await ipfs.verify(evidence);
  
  if (verification.isValid) {
    const payout = calculateBounty(evidence.severity);
    await contract.releaseFunds(evidence.finder, payout);
    
    console.log(\`Paid: \${payout} ETH\`);
  }
});`,
      terminal: [
        '$ zeron verify --evidence QmX7f2...',
        'Verifying vulnerability evidence...',
        '',
        '✓ Evidence cryptographically valid',
        '✓ Vulnerability confirmed: HIGH severity',
        '✓ Payment released: 0.35 ETH',
        '✓ Transaction: 0x9a4b2c1...'
      ]
    }
  }

  const processSteps = {
    init: {
      tag: '_01',
      title: 'BIOMETRIC SIGNUP',
      subheading: 'STAGE 1: BIOMETRIC IDENTITY KYC',
      description: 'ZerOn uses MediaPipe Face Mesh running at 30fps tracking 468 landmarks for high-assurance liveness verification. Real blinks are detected via Eye Aspect Ratio (EAR) and head yaw pose, preventing duplicate/Sybil accounts. Biometric embeddings are AES-256 encrypted at rest.',
      label1: 'LIVENESS DETECTED',
      value1: '99.9% CONFIDENCE',
      label2: 'ENCRYPTION STRENGTH',
      value2: 'AES-256',
      progressLabel: 'BIOMETRIC POOL LOCK',
      progressValue: '100%',
      btnLabel: 'LAUNCH IDENTITY KYC'
    },
    scan: {
      tag: '_02',
      title: 'MOA AGENT SWARM',
      subheading: 'MIXTURE OF AGENTS (MoA) ENGINE',
      description: 'Six specialist AI agents (NVIDIA Llama 3.1 70B, Groq Llama 3.3 70B, Cohere Command-R, Mistral) scan in parallel under Master Agent orchestration. Supported by a JSON RAG Memory store logging past false positive rejections for continuous learning.',
      label1: 'SPECIALIST SWARM',
      value1: '6 AI AGENTS',
      label2: 'KNOWLEDGE BASE',
      value2: 'RAG MEMORY ACTIVE',
      progressLabel: 'SWARM SCAN DEPTH',
      progressValue: '85%',
      btnLabel: 'EXPLORE MOA AGENTS'
    },
    verify: {
      tag: '_03',
      title: 'JUDGE & PAYOUT',
      subheading: 'TWO-STAGE JUDGE & BLOCKCHAIN ESCROW',
      description: 'Raw findings undergo two-stage AI validation: Cerebras Llama 3.1 8b triage escalating to SambaNova DeepSeek-R1 chain-of-thought analysis. Confirmed findings trigger auto-payouts via Avalanche Fuji testnet smart contract oracle and IPFS pinning.',
      label1: 'JUDGING PIPELINE',
      value1: '2-STAGE AI VERDICT',
      label2: 'VERIFIED PAYOUT SPEED',
      value2: '<30 SECONDS',
      progressLabel: 'PAYOUT AUTOMATION',
      progressValue: '100%',
      btnLabel: 'CHECK BOUNTY ESCROW'
    }
  };

  return (
    <section className="how-it-works section">
      <div className="container">
        {/* Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">
            <span className="terminal-prefix">//</span>
            <span className="title-text">HOW IT WORKS</span>
          </h2>
        </motion.div>

        {/* Main Content Grid */}
        <div className="works-grid">
          {/* Left Side - Product Tabs */}
          <motion.div
            className="product-section"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="product-tabs">
              {productTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="code-window">
              <div className="code-header">
                <div className="window-controls">
                  <span className="control close"></span>
                  <span className="control minimize"></span>
                  <span className="control maximize"></span>
                </div>
                <div className="code-title">{codeBlocks[activeTab].title}</div>
              </div>
              <div className="code-content">
                <pre>
                  <code>{codeBlocks[activeTab].code}</code>
                </pre>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="terminal-window">
              <div className="terminal-header">
                <Terminal size={16} />
                <span>ZerOn Terminal</span>
              </div>
              <div className="terminal-content">
                {codeBlocks[activeTab].terminal.map((line, index) => (
                  <motion.div
                    key={index}
                    className="terminal-line"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Process Overview */}
          <motion.div
            className="process-section"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="process-header">
              <span className="step-indicator">{processSteps[activeTab].tag} {'>'}</span>
              <h3>{processSteps[activeTab].title}</h3>
            </div>

            <div className="process-description">
              <h4>{processSteps[activeTab].subheading}</h4>
              <p>{processSteps[activeTab].description}</p>
            </div>

            <div className="process-stats">
              <div className="stat-item">
                <div className="stat-label">{processSteps[activeTab].label1}</div>
                <div className="stat-value">{processSteps[activeTab].value1}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">{processSteps[activeTab].label2}</div>
                <div className="stat-value">{processSteps[activeTab].value2}</div>
              </div>
            </div>

            <motion.button
              className="foundation-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {processSteps[activeTab].btnLabel}
            </motion.button>

            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-label">{processSteps[activeTab].progressLabel}</div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  key={activeTab}
                  initial={{ width: "0%" }}
                  animate={{ width: processSteps[activeTab].progressValue }}
                  transition={{ duration: 4, ease: "easeOut" }}
                />
              </div>
              <div className="progress-text">
                <AnimatedNumber 
                  targetValue={parseInt(processSteps[activeTab].progressValue)} 
                  duration={4000} 
                  key={activeTab} 
                />%
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const AnimatedNumber = ({ targetValue, duration }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Use easeOut quad
      const easeOut = 1 - (1 - percentage) * (1 - percentage);
      const currentVal = Math.floor(easeOut * targetValue);
      
      setValue(currentVal);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setValue(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue, duration]);

  return <span>{value}</span>;
}

export default HowItWorks;
