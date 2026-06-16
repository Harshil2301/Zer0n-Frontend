import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, Loader, Activity } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import './ScanCompareModal.css'

const ScanCompareModal = ({ scan1Id, scan2Id, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [scanA, setScanA] = useState(null)
  const [scanB, setScanB] = useState(null)

  // Fetch both scans and compare
  useEffect(() => {
    const fetchAndCompare = async () => {
      try {
        setLoading(true)
        
        // Fetch Scan A (older) and Scan B (newer)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const resA = await fetch(`${apiUrl}/api/scan/${scan1Id}`)
        const resB = await fetch(`${apiUrl}/api/scan/${scan2Id}`)
        
        const dataA_json = await resA.json()
        const dataB_json = await resB.json()

        if (!dataA_json.success || !dataB_json.success) {
          throw new Error('One or both scans could not be found.')
        }

        const dataA = dataA_json.data
        const dataB = dataB_json.data

        // Ensure Scan A is the older one
        let older = dataA
        let newer = dataB
        if (new Date(dataA.createdAt) > new Date(dataB.createdAt)) {
          older = dataB
          newer = dataA
        }

        setScanA(older)
        setScanB(newer)

        // Helper to extract normalized vulnerability list
        const extractVulns = (scanData) => {
          const raw = scanData.vulnerabilities || scanData.vulns || scanData.issues || scanData.alerts || scanData.results || []
          if (!Array.isArray(raw)) return []
          
          return raw.map(v => ({
            id: v.title || v.name || v.id || v.type || 'Unknown Vulnerability',
            severity: (v.severity || v.level || 'info').toString().toUpperCase(),
            description: v.description || v.summary || ''
          }))
        }

        const vulnsA = extractVulns(older)
        const vulnsB = extractVulns(newer)

        // Compare logic using normalized IDs
        const mapA = new Map(vulnsA.map(v => [v.id, v]))
        const mapB = new Map(vulnsB.map(v => [v.id, v]))

        const newVulns = []
        const fixedVulns = []
        const persistentVulns = []

        // Find Persistent and Fixed
        for (const [id, vuln] of mapA) {
          if (mapB.has(id)) {
            persistentVulns.push(vuln)
          } else {
            fixedVulns.push(vuln)
          }
        }

        // Find New
        for (const [id, vuln] of mapB) {
          if (!mapA.has(id)) {
            newVulns.push(vuln)
          }
        }

        setComparison({
          new: newVulns,
          fixed: fixedVulns,
          persistent: persistentVulns
        })

      } catch (err) {
        console.error('Comparison error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAndCompare()
  }, [scan1Id, scan2Id])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'compare-severity-critical'
      case 'HIGH': return 'compare-severity-high'
      case 'MEDIUM': return 'compare-severity-medium'
      default: return 'compare-severity-low'
    }
  }

  return (
    <AnimatePresence>
      <div className="compare-modal-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="compare-modal-content"
        >
          {/* Header */}
          <div className="compare-modal-header">
            <div>
              <h2 className="compare-modal-title">
                <ShieldAlert style={{ color: '#00ccff' }} />
                VULNERABILITY DIFF ANALYSIS
              </h2>
              {!loading && scanA && scanB && (
                <div className="compare-modal-dates">
                  <span>{formatDate(scanA.createdAt)}</span>
                  <ArrowRight size={14} style={{ color: 'rgba(0,204,255,0.5)' }} />
                  <span>{formatDate(scanB.createdAt)}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="compare-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="compare-modal-body custom-scrollbar">
            {loading ? (
              <div className="compare-loading-state">
                <Loader size={32} className="animate-spin" />
                <div className="compare-loading-text">ANALYZING DIFFERENTIALS...</div>
              </div>
            ) : error ? (
              <div className="compare-error-state">
                {error}
              </div>
            ) : (
              <div>
                {/* Summary Stats */}
                <div className="compare-stats-grid">
                  <div className="compare-stat-card new">
                    <span className="compare-stat-value">{comparison.new.length}</span>
                    <span className="compare-stat-label">NEW RISKS</span>
                  </div>
                  <div className="compare-stat-card fixed">
                    <span className="compare-stat-value">{comparison.fixed.length}</span>
                    <span className="compare-stat-label">RESOLVED</span>
                  </div>
                  <div className="compare-stat-card persistent">
                    <span className="compare-stat-value">{comparison.persistent.length}</span>
                    <span className="compare-stat-label">PERSISTENT</span>
                  </div>
                </div>

                {/* Diff Legend */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: '🔴 New' },
                    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: '🟢 Fixed' },
                    { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: '🟡 Persistent' },
                  ].map(({ color, bg, label }) => (
                    <span key={label} style={{ fontSize: '0.72rem', background: bg, border: `1px solid ${color}33`, padding: '3px 10px', borderRadius: '10px', color, fontWeight: 600 }}>{label}</span>
                  ))}
                </div>

                {/* Diff Lists */}
                <div className="compare-lists-grid">
                  {/* Left Column: New & Persistent */}
                  <div className="compare-list-section">
                    {/* New Vulnerabilities */}
                    <div>
                      <h3 className="compare-list-title new">
                        <AlertTriangle size={16} />
                        NEW VULNERABILITIES DETECTED
                      </h3>
                      {comparison.new.length === 0 ? (
                        <div className="compare-empty-state">No new vulnerabilities introduced.</div>
                      ) : (
                        <div>
                          {comparison.new.map((v, i) => (
                            <div key={i} className="compare-vuln-item new">
                              <div style={{ flex: 1 }}>
                                <div className="compare-vuln-name">{v.id}</div>
                              </div>
                              <span className={`compare-threat-badge ${getSeverityColor(v.severity)}`}>{v.severity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Persistent Vulnerabilities */}
                    <div>
                      <h3 className="compare-list-title persistent">
                        <Activity size={16} />
                        PERSISTENT VULNERABILITIES
                      </h3>
                      {comparison.persistent.length === 0 ? (
                        <div className="compare-empty-state">No persistent vulnerabilities.</div>
                      ) : (
                        <div>
                          {comparison.persistent.map((v, i) => (
                            <div key={i} className="compare-vuln-item persistent">
                              <div style={{ flex: 1 }}>
                                <div className="compare-vuln-name">{v.id}</div>
                              </div>
                              <span className={`compare-threat-badge ${getSeverityColor(v.severity)}`}>{v.severity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Resolved */}
                  <div className="compare-list-section">
                    <div>
                      <h3 className="compare-list-title fixed">
                        <CheckCircle size={16} />
                        RESOLVED VULNERABILITIES
                      </h3>
                      {comparison.fixed.length === 0 ? (
                        <div className="compare-empty-state">No vulnerabilities resolved in this timeframe.</div>
                      ) : (
                        <div>
                          {comparison.fixed.map((v, i) => (
                            <div key={i} className="compare-vuln-item fixed">
                              <div style={{ flex: 1 }}>
                                <div className="compare-vuln-name">{v.id}</div>
                              </div>
                              <span className={`compare-threat-badge ${getSeverityColor(v.severity)}`} style={{ opacity: 0.5 }}>{v.severity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ScanCompareModal
