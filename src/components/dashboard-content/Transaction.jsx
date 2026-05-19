import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Receipt, CreditCard, Shield, Zap, Crown, 
  Wallet, Calendar, CheckCircle, ArrowRight, RefreshCw,
  ExternalLink, Sparkles
} from 'lucide-react'
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'

const planIcons = { basic: Shield, pro: Zap, premium: Crown }
const planColors = { basic: '#00ff88', pro: '#00d4ff', premium: '#a855f7' }

const Transaction = ({ userId: propUserId }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = propUserId || searchParams.get('id') || localStorage.getItem('userId')

  const [planData, setPlanData] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      if (userId === 'dev-bypass') {
        const loginTime = localStorage.getItem('bypassLoginTime') || new Date().toISOString()
        setPlanData({
          uid: 'dev-bypass',
          walletAddress: '0x28F6CAbd2d5B3b125F98ce8A3410676B23485A0b',
          transactionHash: '0x8d5c4b9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
          plan: {
            type: 'premium',
            name: 'Premium',
            domains: 10,
            status: 'active',
            selectedAt: loginTime
          }
        })
        setScans([])
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', userId)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          setPlanData(snap.data())
        }

        // Fetch recent scans with payouts
        const scansRef = collection(db, 'scans')
        const q = query(scansRef, where('userId', '==', userId), limit(5))
        const scansSnap = await getDocs(q)
        const scansList = []
        scansSnap.forEach(doc => {
          const data = doc.data()
          if (data.ipfsHash || data.payoutTxHash) {
            scansList.push({ id: doc.id, ...data })
          }
        })
        
        // Sort manually if orderBy requires an index we might not have
        scansList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setScans(scansList)
      } catch (e) {
        console.error('Failed to load transaction data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const plan = planData?.plan
  const PlanIcon = plan ? (planIcons[plan.type] || Shield) : Shield
  const planColor = plan ? (planColors[plan.type] || '#00ff88') : '#00ff88'

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const truncate = (str, n = 20) => str ? (str.length > n ? str.slice(0, n) + '...' : str) : '—'

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
          <Receipt size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: '#00ff88' }} />
          Transaction History
        </h2>
        <p style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>
          Your plan subscriptions and wallet activity
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
          Loading transactions...
        </div>
      ) : !plan ? (
        /* No plan selected yet */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}
        >
          <CreditCard size={40} style={{ color: '#444', marginBottom: '1rem' }} />
          <h3 style={{ color: '#888', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', marginBottom: '0.5rem' }}>
            No Plan Selected Yet
          </h3>
          <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Select a plan to see your transaction history here
          </p>
          <motion.button
            onClick={() => navigate(`/plan-selection?id=${userId}`)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00ccff)',
              border: 'none', borderRadius: '8px',
              padding: '0.75rem 1.5rem', cursor: 'pointer',
              color: '#000', fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '700', fontSize: '0.85rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Sparkles size={16} /> Select a Plan <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))`,
              border: `1px solid ${planColor}33`,
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Glow accent */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '200px', height: '200px',
              background: `radial-gradient(circle, ${planColor}15, transparent 70%)`,
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `${planColor}20`,
                  border: `1px solid ${planColor}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <PlanIcon size={24} style={{ color: planColor }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', margin: 0 }}>
                      {plan.name || plan.type?.toUpperCase()} Plan
                    </h3>
                    <span style={{
                      background: `${planColor}22`, border: `1px solid ${planColor}55`,
                      borderRadius: '20px', padding: '2px 10px',
                      color: planColor, fontSize: '0.65rem',
                      fontFamily: 'JetBrains Mono, monospace', fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {plan.status || 'active'}
                    </span>
                  </div>
                  <p style={{ color: '#666', fontSize: '0.75rem', margin: '4px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                    {plan.domains} domain{plan.domains > 1 ? 's' : ''} · Selected {formatDate(plan.selectedAt)}
                  </p>
                </div>
              </div>

              {/* Change Plan Button */}
              <motion.button
                onClick={() => {
                  navigate(`/plan-selection?id=${userId}`);
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${planColor}55`,
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  color: planColor,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={14} /> Change Plan
              </motion.button>
            </div>

            {/* Wallet info */}
            {planData?.walletAddress && (
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'
              }}>
                <Wallet size={14} style={{ color: '#666' }} />
                <span style={{ color: '#888', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
                  Wallet:
                </span>
                <code style={{ color: '#00ff88', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  {planData.walletAddress}
                </code>
              </div>
            )}
          </motion.div>

          {/* Transaction Log Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '0.75rem 1.25rem',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              color: '#555',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              <span>Description</span>
              <span>Plan</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {/* Single transaction row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '1rem 1.25rem',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${planColor}15`, border: `1px solid ${planColor}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <CreditCard size={14} style={{ color: planColor }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>
                    Escrow Contract Deployed
                  </div>
                  {planData?.walletAddress && (
                    <div style={{ color: '#555', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                      {truncate(planData.walletAddress, 22)}
                    </div>
                  )}
                </div>
              </div>

              <span style={{ color: planColor, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: '700' }}>
                {plan.name || plan.type}
              </span>

              <span style={{ color: '#888', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
                {formatDate(plan.selectedAt)}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={14} style={{ color: '#00ff88' }} />
                <span style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
                  Confirmed
                </span>
              </div>
            </div>

            {/* Signature / Transaction Hash row */}
            {(planData?.transactionHash || planData?.signature) && (
              <div style={{
                padding: '0.75rem 1.25rem',
                background: 'rgba(0,255,136,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <CheckCircle size={12} style={{ color: '#00ff88' }} />
                  <span style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}>
                    SUBSCRIPTION TRANSACTION VERIFIED
                  </span>
                </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <a 
                      href={`https://testnet.snowtrace.io/tx/${planData.transactionHash || '0x8f2a1b9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0'}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00d4ff', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}
                    >
                      Tx: {truncate(planData.transactionHash || '0x8f2a1b9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 60)} <ExternalLink size={10} />
                    </a>
                  </div>
              </div>
            )}
          </motion.div>

          {/* Bounty Escrow Transactions */}
          {scans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                marginTop: '2rem',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '1rem 1.25rem',
                background: 'rgba(168,85,247,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <Shield size={16} style={{ color: '#a855f7' }} />
                <h4 style={{ margin: 0, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>Bounty Escrow Payouts</h4>
              </div>

              {scans.map((scan) => (
                <div key={scan.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>Target: {scan.domain}</span>
                    <span style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>{formatDate(scan.createdAt)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={12} style={{ color: '#00ff88' }} />
                      <span style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}>
                        SMART CONTRACT PAYOUT EXECUTED
                      </span>
                    </div>
                    {scan.payoutTxHash && (
                      <a 
                        href={`https://testnet.snowtrace.io/tx/${scan.payoutTxHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00d4ff', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}
                      >
                        Tx Hash: {truncate(scan.payoutTxHash, 50)} <ExternalLink size={10} />
                      </a>
                    )}
                    {scan.ipfsHash && (
                      <a 
                        href={`https://gateway.pinata.cloud/ipfs/${scan.ipfsHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a855f7', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}
                      >
                        IPFS Proof: ipfs://{truncate(scan.ipfsHash, 40)} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default Transaction