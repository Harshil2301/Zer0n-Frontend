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
  Loader
} from 'lucide-react'
import { getUUIDFromURL } from '../utils/uuid'
import ProfileModal from './ProfileModal'
import NotificationPanel from './NotificationPanel'
import SettingsPage from './SettingsPage'
import PlanWarningBanner from './PlanWarningBanner'
import ErrorBoundary from './ErrorBoundary'
import { useLanguage } from '../contexts/LanguageContext'
import './Dashboard.css'

// Lazy loaded dashboard contents
const NewScan = lazy(() => import('./dashboard-content/NewScan'))
const ScanHistory = lazy(() => import('./dashboard-content/ScanHistory'))
const Transaction = lazy(() => import('./dashboard-content/Transaction'))

const Dashboard = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('scan')
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
          walletAddress: '0x28F6CAbd2d5B3b125F98ce8A3410676B23485A0b'
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

      // Try to load from Firebase first
      let dataLoaded = false
      try {
        const { getUserProfile } = await import('../utils/faceVerification')
        const result = await getUserProfile(userId)

        if (result.success && result.user) {
          console.log('User data loaded from Firebase:', result.user)
          setUserData(result.user)
          setSelectedPlan(result.user.account?.plan || 'basic')

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

  // Validate session on mount - Disabled for now (API not implemented)
  // useEffect(() => {
  //   const validateSession = async () => {
  //     const sessionId = localStorage.getItem('sessionId')
  //     const storedUserId = localStorage.getItem('userId')
  //     
  //     if (!sessionId || !storedUserId || storedUserId !== userId) {
  //       console.log('Invalid or missing session')
  //       // Redirect to face scan if session invalid
  //       navigate('/face-scan')
  //       return
  //     }
  //
  //     try {
  //       const response = await fetch(`/api/session/validate`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ sessionId, userId })
  //       })
  //       
  //       const data = await response.json()
  //       
  //       if (!data.success || !data.valid) {
  //         console.log('Session validation failed')
  //         localStorage.removeItem('sessionId')
  //         localStorage.removeItem('userId')
  //         navigate('/face-scan')
  //       }
  //     } catch (error) {
  //       console.error('Session validation error:', error)
  //     }
  //   }
  //
  //   validateSession()
  // }, [userId, navigate])

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
                    <div className="profile-avatar-small">
                      <User size={18} />
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

                {/* Transactions Tab */}
                <div style={{ display: activeTab === 'transactions' ? 'block' : 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: activeTab === 'transactions' ? 1 : 0, y: activeTab === 'transactions' ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="dashboard-content-section"
                  >
                    <Transaction userId={userId} />
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