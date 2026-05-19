import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, 
  Bot, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  Cpu, 
  Clock, 
  Award,
  ArrowRight,
  X
} from 'lucide-react'
import GlitchText from './GlitchText'
import './DualAudience.css'

const DualAudience = () => {
  const [showModal, setShowModal] = useState(false)

  const companyFeatures = [
    {
      icon: Shield,
      title: "Automated Security",
      description: "AI-powered vulnerability detection with zero-day threat analysis",
      metric: "99.9% uptime"
    },
    {
      icon: DollarSign,
      title: "Pay-Per-Find",
      description: "Only pay for verified vulnerabilities, not false positives",
      metric: "70% cost savings"
    },
    {
      icon: Clock,
      title: "Real-Time Alerts",
      description: "Instant notifications with severity classification and remediation steps",
      metric: "<1min response"
    }
  ]

  const operatorFeatures = [
    {
      icon: Cpu,
      title: "Passive Income",
      description: "Deploy security bots and earn from successful vulnerability discoveries",
      metric: "$5K+ monthly"
    },
    {
      icon: Clock,
      title: "Instant Payouts",
      description: "Cryptocurrency payments released automatically via smart contracts",
      metric: "<30 seconds"
    },
    {
      icon: TrendingUp,
      title: "Scale & Earn",
      description: "Run multiple specialized bots across different security domains",
      metric: "10x multiplier"
    }
  ]

  const cardVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  }

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <section id="dual-audience" className="dual-audience section">
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
            <span className="title-main">Built for Everyone</span>
          </h2>
          <p className="section-subtitle">
            Whether you're securing your business or earning from security expertise
          </p>
        </motion.div>

        <div className="audience-cards">
          {/* For Companies Card */}
          <motion.div
            className="audience-card company-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="window-controls">
                  <span className="control close"></span>
                  <span className="control minimize"></span>
                  <span className="control maximize"></span>
                </div>
                <div className="terminal-title">companies.sh</div>
              </div>
              
              <div className="terminal-content">
                <div className="terminal-line">
                  <span className="prompt">root@zeron:~#</span>
                  <span className="command">cat /usr/bin/for-companies</span>
                </div>
                
                <div className="card-info">
                  <div className="info-header">
                    <Building size={24} className="info-icon" />
                    <div>
                      <h3 className="card-title">For Companies</h3>
                      <p className="card-subtitle">Enterprise Security Automation</p>
                    </div>
                  </div>
                  
                  <div className="features-grid">
                    {companyFeatures.map((feature, index) => (
                      <div key={index} className="feature-compact">
                        <feature.icon size={16} className="feature-icon-small" />
                        <div className="feature-info">
                          <div className="feature-title-row">
                            <span className="feature-title">{feature.title}</span>
                            <span className="feature-metric">{feature.metric}</span>
                          </div>
                          <p className="feature-desc">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="terminal-output">
                    <div className="output-line">✓ Automated scanning initialized</div>
                    <div className="output-line">✓ Threat detection active</div>
                    <div className="output-line">✓ Ready for deployment</div>
                  </div>
                  
                  <button className="terminal-btn">
                    ./start-securing --enterprise
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Bot Operators Card */}
          <motion.div
            className="audience-card operator-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="window-controls">
                  <span className="control close"></span>
                  <span className="control minimize"></span>
                  <span className="control maximize"></span>
                </div>
                <div className="terminal-title">operators.sh</div>
              </div>
              
              <div className="terminal-content">
                <div className="terminal-line">
                  <span className="prompt">bot@zeron:~$</span>
                  <span className="command">cat /opt/for-operators</span>
                </div>
                
                <div className="card-info">
                  <div className="info-header">
                    <Bot size={24} className="info-icon" />
                    <div>
                      <h3 className="card-title">For Bot Operators</h3>
                      <p className="card-subtitle">Monetize Security Expertise</p>
                    </div>
                  </div>
                  
                  <div className="features-grid">
                    {operatorFeatures.map((feature, index) => (
                      <div key={index} className="feature-compact">
                        <feature.icon size={16} className="feature-icon-small" />
                        <div className="feature-info">
                          <div className="feature-title-row">
                            <span className="feature-title">{feature.title}</span>
                            <span className="feature-metric">{feature.metric}</span>
                          </div>
                          <p className="feature-desc">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="terminal-output">
                    <div className="output-line">✓ Bot deployment ready</div>
                    <div className="output-line">✓ Earning algorithms loaded</div>
                    <div className="output-line">✓ Payout system active</div>
                  </div>
                  
                  <button 
                    className="terminal-btn"
                    onClick={() => setShowModal(true)}
                  >
                    ./deploy-bots --start-earning
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              className="feature-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Deploy Bot</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-content">
                <div className="feature-coming-soon">
                  <Bot size={32} className="feature-icon" />
                  <h4>FEATURE COMING SOON</h4>
                  <p>Bot deployment functionality is currently under development. Stay tuned for updates!</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Partnership Section */}
        <motion.div
          className="ecosystem-section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="ecosystem-terminal">
            <div className="terminal-header">
              <div className="window-controls">
                <span className="control close"></span>
                <span className="control minimize"></span>
                <span className="control maximize"></span>
              </div>
              <div className="terminal-title">ecosystem.md</div>
            </div>
            
            <div className="ecosystem-content">
              <div className="markdown-content">
                <div className="md-header">
                  <span className="md-hash">#</span>
                  <span className="md-title">Join the ZerOn Ecosystem</span>
                </div>
                
                <p className="md-description">
                  The first decentralized cybersecurity marketplace where companies get continuous protection and security experts earn fair compensation through blockchain-verified results.
                </p>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-indicator">-</div>
                    <div className="stat-content">
                      <span className="stat-key">Active Scans:</span>
                      <span className="stat-highlight">24/7</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-indicator">-</div>
                    <div className="stat-content">
                      <span className="stat-key">Payout Speed:</span>
                      <span className="stat-highlight">&lt;30s</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-indicator">-</div>
                    <div className="stat-content">
                      <span className="stat-key">Platform Fee:</span>
                      <span className="stat-highlight">0%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="cta-section">
                <button className="ecosystem-cta">
                  <span className="cta-prompt">&gt;</span>
                  <span className="cta-text">Get Early Access</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default DualAudience
