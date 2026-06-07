import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Activity, ExternalLink, ChevronRight, Loader } from 'lucide-react'
import './ThreatFeed.css'

const ThreatFeed = () => {
  const [threats, setThreats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Fetch from CIRCL CVE API (Free, no auth required, very reliable)
  useEffect(() => {
    const fetchThreats = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://cve.circl.lu/api/last')
        
        if (!response.ok) {
          throw new Error('Threat feed API unavailable')
        }

        const data = await response.json()
        
        // Filter and format the top 15 most critical recent CVEs
        const formattedThreats = data
          .filter(cve => cve.cvss && cve.cvss > 5.0) // Only medium to critical
          .sort((a, b) => b.cvss - a.cvss) // Highest CVSS first
          .slice(0, 15)
          .map(cve => ({
            id: cve.id,
            score: cve.cvss,
            severity: cve.cvss >= 9.0 ? 'CRITICAL' : cve.cvss >= 7.0 ? 'HIGH' : 'MEDIUM',
            summary: cve.summary.length > 200 ? cve.summary.substring(0, 200) + '...' : cve.summary,
            published: new Date(cve.Published).toLocaleDateString()
          }))

        if (formattedThreats.length > 0) {
          setThreats(formattedThreats)
        } else {
          throw new Error('No critical threats found in recent window')
        }
      } catch (err) {
        console.error('Threat feed error:', err)
        // Fallback to hardcoded recent criticals if API is blocked by CORS/Adblock
        setThreats([
          { id: 'CVE-2024-3094', score: 10.0, severity: 'CRITICAL', summary: 'XZ Utils supply chain compromise allowing unauthenticated remote code execution.', published: '2024-03-29' },
          { id: 'CVE-2024-21626', score: 8.6, severity: 'HIGH', summary: 'Container breakout vulnerability in runc allowing host filesystem access.', published: '2024-01-31' },
          { id: 'CVE-2024-27198', score: 9.8, severity: 'CRITICAL', summary: 'JetBrains TeamCity authentication bypass allowing RCE.', published: '2024-03-04' },
          { id: 'CVE-2023-46805', score: 8.2, severity: 'HIGH', summary: 'Ivanti Connect Secure authentication bypass vulnerability.', published: '2024-01-10' },
          { id: 'CVE-2024-3400', score: 10.0, severity: 'CRITICAL', summary: 'Palo Alto Networks PAN-OS command injection vulnerability in GlobalProtect feature.', published: '2024-04-12' },
          { id: 'CVE-2023-4966', score: 7.5, severity: 'HIGH', summary: 'Citrix NetScaler ADC and Gateway information disclosure vulnerability.', published: '2023-10-10' }
        ])
        setError('Using cached threat data')
      } finally {
        setLoading(false)
      }
    }

    fetchThreats()
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
