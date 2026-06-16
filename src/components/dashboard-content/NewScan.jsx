import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, Shield, Send, Globe, AlertCircle, Terminal, Activity, Settings, Download, ExternalLink } from 'lucide-react'
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
  const [verificationRequired, setVerificationRequired] = useState(false)
  const [dnsChallenge, setDnsChallenge] = useState('')
  const [verifyingDomain, setVerifyingDomain] = useState(false)
  const logsEndRef = useRef(null)

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLogs])

  // On mount: clear any stale activeScanRunning flag from a disconnected/interrupted previous session
  useEffect(() => {
    sessionStorage.removeItem('activeScanRunning')
  }, [])

  // WebSocket connection — runs whenever activeScanId changes
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
        sessionStorage.removeItem('activeScanRunning')
        setScanSummary({ totalVulnerabilities: data.findings })
      }
    })

    // Dedicated completion event
    newSocket.on(`scan_complete_${activeScanId}`, (data) => {
      setScanCompleted(true)
      setScanProgress(100)
      sessionStorage.removeItem('activeScanRunning')
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
        // Try Firebase first (works for Google/Email auth)
        let dataLoaded = false;
        try {
          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            setUserPlan(userData.plan)
            console.log('User plan loaded from Firebase:', userData.plan)
            dataLoaded = true;
          }
        } catch (fbError) {
          console.log('Firebase plan load failed, falling back to API...');
        }

        // Fallback to API (works for Biometric auth)
        if (!dataLoaded) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
          const response = await fetch(`${apiUrl}/api/user/${userId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              setUserPlan(data.user.plan || data.user.account?.plan)
              console.log('User plan loaded from API:', data.user.plan)
            }
          }
        }

        // Try to fetch scan history (we skip this for biometric since ScanHistory handles it)
        try {
          const scanRef = doc(db, 'scanreturn', userId)
          const scanSnap = await getDoc(scanRef)
          if (scanSnap.exists()) {
            setScans(scanSnap.data().scanResults || [])
          }
        } catch (e) {
          console.log('Skipping scanreturn load (will use local state only)');
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

    // Check if the user has formally selected a plan
    if (!userPlan || !userPlan.name || !userPlan.domains) {
      setError('No plan selected. Please click "Select Plan" to unlock scanning.')
      return
    }

    if ((userPlan.domainsUsed || 0) >= userPlan.domains) {
      setError(`You've reached your plan limit of ${userPlan.domains} domain(s). Please upgrade your plan.`)
      return
    }

    if (sessionStorage.getItem('activeScanRunning') === 'true') {
      setError('A scan is already in progress. Please wait for it to complete.')
      return
    }

    setLoading(true)
    setError('')
    sessionStorage.setItem('activeScanRunning', 'true')

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
        sessionStorage.removeItem('activeScanRunning')
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

      // Record scan and update domains securely via backend
      try {
        const recordResponse = await fetch(`${apiUrl}/api/user/${userId}/record-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanRecord })
        })
        if (!recordResponse.ok) {
          console.warn('Failed to record scan via API, tracking locally only');
        }
      } catch (recordError) {
        console.warn('Failed to record scan via API, tracking locally only', recordError);
      }

      // Update local state
      setScans([...scans, scanRecord])
      setActiveScanId(scanResult.scanId)
      
      // Update domain count in local state and clear session cache so dashboard fetches fresh data
      if (userPlan) {
        setUserPlan(prev => ({ ...prev, domainsUsed: (prev.domainsUsed || 0) + 1 }))
        sessionStorage.removeItem('zeron_profile_cache')
      }
      setTerminalLogs([`[${new Date().toLocaleTimeString()}] Scan initiated for ${domain.toLowerCase()}`])
      setScanProgress(0)
      setScanPhase('Initializing')
      
    } catch (error) {
      console.error('Error initiating scan:', error)
      sessionStorage.removeItem('activeScanRunning')
      setError('Failed to initiate scan. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/domain/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, userId })
      });
      const data = await response.json();
      
      if (data.verified) {
        setVerificationRequired(false);
        setError('');
        // Automatically start scan after successful verification
        handleScan();
      } else {
        setError(data.error || 'Verification failed. Please ensure the TXT record is added and try again.');
      }
    } catch (err) {
      setError('Failed to verify domain. Please check your connection.');
    } finally {
      setVerifyingDomain(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleScan()
    }
  }

  // --- PDF GENERATION LOGIC ---
  const handleDownloadReport = async (scanId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const response = await fetch(`${apiUrl}/api/report/pdf/${scanId}`);
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZerOn_Report_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Report generation failed. Please try again later.');
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
            disabled={loading || !domain.trim() || (activeScanId && !scanCompleted)}
            className="send-scan-btn deploy-agent-btn"
            style={{ width: 'auto', padding: '0 20px', display: 'flex', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : activeScanId && !scanCompleted ? (
              <><Activity size={16} className="pulsing" /> Scan in Progress...</>
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
            {error.includes('already in progress') && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('activeScanRunning')
                  setError('')
                  setActiveScanId(null)
                  setScanCompleted(false)
                  setScanProgress(0)
                }}
                style={{
                  marginLeft: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,100,100,0.4)',
                  borderRadius: '6px',
                  color: '#ff8888',
                  padding: '2px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  flexShrink: 0
                }}
              >
                Force New Scan
              </button>
            )}
          </div>
        )}


        {userPlan && userPlan.name && userPlan.domains && (
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

      {/* Ethical / Rules of Engagement Disclaimer - Moved to Bottom */}
      <div style={{
        marginTop: '2rem',
        padding: '12px 16px',
        background: 'rgba(255, 45, 85, 0.05)',
        border: '1px solid rgba(255, 45, 85, 0.2)',
        borderLeft: '4px solid #ff2d55',
        borderRadius: '8px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <AlertCircle size={18} color="#ff2d55" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: '#d1d4dc', lineHeight: '1.5' }}>
          <strong style={{ color: '#ff2d55', display: 'block', marginBottom: '4px' }}>Rules of Engagement & Authorization</strong>
          To comply with the <em>Computer Fraud and Abuse Act (CFAA)</em>, unauthorized scanning of production environments is strictly prohibited. 
          Furthermore, enterprise Web Application Firewalls (WAFs) will automatically ban unwhitelisted IPs. 
          For demonstration and academic evaluation, please use authorized vulnerable testing environments only (e.g., <code style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>testfire.net</code> or <code style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>juice-shop.herokuapp.com</code>).
        </div>
      </div>
    </div>
  )
}

export default NewScan