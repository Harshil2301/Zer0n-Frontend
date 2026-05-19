import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, Bot, Network } from 'lucide-react'
import ParticleField from './ParticleField'
import DataStream from './DataStream'
import TerminalEffect from './TerminalEffect'
import './Hero.css'

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  const [showVideoModal, setShowVideoModal] = useState(false)

  const handleStartHunting = () => {
    window.location.href = '/face-scan'
  }

  const scrollToHowItWorks = () => {
    const section = document.querySelector('.how-it-works')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const terminalCommands = [
    'nmap -sS -O target.domain.com',
    'sqlmap -u "http://target.com/page?id=1" --dbs',
    'nikto -h http://target.com',
    'dirb http://target.com /usr/share/wordlists/dirb/common.txt',
    'hydra -l admin -P passwords.txt target.com ssh',
    'VULNERABILITIES DETECTED: 7 HIGH, 12 MEDIUM',
    'BOUNTY PAYMENT INITIATED: 0.5 ETH'
  ]

  return (
    <section className="hero">
      <div className="grid-overlay"></div>
      <ParticleField count={30} className="hero-particles" />
      <DataStream direction="vertical" density={8} className="background terminal-green sparse" />
      
      <motion.div 
        className="hero-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Text */}
        <motion.div 
          className="hero-welcome"
          variants={itemVariants}
        >
          <span className="terminal-prefix">//</span>
          <span className="terminal-text">WELCOME TO </span>
          <span className="terminal-highlight">ZERON</span>
        </motion.div>

        {/* Main Content - Left Side */}
        <div className="hero-main-layout">
          <div className="hero-content">
            <motion.h1 
              className="hero-title"
              variants={itemVariants}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <span>POWER UP WITH</span><br />
              <span>NEXT-GEN <span className="gradient-text">CYBER DEFENSE</span></span>
            </motion.h1>

            <motion.div 
              className="hero-features"
              variants={itemVariants}
            >
              <div className="feature-item">
                <span className="feature-number">_01 {'>'}</span>
                <span className="feature-title">SECURITY</span>
              </div>
              <div className="feature-item">
                <span className="feature-number">_02 {'>'}</span>
                <span className="feature-title">INCREASING SPEED</span>
              </div>
              <div className="feature-item">
                <span className="feature-number">_03 {'>'}</span>
                <span className="feature-title">AUTOMATION</span>
              </div>
            </motion.div>

            <motion.p 
              className="hero-description"
              variants={itemVariants}
            >
              Join our community and learn<br />
              how you can benefit from this<br />
              technology_
            </motion.p>

            <motion.div 
              className="hero-cta"
              variants={itemVariants}
            >
              <motion.button 
                className="btn-primary"
                onClick={handleStartHunting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                START HUNTING
              </motion.button>
              <motion.button 
                className="btn-secondary"
                onClick={() => window.location.href = '/whitepaper'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                WHITEPAPER
              </motion.button>
              <motion.button 
                className="btn-secondary"
                onClick={scrollToHowItWorks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                HOW IT WORKS
              </motion.button>
              <motion.div 
                className="play-button"
                onClick={() => setShowVideoModal(true)}
              >
                <span>▶</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side Content */}
          <motion.div 
            className="hero-right"
            variants={itemVariants}
          >

            <div className="terminal-display">
              <TerminalEffect commands={terminalCommands} />
            </div>
          </motion.div>
        </div>

        {/* Bottom Actor Model Text */}
        <motion.div 
          className="hero-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <div className="actor-model-text">
            Z E R O N &nbsp;&nbsp;&nbsp; M O D E L
          </div>
        </motion.div>
      </motion.div>

      {/* AI Avatar Video Modal */}
      {showVideoModal && (
        <div className="video-modal-overlay" onClick={() => setShowVideoModal(false)}>
          <motion.div 
            className="video-modal-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <span>ZERON_AI_AVATAR_DEMO.mp4</span>
              <button className="video-close-btn" onClick={() => setShowVideoModal(false)}>×</button>
            </div>
            <div className="video-placeholder">
              <video
                src="/ZERON_AI_AVATAR_DEMO.mp4"
                controls
                autoPlay
                style={{ width: '100%', borderRadius: '4px', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
              <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
                Demo presentation generated using D-ID AI Avatar technology
              </div>
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
                <Bot size={48} className="ai-bot-icon" />
                <h3>DEMO VIDEO NOT YET UPLOADED</h3>
                <p>Generate your script via HeyGen or Synthesia, export as <code>ZERON_AI_AVATAR_DEMO.mp4</code>, then place it in <code>public/</code>.</p>
                <div className="processing-bar"></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </section>
  )
}

export default Hero