import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Search, Activity, Radio, Send, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './AdminPanel.css';

const AdminPanel = () => {
  const [stats, setStats] = useState({ users: 1420, scans: 8945, threats: 34 });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('CRITICAL');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Fetch 5 most recent scans across all users
        const scansRef = collection(db, 'scans');
        const q = query(scansRef, orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        
        const scans = [];
        querySnapshot.forEach((doc) => {
          scans.push({ id: doc.id, ...doc.data() });
        });
        
        setRecentScans(scans);
        
        // Mock aggregate stats since we don't have cloud functions setup for aggregation
        setStats({
          users: 1420 + Math.floor(Math.random() * 50),
          scans: 8945 + scans.length,
          threats: 34 + Math.floor(Math.random() * 5)
        });

      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    try {
      setIsBroadcasting(true);
      
      const broadcastsRef = collection(db, 'broadcasts');
      await addDoc(broadcastsRef, {
        title: broadcastTitle,
        message: broadcastMessage,
        severity: broadcastSeverity,
        createdAt: serverTimestamp(),
        active: true,
        source: 'ADMIN_CONSOLE'
      });

      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending broadcast:', err);
      alert('Failed to send broadcast. Check console.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="section-header-dash" style={{ marginBottom: '24px' }}>
        <div className="section-header-content-dash">
          <h2 className="section-title-dash" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00ccff' }}>
            <ShieldAlert size={28} />
            Command Center
          </h2>
          <p className="section-subtitle-dash">Global platform metrics and emergency broadcast controls.</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon users"><Users size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.users.toLocaleString()}</span>
            <span className="admin-stat-label">Active Users</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon scans"><Search size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.scans.toLocaleString()}</span>
            <span className="admin-stat-label">Total Scans Executed</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon threats"><Activity size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.threats.toLocaleString()}</span>
            <span className="admin-stat-label">0-Days Prevented</span>
          </div>
        </div>
      </div>

      <div className="admin-main-grid">
        {/* Broadcast Console */}
        <div className="admin-card broadcast-console">
          <h3 className="admin-card-title">
            <Radio size={20} style={{ color: '#00ccff' }} />
            Global Threat Broadcast
          </h3>
          <p className="admin-card-desc">Push a high-priority alert to all connected users instantly.</p>
          
          <form onSubmit={handleBroadcast} className="broadcast-form">
            <div className="form-group">
              <label>Threat Title</label>
              <input 
                type="text" 
                placeholder="e.g., URGENT: Log4j Zero-Day Detected in Wild" 
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Severity Level</label>
              <select 
                value={broadcastSeverity}
                onChange={(e) => setBroadcastSeverity(e.target.value)}
              >
                <option value="CRITICAL">CRITICAL (Red)</option>
                <option value="HIGH">HIGH (Orange)</option>
                <option value="MEDIUM">MEDIUM (Yellow)</option>
                <option value="INFO">INFO (Blue)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Threat Details</label>
              <textarea 
                placeholder="Provide actionable intelligence for users..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className={`broadcast-btn ${broadcastSuccess ? 'success' : ''}`}
              disabled={isBroadcasting || broadcastSuccess}
            >
              {isBroadcasting ? (
                <><Activity className="spin" size={18} /> TRANSMITTING...</>
              ) : broadcastSuccess ? (
                <><CheckCircle size={18} /> BROADCAST SENT</>
              ) : (
                <><Send size={18} /> INITIALIZE BROADCAST</>
              )}
            </button>
          </form>
        </div>

        {/* Global Recent Scans */}
        <div className="admin-card recent-scans">
          <h3 className="admin-card-title">
            <Clock size={20} />
            Global Scan Activity
          </h3>
          <p className="admin-card-desc">Real-time feed of the latest scans performed on the network.</p>

          <div className="admin-scan-list">
            {loading ? (
              <div className="admin-loading"><Activity className="spin" size={24} /></div>
            ) : recentScans.length === 0 ? (
              <div className="admin-empty">No recent scans found.</div>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="admin-scan-item">
                  <div className="admin-scan-header">
                    <span className="admin-scan-domain">{scan.domain || 'Unknown Target'}</span>
                    <span className={`admin-scan-status ${scan.status?.toLowerCase() || 'pending'}`}>
                      {scan.status || 'Pending'}
                    </span>
                  </div>
                  <div className="admin-scan-meta">
                    <span>User: {scan.userId?.substring(0, 8)}...</span>
                    <span>{new Date(scan.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
