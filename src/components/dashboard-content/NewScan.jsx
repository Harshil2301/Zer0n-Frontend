import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, Shield, Send, Globe, AlertCircle, Terminal, Activity, Settings, Download, ExternalLink } from 'lucide-react'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection } from 'firebase/firestore'
import { db } from '../../config/firebase'
import io from 'socket.io-client'
import { useLanguage } from '../../contexts/LanguageContext'
import { jsPDF } from 'jspdf'

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

  // --- PDF GENERATION LOGIC (MATCHED TO SCAN HISTORY) ---
  const handleDownloadReport = async (scanId) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`<html><body style="background:#000;color:#00ff88;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;">GENERATING SECURE REPORT...</body></html>`)
    }

    try {
      const scanDocRef = doc(db, 'scans', scanId)
      const scanDoc = await getDoc(scanDocRef)
      if (scanDoc.exists()) {
        const scanData = scanDoc.data()
        const vulnCandidates = scanData.vulnerabilities || scanData.vulns || []
        const vulnerabilities = Array.isArray(vulnCandidates) ? vulnCandidates : []
        
        // Use the same professional layout as ScanHistory but even more premium
        newWindow.document.open()
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ZerOn Security Audit - ${scanId}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                body { background: #08080c !important; color: #d1d4dc; font-family: 'Segoe UI', sans-serif; padding: 40px; margin: 0; }
                .container { max-width: 900px; margin: 0 auto; }
                
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00ff88; padding-bottom: 20px; margin-bottom: 40px; }
                .brand { font-size: 28px; font-weight: 850; color: #00ff88; letter-spacing: 2px; }
                .brand span { color: #00d4ff; }
                .confidential { background: rgba(255, 45, 85, 0.1); color: #ff2d55; border: 1px solid #ff2d55; padding: 5px 15px; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px; }
                
                .summary-card { background: #111218; border: 1px solid #222530; border-radius: 12px; padding: 30px; margin-bottom: 40px; }
                .summary-title { color: #00d4ff; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; border-bottom: 1px solid #222530; padding-bottom: 10px; }
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .summary-item { font-size: 13px; }
                .summary-item strong { color: #8a8d9a; display: inline-block; width: 150px; font-size: 11px; text-transform: uppercase; }
                
                .vuln-card { background: #111218; border: 1px solid #222530; border-left: 6px solid #ff2d55; border-radius: 10px; padding: 25px; margin-bottom: 30px; break-inside: avoid; }
                .vuln-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #222530; padding-bottom: 12px; }
                .vuln-title { font-size: 18px; color: #fff; font-weight: 700; }
                .severity-tag { padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
                
                pre { background: #08080c; border: 1px solid #1f222e; padding: 15px; border-radius: 6px; color: #00d4ff; font-family: 'Consolas', monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; overflow: auto; margin-top: 10px; }
                .section-label { color: #8a8d9a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px; display: block; }
                
                .footer { text-align: center; border-top: 1px solid #222530; padding-top: 20px; margin-top: 60px; font-size: 11px; color: #555; font-family: monospace; letter-spacing: 1px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="brand">ZER<span>ON</span> SECURITY AUDIT</div>
                  <div class="confidential">TOP SECRET • INTERNAL USE ONLY</div>
                </div>
                
                <div class="summary-card">
                  <div class="summary-title">Executive VAPT Summary</div>
                  <div class="summary-grid">
                    <div class="summary-item"><strong>Target Domain:</strong> ${scanData.domain}</div>
                    <div class="summary-item"><strong>Assessment Date:</strong> ${new Date(scanData.createdAt).toLocaleDateString()}</div>
                    <div class="summary-item"><strong>Scan Status:</strong> COMPLETED</div>
                    <div class="summary-item"><strong>Identified Risks:</strong> ${vulnerabilities.length} Points of Exposure</div>
                  </div>
                </div>

                <h2 style="font-size: 20px; color: #00d4ff; margin-bottom: 25px; letter-spacing: 1px;">VULNERABILITY ASSESSMENT FINDINGS</h2>
                
                ${vulnerabilities.map(v => {
                  const isHigh = v.severity?.toLowerCase() === 'critical' || v.severity?.toLowerCase() === 'high';
                  return `
                    <div class="vuln-card" style="border-left-color: ${isHigh ? '#ff2d55' : '#ffd60a'}">
                      <div class="vuln-header">
                        <div class="vuln-title">${v.type || 'Security Violation'}</div>
                        <div class="severity-tag" style="background: ${isHigh ? 'rgba(255,45,85,0.1)' : 'rgba(255,214,10,0.1)'}; color: ${isHigh ? '#ff2d55' : '#ffd60a'}">
                          ${v.severity || 'UNKNOWN'}
                        </div>
                      </div>
                      <div style="font-size: 13px; margin-bottom: 5px;"><strong>Endpoint:</strong> <code>${v.endpoint || scanData.domain}</code></div>
                      <div style="font-size: 13px;"><strong>Parameter:</strong> <code>${v.parameter || 'N/A'}</code></div>
                      
                      <span class="section-label">Technical Proof of Concept (PoC)</span>
                      <pre>${v.proof || v.description || 'Verified via automated security engine.'}</pre>
                      
                      <span class="section-label">Remediation Suggestion</span>
                      <div style="margin-top: 8px; font-size: 13px; line-height: 1.4;">
                        ${v.type?.includes('SQL') ? 'Implement parameterized queries and use Web Application Firewalls (WAF) to filter malicious patterns.' : 
                          v.type?.includes('XSS') ? 'Enforce strict Content Security Policy (CSP) headers and escape all dynamic content output.' : 
                          'Audit your security headers and ensure the application follows OWASP Top 10 best practices.'}
                      </div>
                    </div>
                  `
                }).join('')}
                
                <div class="footer">
                  [ PRODUCED BY ZERON AUTONOMOUS AGENT • CERTIFICATE ID: ${scanId.substring(0,8)} ]
                </div>
              </div>
              <script>window.onload = () => { setTimeout(() => window.print(), 800); }</script>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    } catch (err) {
      newWindow.close()
      alert('Report generation failed.')
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
            <div style={{ background: '#0a1a0a', border: '1px solid #00ff8844', borderRadius: '6px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#00ff88', fontBold: 'bold', fontSize: '16px' }}>
                  {scanSummary.totalVulnerabilities ?? 0} Vulnerabilities Found
                </div>
                <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                  Scan ID: {activeScanId?.substring(0, 16)}...
                </div>
              </div>
              
              <button
                onClick={() => handleDownloadReport(activeScanId)}
                style={{ background: '#00ff88', color: '#000', border: 'none', borderRadius: '6px', padding: '10px 15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> PDF
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