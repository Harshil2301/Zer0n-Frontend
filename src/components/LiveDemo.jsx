import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Coins,
  ExternalLink
} from 'lucide-react'
import './LiveDemo.css'

const LiveDemo = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [currentScan, setCurrentScan] = useState(0)
  const [findings, setFindings] = useState([])
  const [payoutStatus, setPayoutStatus] = useState('idle')
  const [cycleCount, setCycleCount] = useState(0)
  const [hasCompletedCycle, setHasCompletedCycle] = useState(false)

  const scanTargets = [
    'api.example.com/users',
    'web.example.com/login',
    'admin.example.com/dashboard',
    'shop.example.com/checkout'
  ]

  const vulnerabilityTypes = [
    { type: 'SQL Injection', severity: 'critical', reward: '2.5 ETH' },
    { type: 'XSS Vulnerability', severity: 'high', reward: '1.2 ETH' },
    { type: 'Open Port 22', severity: 'medium', reward: '0.8 ETH' },
    { type: 'Weak Authentication', severity: 'high', reward: '1.5 ETH' }
  ]

  const mockFindings = [
    {
      id: 1,
      target: 'api.example.com/users',
      vulnerability: 'SQL Injection',
      severity: 'critical',
      reward: '2.5 ETH',
      status: 'verified',
      timestamp: '2025-01-15 14:23:17',
      bot: 'RedBot-Alpha-001'
    },
    {
      id: 2,
      target: 'web.example.com/login',
      vulnerability: 'XSS Vulnerability',
      severity: 'high',
      reward: '1.2 ETH',
      status: 'processing',
      timestamp: '2025-01-15 14:25:43',
      bot: 'RedBot-Beta-007'
    }
  ]

  useEffect(() => {
    if (isScanning && !hasCompletedCycle) {
      const scanInterval = setInterval(() => {
        setCurrentScan((prev) => {
          const nextScan = (prev + 1) % scanTargets.length
          if (nextScan === 0 && prev === scanTargets.length - 1) {
            // Completed one full cycle
            setCycleCount(count => count + 1)
            if (cycleCount >= 0) { // Stop after first complete cycle
              setHasCompletedCycle(true)
              setIsScanning(false)
            }
          }
          return nextScan
        })
      }, 2000)

      const findingTimeout = setTimeout(() => {
        const randomVuln = vulnerabilityTypes[Math.floor(Math.random() * vulnerabilityTypes.length)]
        const newFinding = {
          id: Date.now(),
          target: scanTargets[currentScan],
          vulnerability: randomVuln.type,
          severity: randomVuln.severity,
          reward: randomVuln.reward,
          status: 'found',
          timestamp: new Date().toLocaleString(),
          bot: `RedBot-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        }
        setFindings(prev => [newFinding, ...prev.slice(0, 4)])
        setPayoutStatus('processing')
        
        setTimeout(() => setPayoutStatus('completed'), 3000)
      }, 5000)

      return () => {
        clearInterval(scanInterval)
        clearTimeout(findingTimeout)
      }
    }
  }, [isScanning, currentScan, hasCompletedCycle, cycleCount])

  const toggleScanning = () => {
    setIsScanning(!isScanning)
    if (!isScanning) {
      setPayoutStatus('idle')
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      default: return '#64748b'
    }
  }

  return (
    <section id="demo" className="live-demo section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">
            <span className="terminal-prefix">//</span>
            <span className="title-main">See It In Action</span>
          </h2>
          <p className="section-subtitle">
            Watch autonomous security bots discover vulnerabilities and trigger instant smart contract payouts
          </p>
        </motion.div>

        <div className="demo-container">
          {/* Control Panel */}
          <motion.div
            className="demo-controls"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <button 
              className={`demo-button ${isScanning ? 'scanning' : ''}`}
              onClick={toggleScanning}
            >
              {isScanning ? <Pause size={20} /> : <Play size={20} />}
              {isScanning ? 'Stop Scanning' : 'Start Demo'}
            </button>
            <div className="demo-status">
              <div className="status-item">
                <Activity size={16} />
                <span>Bots Active: {isScanning ? '24' : '0'}</span>
              </div>
              <div className="status-item">
                <Shield size={16} />
                <span>Targets: {scanTargets.length}</span>
              </div>
            </div>
          </motion.div>

          {/* Main Demo Dashboard */}
          <div className="demo-dashboard">
            
            {/* Scanning Section */}
            <motion.div
              className="dashboard-section scanning-section"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="section-header-small">
                <h4>Real-time Scanning</h4>
                <div className={`scanning-indicator ${isScanning ? 'active' : ''}`}>
                  <div className="pulse-dot"></div>
                  {isScanning ? 'Scanning...' : 'Idle'}
                </div>
              </div>
              
              <div className="targets-list">
                {scanTargets.map((target, index) => (
                  <motion.div
                    key={target}
                    className={`target-item ${index === currentScan && isScanning ? 'active' : ''}`}
                    animate={index === currentScan && isScanning ? {
                      borderColor: '#00d4ff',
                      boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
                    } : {}}
                  >
                    <div className="target-url">{target}</div>
                    <div className="target-status">
                      {index === currentScan && isScanning ? (
                        <motion.div 
                          className="scanning-progress"
                          animate={{ width: ['0%', '100%'] }}
                          transition={{ duration: 2, ease: 'easeInOut' }}
                        />
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Findings Section */}
            <motion.div
              className="dashboard-section findings-section"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="section-header-small">
                <h4>Vulnerability Findings</h4>
                <div className="findings-count">{findings.length + mockFindings.length} Total</div>
              </div>
              
              <div className="findings-list">
                <AnimatePresence>
                  {[...findings, ...mockFindings].slice(0, 4).map((finding) => (
                    <motion.div
                      key={finding.id}
                      className="finding-item"
                      initial={{ opacity: 0, x: 50, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -50, height: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="finding-header">
                        <div className="finding-severity">
                          <AlertTriangle 
                            size={16} 
                            style={{ color: getSeverityColor(finding.severity) }}
                          />
                          <span className="severity-text" style={{ color: getSeverityColor(finding.severity) }}>
                            {finding.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="finding-reward gradient-text">
                          <Coins size={14} />
                          {finding.reward}
                        </div>
                      </div>
                      <div className="finding-content">
                        <div className="finding-title">{finding.vulnerability}</div>
                        <div className="finding-target">{finding.target}</div>
                        <div className="finding-meta">
                          <span className="finding-bot">{finding.bot}</span>
                          <span className="finding-time">
                            <Clock size={12} />
                            {finding.timestamp}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Payout Section */}
            <motion.div
              className="dashboard-section payout-section"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="section-header-small">
                <h4>Smart Contract Payouts</h4>
                <div className={`payout-status ${payoutStatus}`}>
                  {payoutStatus === 'idle' && <Clock size={16} />}
                  {payoutStatus === 'processing' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Activity size={16} />
                    </motion.div>
                  )}
                  {payoutStatus === 'completed' && <CheckCircle size={16} />}
                  <span>
                    {payoutStatus === 'idle' && 'Waiting for findings...'}
                    {payoutStatus === 'processing' && 'Verifying proof...'}
                    {payoutStatus === 'completed' && 'Payment sent!'}
                  </span>
                </div>
              </div>
              
              <div className="payout-details">
                <div className="payout-item">
                  <Database size={16} />
                  <span>Proof Hash: 0x4f5b2a...</span>
                  <ExternalLink size={14} />
                </div>
                <div className="payout-item">
                  <Coins size={16} />
                  <span>Amount: {findings.length > 0 ? findings[0].reward : '0.0 ETH'}</span>
                </div>
                <div className="payout-item">
                  <Shield size={16} />
                  <span>Contract: 0xa7b8c9...</span>
                  <ExternalLink size={14} />
                </div>
              </div>

              <AnimatePresence>
                {payoutStatus === 'completed' && (
                  <motion.div
                    className="payout-success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="success-icon" />
                    <span>Payout completed successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Demo Info */}
        <motion.div
          className="demo-info"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="info-terminal">
            <div className="info-header">
              <div className="terminal-controls">
                <span className="control-dot red"></span>
                <span className="control-dot yellow"></span>
                <span className="control-dot green"></span>
              </div>
              <span className="terminal-tab">demo-info.md</span>
            </div>
            <div className="info-content">
              <div className="info-line">
                <span className="info-prompt">// INFO:</span>
                <span className="info-text">Simulated autonomous red team platform</span>
              </div>
              <div className="info-line">
                <span className="info-prompt">// REAL:</span>
                <span className="info-text">Continuous scanning + instant crypto payouts</span>
              </div>
              <div className="info-status">
                <span className="status-indicator">●</span>
                <span className="status-text">Live system processes 24/7 with smart contract automation</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default LiveDemo
