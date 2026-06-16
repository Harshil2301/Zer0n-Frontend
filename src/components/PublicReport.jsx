import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Shield, Lock, AlertTriangle, CheckCircle, Activity, Loader, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const PublicReport = () => {
  const { scanId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [terminalLines, setTerminalLines] = useState([]);
  const [showContent, setShowContent] = useState(false);

  // Animated terminal sequence for report loading
  useEffect(() => {
    const sequence = [
      '> ESTABLISHING SECURE CONNECTION...',
      '> AUTHENTICATING PUBLIC ACCESS TOKEN...',
      '> ACCESS GRANTED. RETRIEVING VAPT REPORT...',
      '> DECRYPTING VULNERABILITY PAYLOAD...',
      '> PARSING THREAT VECTORS...',
      '> RENDER ENGINE INITIALIZED.'
    ];

    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < sequence.length) {
        setTerminalLines(prev => [...prev, sequence[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowContent(true);
        }, 800);
      }
    }, 400); // Speed of terminal lines

    return () => clearInterval(interval);
  }, []);

  // Fetch scan data
  useEffect(() => {
    const fetchScan = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/scan/${scanId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setScanData(data.data);
        } else {
          setError('Report not found or has been deleted.');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to securely retrieve the report. Please check the link.');
      } finally {
        setLoading(false);
      }
    };

    if (scanId) fetchScan();
  }, [scanId]);

  const extractVulns = (data) => {
    const raw = data.vulnerabilities || data.vulns || data.issues || data.alerts || data.results || [];
    if (!Array.isArray(raw)) return [];
    
    return raw.map(v => ({
      id: v.title || v.name || v.id || v.type || 'Unknown Vulnerability',
      severity: (v.severity || v.level || 'info').toString().toUpperCase(),
      description: v.description || v.summary || JSON.stringify(v, null, 2),
      confidence: v.confidence || null
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'rgba(239, 68, 68, 0.1)';
      case 'HIGH': return 'rgba(249, 115, 22, 0.1)';
      case 'MEDIUM': return 'rgba(234, 179, 8, 0.1)';
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  };

  if (!showContent || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono", monospace' }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
          <div style={{ border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', background: '#0a0a0a', padding: '1.5rem', boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00ff88', borderBottom: '1px solid rgba(0, 255, 136, 0.2)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <Terminal size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '2px' }}>ZERON SECURE TERMINAL</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></span>
              </div>
            </div>
            
            <div style={{ minHeight: '200px' }}>
              {terminalLines.map((line, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  style={{ color: '#d4d4d4', fontSize: '0.85rem', marginBottom: '0.5rem' }}
                >
                  <span style={{ color: '#00ff88', marginRight: '8px' }}>$</span>{line}
                </motion.div>
              ))}
              <motion.div 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ color: '#00ff88', display: 'inline-block', marginTop: '0.5rem' }}
              >
                █
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: '"JetBrains Mono", monospace' }}>
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', letterSpacing: '1px' }}>ACCESS DENIED</h2>
          <p style={{ opacity: 0.8 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!scanData) return null;

  const vulns = extractVulns(scanData);
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach(v => {
    if (counts[v.severity] !== undefined) counts[v.severity]++;
    else counts.INFO++;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#d4d4d4', fontFamily: '"JetBrains Mono", monospace', padding: 'min(2rem, 5vw)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/assets/zeron-logo.png" alt="ZerOn Logo" style={{ width: '40px', height: '40px' }} />
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 4px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ZERON SECURITY
                <span style={{ fontSize: '0.7rem', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>VERIFIED REPORT</span>
              </h1>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Automated Vulnerability Assessment & Penetration Testing</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00ff88', fontSize: '0.8rem', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <Lock size={14} /> SECURE PUBLIC VIEW
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
              Report ID: {scanId}
            </div>
          </div>
        </header>

        {/* Executive Summary */}
        <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#00ccff" /> EXECUTIVE SUMMARY
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Target Application</div>
              <div style={{ color: '#00ccff', fontSize: '1.1rem', fontWeight: 'bold' }}>{scanData.domain || 'Unknown Target'}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Scan Date</div>
              <div style={{ color: '#fff', fontSize: '1.1rem' }}>{new Date(scanData.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
              <div style={{ color: '#00ff88', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Completed
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([sev, count]) => (
              count > 0 && (
                <div key={sev} style={{ background: getSeverityBg(sev), border: `1px solid ${getSeverityColor(sev)}40`, padding: '1rem', borderRadius: '8px', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ color: getSeverityColor(sev), fontSize: '2rem', fontWeight: 'bold', lineHeight: '1' }}>{count}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginTop: '8px', letterSpacing: '1px' }}>{sev}</span>
                </div>
              )
            ))}
          </div>
        </section>

        {/* Vulnerability Findings */}
        <section>
          <h2 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#ffaa00" /> VULNERABILITY FINDINGS
          </h2>

          {vulns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0, 255, 136, 0.05)', border: '1px dashed rgba(0, 255, 136, 0.2)', borderRadius: '8px', color: '#00ff88' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 1rem' }} />
              <h3>NO VULNERABILITIES DETECTED</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>The target application passed all automated security checks.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vulns.map((vuln, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}
                >
                  <div style={{ padding: '1rem 1.5rem', background: getSeverityBg(vuln.severity), borderBottom: `1px solid ${getSeverityColor(vuln.severity)}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: getSeverityColor(vuln.severity), border: `1px solid ${getSeverityColor(vuln.severity)}80`, padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {vuln.severity}
                      </span>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{vuln.id}</h3>
                    </div>
                    {vuln.confidence && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Confidence: {vuln.confidence}%</div>
                    )}
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'inherit', lineHeight: '1.6' }}>
                      {vuln.description}
                    </pre>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
          This report was automatically generated by the ZerOn Security Platform. 
          <br />Confidential and Proprietary.
        </footer>

      </div>
    </div>
  );
};

export default PublicReport;
