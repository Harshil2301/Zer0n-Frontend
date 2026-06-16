import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Shield,
  History,
  CreditCard,
  Settings,
  Crown,
  LogOut,
  Menu,
  Bell,
  User,
  Sparkles,
  BarChart3,
  Bold,
  ChevronLeft,
  ChevronRight,
  Loader,
  Globe,
  ShieldAlert,
  Home
} from 'lucide-react'
import { getUUIDFromURL } from '../utils/uuid'
import ProfileModal from './ProfileModal'
import NotificationPanel from './NotificationPanel'
import SettingsPage from './SettingsPage'
import PlanWarningBanner from './PlanWarningBanner'
import ErrorBoundary from './ErrorBoundary'
import ThreatFeed from './ThreatFeed'
import { useLanguage } from '../contexts/LanguageContext'
import './Dashboard.css'

// Lazy loaded dashboard contents
const Overview = lazy(() => import('./dashboard-content/Overview'))
const NewScan = lazy(() => import('./dashboard-content/NewScan'))
const ScanHistory = lazy(() => import('./dashboard-content/ScanHistory'))
const Transaction = lazy(() => import('./dashboard-content/Transaction'))
const AdminPanel = lazy(() => import('./dashboard-content/AdminPanel'))

const Dashboard = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [userData, setUserData] = useState(null)
  const [hasPlan, setHasPlan] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const userId = searchParams.get('id') || getUUIDFromURL() // Get UUID from URL

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'settings') {
      setActiveTab('settings')
    }
  }, [searchParams])

  // Listen for openSettings event from ProfileModal
  useEffect(() => {
    const handleOpenSettings = () => {
      setActiveTab('settings')
    }

    window.addEventListener('openSettings', handleOpenSettings)
    return () => window.removeEventListener('openSettings', handleOpenSettings)
  }, [])

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        console.error('No user ID found in URL')
        // Redirect to face scan if no user ID
        navigate('/face-scan')
        return
      }

      console.log('Loading dashboard data for UUID:', userId)

      // Dev Bypass Mock Handler (9 domains limit, pre-configured dashboard)
      if (userId === 'dev-bypass') {
        console.log('Activating Dev Bypass Dashboard (9 domains)')
        const loginTime = localStorage.getItem('bypassLoginTime') || new Date().toISOString()
        setUserData({
          uid: 'dev-bypass',
          profile: {
            fullName: 'Premium Account',
            email: 'premium@zeron.io',
            phone: '+1 (555) 019-9000',
            organization: 'Academic Audit Board',
            role: 'Lead Evaluator',
            location: 'USA'
          },
          account: {
            status: 'active',
            plan: 'premium',
            createdAt: loginTime,
            credits: 999
          },
          plan: {
            type: 'premium',
            name: 'Premium',
            domains: 10,
            domainsUsed: 0,
            selectedAt: loginTime,
            status: 'active'
          },
          walletAddress: '0x28F6CAbd2d5B3b125F98ce8A3410676B23485A0b',
          isAdmin: true
        })
        setSelectedPlan('premium')
        setHasPlan(true)
        return
      }

      if (!userId) {
        console.error('No user ID found in URL')
        navigate('/face-scan')
        return
      }

      // Check cache first
      const cachedProfileStr = sessionStorage.getItem('zeron_profile_cache');
      if (cachedProfileStr) {
        try {
          const cachedProfile = JSON.parse(cachedProfileStr);
          // Check TTL (5 minutes)
          if (Date.now() - cachedProfile.timestamp < 5 * 60 * 1000 && cachedProfile.userId === userId) {
            console.log('User data loaded from session cache');
            setUserData(cachedProfile.data);
            setSelectedPlan(cachedProfile.data.account?.plan || 'basic');
            if (cachedProfile.data.plan && cachedProfile.data.plan.type) {
              setHasPlan(true);
            } else {
              setHasPlan(false);
            }
            
            // Check completeness
            const profile = cachedProfile.data.profile || cachedProfile.data;
            const isComplete = profile?.fullName && profile?.email && profile?.organization;
            if (!isComplete) {
              navigate(`/identity?id=${userId}`);
            }
            return;
          }
        } catch (e) {
          console.warn('Failed to parse profile cache', e);
        }
      }

      // Try to load from Firebase first
      let dataLoaded = false
      try {
        const { getUserProfile } = await import('../utils/faceVerification')
        const result = await getUserProfile(userId)

        if (result.success && result.user) {
          console.log('User data loaded from Firebase:', result.user)
          setUserData(result.user)
          setSelectedPlan(result.user.account?.plan || 'basic')
          
          sessionStorage.setItem('zeron_profile_cache', JSON.stringify({
            userId,
            timestamp: Date.now(),
            data: result.user
          }));

          // Check if user has selected a plan
          if (result.user.plan && result.user.plan.type) {
            setHasPlan(true)
            console.log('User plan:', result.user.plan)
            console.log('Wallet address:', result.user.walletAddress)
          } else {
            setHasPlan(false)
          }

          dataLoaded = true

          // Check if profile is complete (supports both flat and nested profile structures)
          const profile = result.user.profile || result.user;
          const isComplete = profile?.fullName &&
            profile?.email &&
            profile?.organization;

          if (!isComplete) {
            console.log('Profile incomplete, redirecting to identity page')
            navigate(`/identity?id=${userId}`)
            return
          }
        }
      } catch (fbError) {
        console.log('Firebase load failed, trying API:', fbError)
      }

      // Fallback to API if Firebase fails
      if (!dataLoaded) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
          const response = await fetch(`${apiUrl}/api/user/${userId}`)
          const data = await response.json()

          if (data.success && data.user) {
            setUserData(data.user)
            setSelectedPlan(data.user.account?.plan || 'basic')

            sessionStorage.setItem('zeron_profile_cache', JSON.stringify({
              userId,
              timestamp: Date.now(),
              data: data.user
            }));

            // Check if user has selected a plan
            if (data.user.plan && data.user.plan.type) {
              setHasPlan(true)
            } else {
              setHasPlan(false)
            }

            console.log('User data loaded from API:', data.user)
          } else {
            console.error('Failed to load user data')
            // Redirect to identity page if user data not found
            navigate(`/identity?id=${userId}`)
          }
        } catch (error) {
          console.error('API error:', error)
          // Redirect to face scan on error
          navigate('/face-scan')
        }
      }
    }

    loadUserData()
  }, [userId, navigate])

  // Session validation — check biometric JWT token on mount
  useEffect(() => {
    const validateSession = () => {
      const bioToken = localStorage.getItem('bioToken') || localStorage.getItem('zeron_bio_token');
      
      // If no bio token at all, redirect unless it's dev-bypass mode
      if (!bioToken && userId !== 'dev-bypass') {
        const sessionId = localStorage.getItem('sessionId');
        const storedUserId = localStorage.getItem('userId');
        
        // Allow if we have a matching sessionId (email/Google login path)
        if (!sessionId || !storedUserId) {
          console.warn('[Session] No valid session token found');
          // Don't redirect immediately — let the data load check handle it
          // This avoids breaking email/Google login users who don't have a bioToken
        }
      }
    };
    
    validateSession();
  }, [userId, navigate]);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-logo">
              <img
                src="/assets/zeron-logo.png"
                alt="ZerOn"
                className="logo-icon-main"
              />
            </div>
          </div>

          <div className="header-right">
            <button
              className="header-btn notification-btn"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={18} />
              <div className="notification-dot"></div>
            </button>
            <button
              className="header-btn"
              onClick={() => setProfileModalOpen(true)}
            >
              <User size={18} />
            </button>
          </div>
        </header>

        {/* Sidebar */}
        <AnimatePresence>
          {true && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`dashboard-sidebar ${sidebarOpen ? '' : 'closed'}`}
            >
              <div className="sidebar-content">
                <div className="sidebar-brand">
                  <div className="brand-icon">
                    <img
                      src="/assets/zeron-logo.png"
                      alt="ZerOn"
                      className="brand-logo-img"
                    />
                  </div>
                  {sidebarOpen && (
                    <span className="portal-text"><bold>Dashboard</bold></span>
                  )}
                </div>

                <nav className="sidebar-nav">
                  <button
                    className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                    data-tooltip="Overview"
                  >
                    <div className="nav-icon">
                      <Home size={20} />
                    </div>
                    {sidebarOpen && <span>Overview</span>}
                  </button>

                  <button
                    className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scan')}
                    data-tooltip="Security Scan"
                  >
                    <div className="nav-icon">
                      <Search size={20} />
                    </div>
                    {sidebarOpen && <span>{t('securityScan')}</span>}
                  </button>

                  <button
                    className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    data-tooltip="Scan History"
                  >
                    <div className="nav-icon">
                      <History size={20} />
                    </div>
                    {sidebarOpen && <span>{t('scanHistory')}</span>}
                  </button>

                  <button
                    className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                    data-tooltip="Transactions"
                  >
                    <div className="nav-icon">
                      <CreditCard size={20} />
                    </div>
                    {sidebarOpen && <span>{t('transactions')}</span>}
                  </button>

                  <button
                    className={`nav-item ${activeTab === 'threats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('threats')}
                    data-tooltip="Threat Intel"
                  >
                    <div className="nav-icon">
                      <Globe size={20} />
                    </div>
                    {sidebarOpen && <span>Threat Intel</span>}
                  </button>

                  {userData?.isAdmin && (
                    <button
                      className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                      onClick={() => setActiveTab('admin')}
                      data-tooltip="Admin Panel"
                    >
                      <div className="nav-icon">
                        <ShieldAlert size={20} />
                      </div>
                      {sidebarOpen && <span>Admin Panel</span>}
                    </button>
                  )}

                  <div className="nav-divider"></div>

                  <button
                    className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                    data-tooltip="Settings"
                  >
                    <div className="nav-icon">
                      <Settings size={20} />
                    </div>
                    {sidebarOpen && <span>{t('settings')}</span>}
                  </button>
                </nav>

                <div className="sidebar-footer">
                  <div className="user-profile-card">
                    <div className="profile-avatar-small" style={{ overflow: 'hidden', padding: 0, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData?.profile?.fullName || userData?.fullName || 'User')}&backgroundColor=0f3460&textColor=00ff88`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    </div>
                    {sidebarOpen && (
                      <div className="profile-details">
                        <div className="profile-name">
                          {userData?.profile?.fullName || userData?.fullName || 'User'}
                        </div>
                        <div className="profile-status">
                          <Sparkles size={10} />
                          {userData?.plan?.name ? `${userData.plan.name} Plan` : (selectedPlan === 'pro' ? 'Pro Plan' : 'Free Plan')}
                        </div>
                      </div>
                    )}
                    {sidebarOpen && (
                      <button
                        className="logout-btn"
                        onClick={() => {
                          localStorage.removeItem('sessionId')
                          localStorage.removeItem('userId')
                          navigate('/face-scan')
                        }}
                      >
                        <LogOut size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    className="sidebar-toggle-btn"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                  >
                    {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {/* Plan Banner — always visible; shows "Change Plan" if plan exists */}
          <PlanWarningBanner userId={userId} hasPlan={hasPlan} currentPlan={userData?.plan} />

          <div className="tabs-container">
            <ErrorBoundary>
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}><Loader className="spinner-icon" size={32} /></div>}>
                {/* Overview Tab */}
                <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'overview' ? 1 : 0, y: activeTab === 'overview' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <Overview userId={userId} userData={userData} onNavigate={setActiveTab} />
                  </motion.div>
                </div>

                {/* Scan Tab */}
                <div style={{ display: activeTab === 'scan' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'scan' ? 1 : 0, y: activeTab === 'scan' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <NewScan userId={userId} onNavigate={setActiveTab} />
                  </motion.div>
                </div>

                {/* History Tab */}
                <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'history' ? 1 : 0, y: activeTab === 'history' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <ScanHistory userId={userId} />
                  </motion.div>
                </div>

                {/* Threat Intel Tab */}
                <div style={{ display: activeTab === 'threats' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'threats' ? 1 : 0, y: activeTab === 'threats' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <div className="section-header-dash" style={{ marginBottom: '24px' }}>
                      <div className="section-header-content-dash">
                        <h2 className="section-title-dash">Global Threat Intelligence</h2>
                        <p className="section-subtitle-dash">Real-time CVE zero-day vulnerability monitoring feed</p>
                      </div>
                    </div>
                    <ThreatFeed />
                  </motion.div>
                </div>

                {/* Admin Panel Tab */}
                {userData?.isAdmin && (
                  <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: activeTab === 'admin' ? 1 : 0, y: activeTab === 'admin' ? 0 : 20 }}
                      transition={{ duration: 0.3 }}
                      className="dashboard-content-section"
                    >
                      <AdminPanel />
                    </motion.div>
                  </div>
                )}

                {/* Transactions Tab */}
                <div style={{ display: activeTab === 'transactions' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'transactions' ? 1 : 0, y: activeTab === 'transactions' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <Transaction userId={userId} userData={userData} />
                  </motion.div>
                </div>

                {/* Settings Tab */}
                <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'settings' ? 1 : 0, y: activeTab === 'settings' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <SettingsPage userData={userData} userId={userId} />
                  </motion.div>
                </div>
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>

        {/* Profile Modal */}
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          userData={userData}
          userId={userId}
        />

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          userId={userId}
        />
      </div>
    </div>
  )
}

export default Dashboard