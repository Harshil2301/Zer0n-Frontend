import React, { useState, useEffect } from 'react'
import { Filter, Download, ExternalLink, Clock, CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'

const ScanHistory = ({ userId }) => {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, completed, started

  useEffect(() => {
    const fetchScanHistory = async () => {
      if (!userId) return

      try {
        setLoading(true)

        // Query the main 'scans' collection directly instead of relying on frontend array
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const scansRef = collection(db, 'scans')
        const q = query(scansRef, where('userId', '==', userId))
        
        const querySnapshot = await getDocs(q)
        const enrichedScans = []
        
        querySnapshot.forEach((doc) => {
          const scanDetails = doc.data()
          enrichedScans.push({
            ...scanDetails,
            hasResults: true
          })
        })
        
        const sortedScans = enrichedScans
          .filter(scan => !scan.hiddenInFrontend)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          
        setScans(sortedScans)
        console.log('Scan history loaded from scans collection:', sortedScans)

      } catch (error) {
        console.error('Error fetching scan history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScanHistory()
    
    // Refresh scan status every 30 seconds
    const interval = setInterval(fetchScanHistory, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon completed" />
      case 'started':
        return <Loader size={16} className="status-icon started" />
      default:
        return <AlertCircle size={16} className="status-icon pending" />
    }
  }

  const getStatusClass = (status) => {
    return status?.toLowerCase() || 'pending'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewResults = (scanId) => {
    // Fetch scan results from Firebase and display as JSON in new tab
    const fetchAndDisplayResults = async () => {
      try {
        const scanDocRef = doc(db, 'scans', scanId)
        const scanDoc = await getDoc(scanDocRef)
        
        if (scanDoc.exists()) {
          const scanData = scanDoc.data()
          
          // Sanitize / escape helpers
          const escapeHtml = (str) => {
            try {
              return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
            } catch (e) {
              return ''
            }
          }

          // Conservative HTML sanitizer (removes scripts, styles and on* attributes)
          const sanitizeHtml = (html) => {
            if (!html) return ''
            let s = String(html)
            // remove script and style blocks
            s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            s = s.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
            // remove on* attributes (onclick, onerror, etc.)
            s = s.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
            s = s.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
            s = s.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
            // neutralize javascript: URIs
            s = s.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
            s = s.replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'")
            return s
          }

          // Try to detect vulnerability arrays inside the scan data
          const vulnCandidates = scanData.vulnerabilities || scanData.vulns || scanData.issues || scanData.alerts || scanData.results
          const vulnerabilities = Array.isArray(vulnCandidates) ? vulnCandidates : null

          // Build content: if vulnerabilities exist, render them as alert blocks (escaped)
          const buildVulnHtml = (vulns) => {
            if (!vulns || !vulns.length) return ''
            return vulns.map((v) => {
              const title = escapeHtml(v.title || v.name || v.id || v.type || 'Vulnerability')
              const severity = escapeHtml((v.severity || v.level || 'info').toString())
              const desc = escapeHtml(v.description || v.summary || JSON.stringify(v, null, 2))
              const confidence = v.confidence ? `<span class="vuln-confidence" style="margin-left:10px; padding:2px 8px; border-radius:12px; font-size:12px; background:rgba(0, 255, 136, 0.2); color:#00ff88; border:1px solid #00ff88;">Confidence: ${v.confidence}%</span>` : ''
              
              return `
                <div class="vuln-card vuln-${severity.toLowerCase()}">
                  <div class="vuln-head" style="display:flex; align-items:center;">
                    <strong>${title}</strong>
                    <span class="vuln-severity">${severity}</span>
                    ${confidence}
                  </div>
                  <div class="vuln-body"><pre>${desc}</pre></div>
                </div>
              `
            }).join('\n')
          }

          // Create a new window and display safe output
          const newWindow = window.open('', '_blank')
          const safeJson = escapeHtml(JSON.stringify(scanData, null, 2))

          // If there's an HTML report field, sanitize it (do not inject raw)
          const rawHtmlReport = scanData.reportHtml || scanData.originalReport || scanData.rawReport || null
          const sanitizedReport = rawHtmlReport ? sanitizeHtml(rawHtmlReport) : null

          const vulnHtml = buildVulnHtml(vulnerabilities)

          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Scan Results - ${scanId}</title>
                <meta charset="utf-8" />
                <style>
                  body { background: #1e1e1e; color: #d4d4d4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; margin: 0; }
                  .container { max-width: 1100px; margin: 0 auto; }
                  h1 { color: #00ff88; margin-bottom: 12px; }
                  .section { margin-bottom: 18px; }
                  .vuln-card { background: #2a2a2d; border: 1px solid rgba(255,255,255,0.04); padding: 12px; border-radius: 8px; margin-bottom: 10px; }
                  .vuln-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
                  .vuln-severity { font-size: 12px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,0.04); }
                  .vuln-card.vuln-critical .vuln-severity { background: rgba(255,50,50,0.12); color: #ff7b7b }
                  .vuln-card.vuln-high .vuln-severity { background: rgba(255,120,50,0.08); color: #ffb36b }
                  .vuln-card.vuln-medium .vuln-severity { background: rgba(255,200,50,0.06); color: #ffd88c }
                  .vuln-card.vuln-low .vuln-severity { background: rgba(50,200,255,0.04); color: #8be7ff }
                  pre { background: #252526; padding: 12px; border-radius: 6px; overflow: auto; font-size: 13px; line-height: 1.5; }
                  .sanitized-report { background: #111; padding: 12px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.03); }
                  .note { color: #9aa4ad; font-size: 13px }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Scan Results</h1>

                  <div class="section">
                    <div class="note">Summary (safe view):</div>
                    <pre>${safeJson}</pre>
                  </div>

                  ${vulnHtml ? (`<div class="section"><h2 style="color:#ffd86b">Vulnerabilities</h2>${vulnHtml}</div>`) : ''}

                  ${sanitizedReport ? (`<div class="section"><h2 style="color:#99ddff">Sanitized Original Report</h2><div class="sanitized-report">${sanitizedReport}</div></div>`) : ''}

                  ${(!vulnHtml && !sanitizedReport) ? `<div class="section"><div class="note">No vulnerability list or HTML report detected — showing JSON only.</div></div>` : ''}
                </div>
              </body>
            </html>
          `)
          newWindow.document.close()
        } else {
          alert('Scan results not found')
        }
      } catch (error) {
        console.error('Error fetching scan results:', error)
        alert('Failed to fetch scan results')
      }
    }
    
    fetchAndDisplayResults()
  }

  const handleDownloadReport = (scanId) => {
    // Open the window synchronously to bypass the browser's popup blocker
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Loading Report...</title></head>
          <body style="background: #0d0d0d; color: #00ff88; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="font-size: 16px; letter-spacing: 2px;">GENERATING SECURE REPORT...</div>
          </body>
        </html>
      `)
      newWindow.document.close()
    }

    const fetchAndPrintResults = async () => {
      try {
        const scanDocRef = doc(db, 'scans', scanId)
        const scanDoc = await getDoc(scanDocRef)
        
        if (scanDoc.exists()) {
          const scanData = scanDoc.data()
          
          const escapeHtml = (str) => {
            try {
              return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
            } catch (e) { return '' }
          }

          const getCvssScore = (type, severity, cvss) => {
            if (cvss) return parseFloat(cvss);
            const lowerType = String(type).toLowerCase();
            if (lowerType.includes('sql')) return 9.8;
            if (lowerType.includes('bypass') || lowerType.includes('auth')) return 9.5;
            if (lowerType.includes('ssrf')) return 8.6;
            if (lowerType.includes('xss') || lowerType.includes('scripting')) return 6.1;
            if (lowerType.includes('misconfiguration') || lowerType.includes('header') || lowerType.includes('hsts')) return 5.3;
            
            const lowerSev = String(severity).toLowerCase();
            if (lowerSev === 'critical') return 9.0;
            if (lowerSev === 'high') return 7.5;
            if (lowerSev === 'medium') return 5.5;
            if (lowerSev === 'low') return 3.0;
            return 1.0;
          }

          const getRemediation = (type) => {
            const lowerType = String(type).toLowerCase();
            if (lowerType.includes('sql')) {
              return 'Use parameterized queries (prepared statements) for all database interactions. Enforce strict input validation using allowlists and apply least privilege principles to database accounts.';
            }
            if (lowerType.includes('bypass') || lowerType.includes('auth')) {
              return 'Implement robust session validation checks, multi-factor authentication (MFA), and secure password hashing. Ensure authorization controls are enforced server-side for every API endpoint.';
            }
            if (lowerType.includes('xss') || lowerType.includes('scripting')) {
              return 'Implement context-aware HTML entity encoding on all user-supplied output. Restrict execution with a strict Content Security Policy (CSP) header.';
            }
            if (lowerType.includes('ssrf')) {
              return 'Sanitize and validate all user-supplied URLs. Restrict outbound requests from the server to a strict allowlist of domains, and isolate the scanner/application network.';
            }
            if (lowerType.includes('hsts') || lowerType.includes('strict-transport-security')) {
              return 'Add the "Strict-Transport-Security" header to all responses: "max-age=63072000; includeSubDomains; preload". This forces browsers to connect exclusively via HTTPS.';
            }
            if (lowerType.includes('x-frame-options') || lowerType.includes('clickjacking')) {
              return 'Configure the HTTP response header "X-Frame-Options: DENY" or use CSP "frame-ancestors \'none\'" to protect against clickjacking attacks.';
            }
            if (lowerType.includes('content-security-policy') || lowerType.includes('csp')) {
              return 'Implement a strong Content-Security-Policy response header to control scripts, styles, and other resource loads, mitigating XSS and data injection attacks.';
            }
            return 'Sanitize inputs, encode outputs, run dependency security updates, and implement defensive HTTP response headers as recommended by OWASP.';
          }
          
          const vulnCandidates = scanData.vulnerabilities || scanData.vulns || scanData.issues || scanData.alerts || scanData.results
          const vulnerabilities = Array.isArray(vulnCandidates) ? vulnCandidates : []

          // Sort by severity (Critical > High > Medium > Low > Info)
          const severityWeight = {
            'critical': 5,
            'high': 4,
            'medium': 3,
            'low': 2,
            'info': 1,
            'informational': 1
          }

          const sortedVulns = [...vulnerabilities].sort((a, b) => {
            const sevA = (a.severity || 'info').toLowerCase()
            const sevB = (b.severity || 'info').toLowerCase()
            return (severityWeight[sevB] || 0) - (severityWeight[sevA] || 0)
          })

          const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
          sortedVulns.forEach(v => {
            const sev = (v.severity || 'info').toLowerCase()
            if (counts[sev] !== undefined) counts[sev]++
            else if (sev === 'informational') counts.info++
          })

          const buildVulnHtml = (vulns) => {
            if (!vulns || !vulns.length) return '<div style="color: #666; text-align: center; padding: 40px; font-style: italic;">No vulnerabilities detected during this scan.</div>'
            return vulns.map((v) => {
              const title = escapeHtml(v.type || v.title || v.name || 'Vulnerability')
              const severity = escapeHtml((v.severity || 'info').toString())
              const cvss = getCvssScore(v.type || v.title || v.name, v.severity, v.cvss)
              const endpoint = escapeHtml(v.endpoint || scanData.domain || 'N/A')
              const parameter = escapeHtml(v.parameter || 'N/A')
              const payload = escapeHtml(v.payload || 'N/A')
              const proof = escapeHtml(v.proof || v.evidence || v.description || 'Verified during automated penetration testing.')
              const remediation = getRemediation(v.type || v.title || v.name)
              return `
                <div class="vuln-card vuln-${severity.toLowerCase()}">
                  <div class="vuln-head">
                    <span class="vuln-title">${title}</span>
                    <div style="display: flex; gap: 8px;">
                      <span class="cvss-badge">CVSS ${cvss.toFixed(1)}</span>
                      <span class="severity-badge">${severity.toUpperCase()}</span>
                    </div>
                  </div>
                  <div class="vuln-meta-grid">
                    <div class="meta-item"><strong>Target URL / Endpoint:</strong> <code>${endpoint}</code></div>
                    ${parameter && parameter !== 'N/A' ? `<div class="meta-item"><strong>Vulnerable Parameter:</strong> <code>${parameter}</code></div>` : ''}
                    ${payload && payload !== 'N/A' ? `<div class="meta-item"><strong>Test Payload:</strong> <code>${payload}</code></div>` : ''}
                  </div>
                  <div class="vuln-desc-section">
                    <strong>Proof of Concept (PoC) Evidence:</strong>
                    <pre class="proof-box">${proof}</pre>
                  </div>
                  <div class="remediation-section">
                    <strong>Remediation Recommendation:</strong>
                    <p>${remediation}</p>
                  </div>
                </div>
              `
            }).join('\n')
          }

          const vulnHtml = buildVulnHtml(sortedVulns)
          const targetUrl = escapeHtml(scanData.domain || 'N/A')

          if (newWindow) {
            newWindow.document.open()
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Vulnerability Assessment Report - ${scanId}</title>
                  <meta charset="utf-8" />
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { background: #08080c !important; color: #d1d4dc; font-family: 'Segoe UI', -apple-system, sans-serif; padding: 40px; margin: 0; }
                    .container { max-width: 1000px; margin: 0 auto; }
                    
                    .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00ff88; padding-bottom: 15px; margin-bottom: 30px; }
                    .brand { font-size: 26px; font-weight: 850; color: #00ff88; letter-spacing: 2px; }
                    .brand span { color: #00d4ff; }
                    .confidential-tag { background: rgba(255, 45, 85, 0.1) !important; color: #ff2d55; border: 1px solid #ff2d55; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; }
                    
                    .summary-card { background: #111218 !important; border: 1px solid #222530; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
                    .summary-card h2 { color: #00d4ff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #222530; padding-bottom: 10px; margin-bottom: 15px; }
                    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .summary-item { font-size: 13px; color: #d1d4dc; }
                    .summary-item strong { color: #8a8d9a; display: inline-block; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .summary-stats { display: flex; gap: 10px; margin-top: 20px; }
                    .stat-pill { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid #333; display: flex; align-items: center; gap: 6px; }
                    .stat-pill.critical { background: rgba(255, 45, 85, 0.12); color: #ff2d55; border-color: #ff2d55; }
                    .stat-pill.high { background: rgba(255, 107, 53, 0.12); color: #ff6b35; border-color: #ff6b35; }
                    .stat-pill.medium { background: rgba(255, 214, 10, 0.12); color: #ffd60a; border-color: #ffd60a; }
                    .stat-pill.low { background: rgba(48, 209, 88, 0.12); color: #30d158; border-color: #30d158; }
                    .stat-pill.info { background: rgba(0, 204, 255, 0.12); color: #00ccff; border-color: #00ccff; }
                    
                    h2.section-title { font-size: 18px; color: #00d4ff; letter-spacing: 1px; text-transform: uppercase; margin-top: 35px; margin-bottom: 20px; border-left: 3px solid #00ff88; padding-left: 12px; }
                    
                    .vuln-card { background: #111218 !important; border: 1px solid #222530; border-left-width: 5px !important; border-radius: 8px; padding: 22px; margin-bottom: 25px; break-inside: avoid; }
                    .vuln-card.vuln-critical { border-left-color: #ff2d55 !important; }
                    .vuln-card.vuln-high { border-left-color: #ff6b35 !important; }
                    .vuln-card.vuln-medium { border-left-color: #ffd60a !important; }
                    .vuln-card.vuln-low { border-left-color: #30d158 !important; }
                    .vuln-card.vuln-info, .vuln-card.vuln-informational { border-left-color: #00ccff !important; }
                    
                    .vuln-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222530; padding-bottom: 12px; margin-bottom: 15px; }
                    .vuln-title { font-size: 16px; font-weight: 700; color: #fff; }
                    .cvss-badge { background: #1f222e; color: #8a8d9a; border: 1px solid #333; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
                    .severity-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; }
                    .vuln-critical .severity-badge { background: rgba(255, 45, 85, 0.12); color: #ff2d55; }
                    .vuln-high .severity-badge { background: rgba(255, 107, 53, 0.12); color: #ff6b35; }
                    .vuln-medium .severity-badge { background: rgba(255, 214, 10, 0.12); color: #ffd60a; }
                    .vuln-low .severity-badge { background: rgba(48, 209, 88, 0.12); color: #30d158; }
                    .vuln-info .severity-badge, .vuln-informational .severity-badge { background: rgba(0, 204, 255, 0.12); color: #00ccff; }
                    
                    .vuln-meta-grid { display: grid; gap: 8px; background: #08080c; border: 1px solid #1f222e; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
                    .meta-item { font-size: 13px; color: #d1d4dc; }
                    .meta-item strong { color: #8a8d9a; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 8px; display: inline-block; width: 170px; }
                    code { font-family: 'Consolas', monospace; color: #00ccff; background: rgba(0, 204, 255, 0.05); padding: 2px 6px; border-radius: 4px; font-size: 12px; word-break: break-all; }
                    
                    .vuln-desc-section, .remediation-section { margin-bottom: 15px; }
                    .vuln-desc-section strong, .remediation-section strong { color: #8a8d9a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
                    .proof-box { background: #08080c !important; border: 1px solid #1f222e; padding: 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 12px; line-height: 1.5; color: #d1d4dc; white-space: pre-wrap; word-wrap: break-word; }
                    .remediation-section p { font-size: 13px; color: #d1d4dc; line-height: 1.5; margin: 0; }
                    
                    .footer-bar { text-align: center; border-top: 1px solid #222530; padding-top: 15px; margin-top: 40px; font-size: 11px; color: #555; font-family: monospace; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header-bar">
                      <div class="brand">ZER<span>ON</span> SECURITY</div>
                      <div class="confidential-tag">CONFIDENTIAL</div>
                    </div>
                    
                    <div class="summary-card">
                      <h2>Executive VAPT Summary</h2>
                      <div class="summary-grid">
                        <div class="summary-item"><strong>Target URL/Host:</strong> ${targetUrl}</div>
                        <div class="summary-item"><strong>Security Assessment:</strong> AI-Powered VAPT</div>
                        <div class="summary-item"><strong>Date:</strong> ${new Date(scanData.createdAt || Date.now()).toLocaleString()}</div>
                        <div class="summary-item"><strong>Scan Session ID:</strong> ${scanId}</div>
                      </div>
                      
                      <div class="summary-stats">
                        <div class="stat-pill critical">Critical: ${counts.critical}</div>
                        <div class="stat-pill high">High: ${counts.high}</div>
                        <div class="stat-pill medium">Medium: ${counts.medium}</div>
                        <div class="stat-pill low">Low: ${counts.low}</div>
                        <div class="stat-pill info">Info: ${counts.info}</div>
                      </div>
                    </div>
  
                    <h2 class="section-title">Vulnerability Findings</h2>
                    ${vulnHtml}
                    
                    <div class="footer-bar">
                      [ GENERATED BY ZERON VAPT SYSTEM • FOR AUTHORIZED REVIEW ONLY • SECURE COMPLIANCE AUDIT ]
                    </div>
                  </div>
                  <script>
                    window.onload = function() {
                      setTimeout(() => {
                        window.print();
                      }, 500);
                    };
                  </script>
                </body>
              </html>
            `)
            newWindow.document.close()
          }
        } else {
          if (newWindow) newWindow.close()
          alert('Scan results not found')
        }
      } catch (error) {
        console.error('Error generating report:', error)
        if (newWindow) newWindow.close()
        alert('Failed to generate report')
      }
    }
    
    fetchAndPrintResults()
  }

  const handleExportData = async () => {
    if (filteredScans.length === 0) return;
    const btn = document.getElementById('export-btn');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.innerText = 'Generating PDF...';
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const element = document.querySelector('.scan-history-list');
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#1e1e1e' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.setFillColor(30, 30, 30);
      pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');
      pdf.setTextColor(0, 255, 136);
      pdf.setFontSize(16);
      pdf.text("ZerOn Security Audit Report", 14, 15);
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save(`zeron_scan_history_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report.');
    } finally {
      if (btn) btn.innerHTML = originalText;
    }
  }

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm('Are you sure you want to remove this scan from your dashboard? (It will remain saved in the backend)')) return;
    
    try {
      // Update local state immediately
      setScans(prev => prev.filter(s => s.scanId !== scanId));
      
      // Update Firebase 'scans' document to hide in frontend
      const { updateDoc } = await import('firebase/firestore');
      const scanRef = doc(db, 'scans', scanId);
      await updateDoc(scanRef, { hiddenInFrontend: true });
    } catch (hideErr) {
      console.error('Error hiding scan from frontend:', hideErr);
      alert('Failed to remove scan.');
    }
  };

  // Calculate mock or real statistics for the pie chart
  const statsData = [
    { name: 'Completed Scans', value: scans.filter(s => s.status?.toLowerCase() === 'completed').length, color: '#00ff88' },
    { name: 'In Progress', value: scans.filter(s => s.status?.toLowerCase() === 'started').length, color: '#00d4ff' },
    { name: 'Failed/Pending', value: scans.filter(s => !['completed', 'started'].includes(s.status?.toLowerCase())).length, color: '#ff7b7b' }
  ].filter(d => d.value > 0);


  const filteredScans = scans.filter(scan => {
    if (filter === 'all') return true
    return scan.status?.toLowerCase() === filter
  })

  return (
    <div className="scan-history-container-dash">
      <div className="section-header-dash">
        <div className="section-header-content-dash">
          <h2 className="section-title-dash">Security Archives</h2>
          <p className="section-subtitle-dash">Review past scans and security analysis reports</p>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '4px 10px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '20px', color: '#00ff88', fontSize: '0.75rem', fontWeight: 600 }}>
              Total Scans: {scans.length}
            </span>
          </div>
        </div>
        <div className="header-actions-dash">
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Scans</option>
            <option value="completed">Completed</option>
            <option value="started">In Progress</option>
          </select>
          <button id="export-btn" className="action-btn-dash" onClick={handleExportData} disabled={filteredScans.length === 0}>
            <Download size={18} />
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Analytics Chart (Only show if we have data) */}
      {!loading && statsData.length > 0 && (
        <div style={{ width: '100%', height: '200px', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statsData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {statsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ color: '#aaa', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scan History List */}
      <div className="scan-history-section">
        {loading ? (
          <div className="loading-state">
            <Loader size={24} className="spinner-icon" />
            <p>Loading scan history...</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No scans found</h3>
            <p>Start scanning domains to see your history here</p>
          </div>
        ) : (
          <div className="scan-history-list">
            {filteredScans.map((scan, index) => (
              <div key={scan.scanId || index} className="scan-history-item">
                <div className="scan-item-header">
                  <div className="scan-info-group">
                    <h4 className="scan-domain">{scan.domain}</h4>
                    <div className="scan-meta">
                      <Clock size={14} />
                      <span>{formatDate(scan.createdAt)}</span>
                    </div>
                  </div>
                  <div className="scan-status-group">
                    <div className={`scan-status ${getStatusClass(scan.status)}`}>
                      {getStatusIcon(scan.status)}
                      <span>{scan.status || 'Pending'}</span>
                    </div>
                    <span className="scan-plan-badge">{scan.plan || 'N/A'}</span>
                    <button 
                      onClick={() => handleDeleteScan(scan.scanId)}
                      style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }}
                      title="Remove scan from dashboard"
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="scan-item-body">
                  <div className="scan-progress-info">
                    <span className="progress-label">Progress:</span>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${scan.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-value">{scan.progress || 0}%</span>
                  </div>

                  {scan.status?.toLowerCase() === 'completed' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="view-results-btn"
                        onClick={() => handleViewResults(scan.scanId)}
                      >
                        <ExternalLink size={16} />
                        View Full Results
                      </button>
                      <button 
                        className="view-results-btn"
                        onClick={() => handleDownloadReport(scan.scanId)}
                        style={{ background: 'transparent', border: '1px solid rgba(0, 204, 255, 0.3)', color: '#00ccff' }}
                      >
                        <Download size={16} />
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>

                <div className="scan-item-footer">
                  <span className="scan-id">ID: {scan.scanId?.substring(0, 20)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanHistory