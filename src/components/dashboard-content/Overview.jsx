import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Search, Activity, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Globe, Zap, ChevronRight, Star,
  BarChart2, Target, Award, ArrowUpRight
} from 'lucide-react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const Overview = ({ userId, userData, onNavigate }) => {
  const [stats, setStats] = useState({
    totalScans: 0,
    completedScans: 0,
    totalVulns: 0,
    criticalVulns: 0,
    highVulns: 0,
    mediumVulns: 0,
    lowVulns: 0,
    estimatedBounty: 0,
  })
  const [recentScans, setRecentScans] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [topDomains, setTopDomains] = useState([])

  const planInfo = userData?.plan || userData?.account
  const profile = userData?.profile || userData
  const displayName = profile?.fullName?.split(' ')[0] || 'User'
  const planType = (planInfo?.type || planInfo?.plan || 'basic').toLowerCase()
  const planColors = {
    premium: { color: '#ffd60a', bg: 'rgba(255,214,10,0.1)', border: 'rgba(255,214,10,0.3)' },
    pro: { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)' },
    basic: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
  }
  const pc = planColors[planType] || planColors.basic

  useEffect(() => {
    if (!userId) return
    const fetchStats = async () => {
      try {
        setLoading(true)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const res = await fetch(`${apiUrl}/api/user/${userId}/scans`)
        const data = await res.json()
        const snap = data.success ? data.scans : []

        let totalVulns = 0, criticalVulns = 0, highVulns = 0, mediumVulns = 0, lowVulns = 0
        let estimatedBounty = 0
        let completedScans = 0
        const scansArr = []
        const domainMap = {}
        const dailyMap = {}

        snap.forEach(d => {
          if (d.hiddenInFrontend) return
          scansArr.push(d)

          if (d.status?.toLowerCase() === 'completed') completedScans++

          const vulns = d.vulnerabilities || []
          totalVulns += vulns.length
          vulns.forEach(v => {
            const sev = (v.severity || '').toLowerCase()
            if (sev === 'critical') criticalVulns++
            else if (sev === 'high') highVulns++
            else if (sev === 'medium') mediumVulns++
            else if (sev === 'low') lowVulns++
          })

          estimatedBounty += d.estimatedBounty?.total || 0

          // Track per-domain vuln counts
          const domain = d.domain || 'Unknown'
          if (!domainMap[domain]) domainMap[domain] = { domain, vulns: 0, scans: 0 }
          domainMap[domain].vulns += vulns.length
          domainMap[domain].scans++

          // Build daily chart data
          const dateStr = d.createdAt
            ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Unknown'
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, scans: 0, vulns: 0, ts: new Date(d.createdAt || 0).getTime() }
          dailyMap[dateStr].scans++
          dailyMap[dateStr].vulns += vulns.length
        })

        // Sort chart data chronologically, take last 14 days
        const sorted = Object.values(dailyMap)
          .sort((a, b) => a.ts - b.ts)
          .slice(-14)
        setChartData(sorted)

        // Sort scans by date descending for Recent Scans
        scansArr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRecentScans(scansArr.slice(0, 5))

        // Top domains by vuln count
        const topDomainsList = Object.values(domainMap)
          .sort((a, b) => b.vulns - a.vulns)
          .slice(0, 5)
        setTopDomains(topDomainsList)

        setStats({ totalScans: scansArr.length, completedScans, totalVulns, criticalVulns, highVulns, mediumVulns, lowVulns, estimatedBounty })
        setRecentScans(scansArr.slice(0, 5))
      } catch (err) {
        console.error('[Overview] Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [userId])

  const StatCard = ({ icon: Icon, label, value, sub, color, bg, border, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: bg || 'rgba(0,0,0,0.4)',
        border: `1px solid ${border || 'rgba(255,255,255,0.06)'}`,
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: '1 1 180px',
        minWidth: '150px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon size={18} style={{ color: color || '#888' }} />
        {sub && <span style={{ fontSize: '0.7rem', color: '#555', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '10px' }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || '#fff', lineHeight: 1 }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
    </motion.div>
  )

  const riskColor = stats.criticalVulns > 0 ? '#ff2d55' : stats.highVulns > 0 ? '#ff6b35' : stats.mediumVulns > 0 ? '#ffd60a' : '#00ff88'
  const riskLabel = stats.criticalVulns > 0 ? 'CRITICAL RISK' : stats.highVulns > 0 ? 'HIGH RISK' : stats.mediumVulns > 0 ? 'MEDIUM RISK' : 'LOW RISK'

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(0,212,255,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.12)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '3px', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>
            Welcome back
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            {displayName} <span style={{ color: '#00ff88' }}>👋</span>
          </h2>
          <p style={{ margin: '6px 0 0', color: '#666', fontSize: '0.85rem' }}>
            Here's your security overview
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {stats.totalVulns > 0 && (
            <div style={{ background: `${riskColor}18`, border: `1px solid ${riskColor}40`, borderRadius: '20px', padding: '6px 16px', color: riskColor, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
              {riskLabel}
            </div>
          )}
          <div style={{ background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: '20px', padding: '6px 16px', color: pc.color, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {planType} Plan
          </div>
          <button
            onClick={() => onNavigate('scan')}
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Search size={14} />
            New Scan
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <StatCard icon={Activity} label="Total Scans" value={stats.totalScans} color="#00ff88" bg="rgba(0,255,136,0.04)" border="rgba(0,255,136,0.12)" delay={0.05} />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completedScans} color="#00d4ff" bg="rgba(0,212,255,0.04)" border="rgba(0,212,255,0.12)" delay={0.1} />
        <StatCard icon={AlertTriangle} label="Vulnerabilities" value={stats.totalVulns} color="#ffd60a" bg="rgba(255,214,10,0.04)" border="rgba(255,214,10,0.12)" delay={0.15} />
        <StatCard icon={Shield} label="Critical" value={stats.criticalVulns} color="#ff2d55" bg="rgba(255,45,85,0.04)" border="rgba(255,45,85,0.12)" delay={0.2} />
        <StatCard icon={TrendingUp} label="Est. Bounty" value={stats.estimatedBounty > 0 ? `$${stats.estimatedBounty.toLocaleString()}` : '$0'} color="#00ff88" bg="rgba(0,255,136,0.04)" border="rgba(0,255,136,0.12)" sub="USD" delay={0.25} />
      </div>

      {/* Chart + Top Domains Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>

        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', flex: '1 1 300px', minWidth: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Scan Activity</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#555' }}>Last 14 days</p>
            </div>
            <BarChart2 size={18} style={{ color: '#333' }} />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVulns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Area type="monotone" dataKey="scans" name="Scans" stroke="#00ff88" strokeWidth={2} fill="url(#colorScans)" />
                <Area type="monotone" dataKey="vulns" name="Vulnerabilities" stroke="#ff6b35" strokeWidth={2} fill="url(#colorVulns)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.85rem' }}>
              No scan data yet — run your first scan!
            </div>
          )}
        </motion.div>

        {/* Top Domains */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', flex: '0 0 320px', minWidth: '260px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Top Targets</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#555' }}>By vulnerability count</p>
            </div>
            <Target size={18} style={{ color: '#333' }} />
          </div>
          {topDomains.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topDomains.map((d, i) => (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === 0 ? 'rgba(255,45,85,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? '#ff2d55' : '#222'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: i === 0 ? '#ff2d55' : '#555', fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.domain}</div>
                    <div style={{ fontSize: '0.7rem', color: '#555' }}>{d.scans} scan{d.scans !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: d.vulns > 0 ? '#ff6b35' : '#00ff88', fontWeight: 700, flexShrink: 0 }}>
                    {d.vulns} {d.vulns === 1 ? 'vuln' : 'vulns'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.85rem', textAlign: 'center' }}>
              No domains scanned yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity + Severity Breakdown Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

        {/* Recent Scans */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', flex: '1 1 300px', minWidth: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Recent Scans</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#555' }}>Latest 5 scans</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          {recentScans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentScans.map((scan) => {
                const vulns = scan.vulnerabilities?.length || 0
                const isCompleted = scan.status?.toLowerCase() === 'completed'
                const statusColor = isCompleted ? '#00ff88' : '#ffd60a'
                return (
                  <div key={scan.scanId} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <Globe size={16} style={{ color: '#444', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.domain || 'Unknown'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '2px' }}>
                        {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {vulns > 0 && <span style={{ fontSize: '0.7rem', background: 'rgba(255,107,53,0.12)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)', padding: '2px 8px', borderRadius: '10px' }}>{vulns}</span>}
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#333', fontSize: '0.85rem' }}>
              No scans yet
            </div>
          )}
        </motion.div>

        {/* Severity Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', flex: '0 0 280px', minWidth: '220px' }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Severity Breakdown</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#555' }}>All-time totals</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Critical', count: stats.criticalVulns, color: '#ff2d55', total: stats.totalVulns },
              { label: 'High', count: stats.highVulns, color: '#ff6b35', total: stats.totalVulns },
              { label: 'Medium', count: stats.mediumVulns, color: '#ffd60a', total: stats.totalVulns },
              { label: 'Low', count: stats.lowVulns, color: '#00ff88', total: stats.totalVulns },
            ].map(({ label, count, color, total }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', color, fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: total > 0 ? `${Math.min((count / total) * 100, 100)}%` : '0%' }}
                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: color, borderRadius: '2px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '1px', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Quick Actions</div>
            {[
              { label: 'Run New Scan', icon: Zap, tab: 'scan', color: '#00ff88' },
              { label: 'View History', icon: Activity, tab: 'history', color: '#00d4ff' },
              { label: 'Threat Intel', icon: AlertTriangle, tab: 'threats', color: '#ffd60a' },
            ].map(({ label, icon: Icon, tab, color }) => (
              <button
                key={tab}
                onClick={() => onNavigate(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.color = color }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#aaa' }}
              >
                <Icon size={14} style={{ color }} />
                {label}
                <ArrowUpRight size={12} style={{ marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Overview
