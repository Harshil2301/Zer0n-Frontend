import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Activity, ExternalLink, ChevronRight, Loader } from 'lucide-react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import './ThreatFeed.css'

const ThreatFeed = () => {
  const [threats, setThreats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [broadcasts, setBroadcasts] = useState([])

  // Listen for admin global broadcasts (only when authenticated)
  useEffect(() => {
    let unsubscribe = () => {}
    try {
      const broadcastsRef = collection(db, 'broadcasts')
      const q = query(broadcastsRef, orderBy('createdAt', 'desc'))
      unsubscribe = onSnapshot(q, (snapshot) => {
        const activeBroadcasts = []
        snapshot.forEach(doc => {
          const data = doc.data()
          if (data.active) {
            activeBroadcasts.push({ id: doc.id, ...data })
          }
        })
        setBroadcasts(activeBroadcasts)
      }, () => {
        // Silently ignore permission errors (e.g. dev-bypass / unauthenticated)
      })
    } catch (_) {
      // Ignore
    }
    return () => unsubscribe()
  }, [])

  // Load curated CVE threat data
  useEffect(() => {
    // Use hardcoded curated data to avoid CORS/proxy issues in dev
    setThreats([
      { id: 'CVE-2024-3094', score: 10.0, severity: 'CRITICAL', summary: 'XZ Utils supply chain compromise allowing unauthenticated remote code execution via SSH backdoor.', published: '2024-03-29' },
      { id: 'CVE-2024-3400', score: 10.0, severity: 'CRITICAL', summary: 'Palo Alto Networks PAN-OS command injection in GlobalProtect feature allowing unauthenticated RCE.', published: '2024-04-12' },
      { id: 'CVE-2024-27198', score: 9.8, severity: 'CRITICAL', summary: 'JetBrains TeamCity authentication bypass allowing remote code execution without credentials.', published: '2024-03-04' },
      { id: 'CVE-2024-6387', score: 8.1, severity: 'HIGH', summary: 'OpenSSH regreSSHion race condition allowing unauthenticated RCE on glibc-based Linux systems.', published: '2024-07-01' },
      { id: 'CVE-2024-21626', score: 8.6, severity: 'HIGH', summary: 'Container breakout vulnerability in runc allowing host filesystem access from containers.', published: '2024-01-31' },
      { id: 'CVE-2023-46805', score: 8.2, severity: 'HIGH', summary: 'Ivanti Connect Secure authentication bypass vulnerability actively exploited in the wild.', published: '2024-01-10' },
      { id: 'CVE-2023-4966', score: 7.5, severity: 'HIGH', summary: 'Citrix NetScaler ADC and Gateway information disclosure vulnerability (Citrix Bleed).', published: '2023-10-10' },
      { id: 'CVE-2024-1709', score: 10.0, severity: 'CRITICAL', summary: 'ConnectWise ScreenConnect authentication bypass allowing full takeover of remote systems.', published: '2024-02-21' },
      { id: 'CVE-2024-4577', score: 9.8, severity: 'CRITICAL', summary: 'PHP CGI argument injection vulnerability on Windows allowing remote code execution.', published: '2024-06-06' },
      { id: 'CVE-2024-23897', score: 9.8, severity: 'CRITICAL', summary: 'Jenkins arbitrary file read via CLI allowing remote code execution on Jenkins servers.', published: '2024-01-24' },
    ])
    setLoading(false)
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    }
  }

  const getSeverityDot = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
      case 'HIGH': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
      case 'MEDIUM': return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'
      default: return 'bg-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="threat-feed-container loading">
        <Activity className="w-4 h-4 animate-pulse text-green-500" />
        <span>Initializing Global Threat Intel...</span>
      </div>
    )
  }

  if (threats.length === 0) return null

  return (
    <div className="threat-feed-container">
      <div className="threat-feed-header">
        <div className="threat-feed-title">
          <Activity className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="tracking-widest" style={{ fontSize: '1rem' }}>ACTIVE ZERO-DAY VULNERABILITIES</span>
        </div>
        <div className="threat-feed-title" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          Data Source: CIRCL / NVD
        </div>
      </div>

      <div className="threat-grid">
        {/* Render Admin Broadcasts First */}
        {broadcasts.map((broadcast) => (
          <motion.div
            key={broadcast.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="threat-card"
            style={{ 
              border: '1px solid rgba(255, 68, 68, 0.5)',
              background: 'linear-gradient(45deg, rgba(255, 68, 68, 0.1), transparent)'
            }}
          >
            <div className="threat-top-row">
              <div className="threat-id-wrapper">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                <span className="threat-id" style={{ color: '#ff4444', fontSize: '1.1rem', letterSpacing: '2px' }}>
                  ADMIN BROADCAST
                </span>
              </div>
              <div className={`threat-badge ${getSeverityColor(broadcast.severity)}`}>
                {broadcast.severity}
              </div>
            </div>
            
            <h3 style={{ margin: '12px 0 8px 0', color: '#fff', fontSize: '1.2rem' }}>{broadcast.title}</h3>
            
            <p className="threat-summary" style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {broadcast.message}
            </p>
            <div className="threat-date" style={{ marginTop: '12px' }}>
              <span style={{ color: '#ff4444' }}>{broadcast.severity} ALERT</span>
              <span>{broadcast.createdAt ? new Date(broadcast.createdAt.toDate()).toLocaleString() : 'Just now'}</span>
            </div>
          </motion.div>
        ))}

        {threats.map((threat, index) => (
          <motion.div
            key={threat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="threat-card"
          >
            <div className="threat-top-row">
              <div className="threat-id-wrapper">
                <div className={`w-2 h-2 rounded-full ${getSeverityDot(threat.severity)} animate-pulse`} />
                <a 
                  href={`https://nvd.nist.gov/vuln/detail/${threat.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="threat-id"
                >
                  {threat.id}
                  <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                </a>
              </div>
              <div className={`threat-badge ${getSeverityColor(threat.severity)}`}>
                CVSS: {threat.score.toFixed(1)}
              </div>
            </div>
            
            <p className="threat-summary">
              {threat.summary}
            </p>
            <div className="threat-date">
              <span>{threat.severity}</span>
              <span>{threat.published}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Decorative scanline */}
      <div className="threat-scanline" />
    </div>
  )
}

export default ThreatFeed
