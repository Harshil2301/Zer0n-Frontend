import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, Shield, Send, Globe, AlertCircle, Terminal, Activity, Settings } from 'lucide-react'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection } from 'firebase/firestore'
import { db } from '../../config/firebase'
import io from 'socket.io-client'
import { useLanguage } from '../../contexts/LanguageContext'

const NewScan = ({ userId, onNavigate }) => {
  const { t } = useLanguage()
  const domainInputRef = useRef(null)
  const [domain, setDomain] = useState('')
  const [sessionCookie, setSessionCookie] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userPlan, setUserPlan] = useState(null)
  const [scans, setScans] = useState([])
  const [error, setError] = useState('')

  // Socket and live progress state
  const [activeScanId, setActiveScanId] = useState(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanPhase, setScanPhase] = useState('')
  const [terminalLogs, setTerminalLogs] = useState([])
  const [scanCompleted, setScanCompleted] = useState(false)
  const [scanSummary, setScanSummary] = useState(null)
  const logsEndRef = useRef(null)

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLogs])

  // WebSocket connection
  useEffect(() => {
    if (!activeScanId) return

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(apiUrl)
    
    newSocket.on('connect', () => {
      newSocket.emit('join_scan', { scanId: activeScanId })
      console.log('Connected to socket for scan:', activeScanId)
    })

    // Live progress updates
    newSocket.on(`progress_${activeScanId}`, (data) => {
      setScanProgress(data.progress)
      setScanPhase(data.phase)
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [${data.phase}] ${data.status}`])
      
      // If progress hits 100% via the progress event, also mark as complete
      if (data.progress >= 100) {
        setScanCompleted(true)
        setScanSummary({ totalVulnerabilities: data.findings })
      }
    })

    // Dedicated completion event
    newSocket.on(`scan_complete_${activeScanId}`, (data) => {
      setScanCompleted(true)
      setScanProgress(100)
      setScanSummary(data)
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Scan complete! Found ${data.totalVulnerabilities} vulnerabilities.`])
    })

    return () => {
      newSocket.emit('leave_scan', { scanId: activeScanId })
      newSocket.disconnect()
    }
  }, [activeScanId])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return

      if (userId === 'dev-bypass') {
        setUserPlan({
          type: 'premium',
          name: 'Premium',
          domains: 10,
          domainsUsed: 0
        })
        setScans([])
        return
      }

      try {
        // Fetch user plan data
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          setUserPlan(userData.plan)
          console.log('User plan loaded:', userData.plan)
        }

        // Fetch scan results from scanreturn collection
        const scanRef = doc(db, 'scanreturn', userId)
        const scanSnap = await getDoc(scanRef)
        
        if (scanSnap.exists()) {
          const scanData = scanSnap.data()
          setScans(scanData.scanResults || [])
          console.log('Scan results loaded:', scanData.scanResults)
        } else {
          setScans([])
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [userId])

  const handleScan = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain name')
      return
    }

    // Validate domain/URL format
    const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9.-]+|localhost)(:[0-9]+)?(\/.*)?$/i
    if (!domainRegex.test(domain)) {
      setError('Please enter a valid domain or URL (e.g., example.com or http://localhost:8080)')
      return
    }

    // Check plan limits
    if (!userPlan) {
      setError('No plan selected. Please select a plan first.')
      return
    }

    if ((userPlan.domainsUsed || 0) >= userPlan.domains) {
      setError(`You've reached your plan limit of ${userPlan.domains} domain(s). Please upgrade your plan.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call your API to start the scan
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const bioToken = localStorage.getItem('bioToken')
      const response = await fetch(`${apiUrl}/api/scan/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bioToken ? { 'Authorization': `Bearer ${bioToken}` } : {})
        },
        body: JSON.stringify({
          domain: domain,
          sessionCookie: sessionCookie,
          plan: userPlan.type,
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start scan')
      }

      const scanResult = await response.json()
      console.log('Scan started:', scanResult)

      // Create scan record
      const scanRecord = {
        scanId: scanResult.scanId,
        domain: scanResult.domain,
        plan: scanResult.plan,
        status: scanResult.status,
        progress: scanResult.progress || 0,
        createdAt: scanResult.createdAt,
        estimatedDuration: scanResult.estimatedDuration
      }

      // Store scan results in scanreturn collection (separate document per user)
        const scanRef = doc(db, 'scanreturn', userId)
        const scanSnap = await getDoc(scanRef)

        if (scanSnap.exists()) {
          // Update existing scan document
          await updateDoc(scanRef, {
            scanResults: arrayUnion(scanRecord)
          })
        } else {
          // Create new scan document
          await setDoc(scanRef, {
            userId: userId,
            scanResults: [scanRecord]
          })
        }

        // Update domain usage count in user document
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.data()
        
        await updateDoc(userRef, {
          'plan.domainsUsed': (userData.plan?.domainsUsed || 0) + 1
        })

      // Update local state
      setScans([...scans, scanRecord])
      setActiveScanId(scanResult.scanId)
      setTerminalLogs([`[${new Date().toLocaleTimeString()}] Scan initiated for ${domain.toLowerCase()}`])
      setScanProgress(0)
      setScanPhase('Initializing')
      
    } catch (error) {
      console.error('Error initiating scan:', error)
      setError('Failed to initiate scan. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleScan()
    }
  }

  return (
    <div className="new-scan-container-dash">
      <div className="section-header-dash">
        <div className="section-header-content-dash">
          <h2 className="section-title-dash">Vulnerability Assessment</h2>
          <p className="section-subtitle-dash">Scan your domain for security vulnerabilities and threats</p>
        </div>
        <div className="header-actions-dash">
          <button className="action-btn-dash secondary-dash" onClick={() => onNavigate && onNavigate('history')}>
            <BarChart3 size={18} />
            {t('viewReports')}
          </button>
          <button className="action-btn-dash" onClick={() => {
            if (domain.trim()) {
              handleScan()
            } else {
              domainInputRef.current?.focus()
            }
          }}>
            <Shield size={18} />
            {t('quickScan')}
          </button>
        </div>
      </div>

      {/* Domain Input Section */}
      <div className="scan-input-section">
        <div className="scan-input-wrapper">

          <input
            ref={domainInputRef}
            type="text"
            placeholder={t('enterDomain')}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="domain-input"
          />
          <button 
            onClick={handleScan}
            disabled={loading || !domain.trim()}
            className="send-scan-btn deploy-agent-btn"
            style={{ width: 'auto', padding: '0 20px', display: 'flex', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <><Send size={16} /> Deploy Autonomous Agent</>
            )}
          </button>
        </div>

        {/* Removed 24/7 monitoring toggle */}

        {/* Advanced Settings Toggle */}
        <div 
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ 
            marginTop: '1rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer', 
            color: 'rgba(255,255,255,0.5)', 
            fontSize: '0.85rem',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <Settings size={14} />
          {showAdvanced ? t('hideAdvancedOptions') : t('advancedOptions')}
        </div>

        {/* Advanced Options Content */}
        {showAdvanced && (
          <div style={{ marginTop: '0.75rem', animation: 'fadeIn 0.3s ease' }}>
            <div className="scan-input-wrapper" style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'rgba(0,0,0,0.2)' }}>
              <input
                type="text"
                placeholder="Session Cookie (Optional, e.g. PHPSESSID=123...)"
                value={sessionCookie}
                onChange={(e) => setSessionCookie(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="domain-input"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
        )}
        
        {error && (
          <div className="scan-error">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {userPlan && (
          <div className="scan-info">
            <span className="plan-badge">{userPlan.name}</span>
            <span className="scan-limit">
              {userPlan.domainsUsed || 0} / {userPlan.domains} domains used
            </span>
          </div>
        )}
      </div>

      {/* Live Scan Progress Section */}
      {activeScanId && (
        <div className="live-scan-section" style={{ marginTop: '30px', background: '#111', borderRadius: '8px', padding: '20px', border: `1px solid ${scanCompleted ? '#00ff88' : '#333'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: scanCompleted ? '#00ff88' : '#00d4ff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Activity size={18} className={scanCompleted ? '' : 'pulsing'} />
              {scanCompleted ? '✅ Scan Complete' : 'Live Scan Progress'}
            </h3>
            <span style={{ color: '#aaa', fontSize: '14px' }}>Phase: {scanPhase || 'Starting...'}</span>
          </div>

          <div style={{ height: '8px', background: '#222', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${scanProgress}%`, 
                background: scanCompleted ? '#00ff88' : 'linear-gradient(90deg, #00d4ff, #00ff88)',
                transition: 'width 0.5s ease'
              }} 
            />
          </div>

          {/* Completion Summary */}
          {scanCompleted && scanSummary && (
            <div style={{ background: '#0a1a0a', border: '1px solid #00ff8844', borderRadius: '6px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '16px' }}>
                  {scanSummary.totalVulnerabilities ?? 0} Vulnerabilities Found
                </div>
                <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
                  Scan ID: {activeScanId?.substring(0, 16)}...
                </div>
              </div>
              <button
                onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/scan/${activeScanId}/report.pdf`, '_blank')}
                style={{ background: '#00ff88', color: '#000', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                ⬇ Download PDF Report
              </button>
            </div>
          )}

          <div style={{ background: '#000', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', height: '200px', overflowY: 'auto', border: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#666', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
              <Terminal size={14} />
              <span>Security Engine Output</span>
            </div>
            {terminalLogs.map((log, i) => (
              <div key={i} style={{ color: log.includes('✅') ? '#00ff88' : log.includes('Error') || log.includes('failed') ? '#ff4444' : '#00d4ff', marginBottom: '4px', fontSize: '13px' }}>
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}

export default NewScan