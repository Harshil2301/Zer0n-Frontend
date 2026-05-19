import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

// ── Eager imports (needed immediately on homepage) ────────────────────────────
import LoadingScreen from './components/LoadingScreen'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import DualAudience from './components/DualAudience'
import LiveDemo from './components/LiveDemo'
import Footer from './components/Footer'
import './App.css'

// ── Lazy imports (loaded only when user navigates to those routes) ────────────
const IdentityPage   = lazy(() => import('./components/IdentityPage'))
const Dashboard      = lazy(() => import('./components/Dashboard'))
const FaceScan       = lazy(() => import('./components/FaceScan'))
const PlanSelection  = lazy(() => import('./components/PlanSelection'))
const Roadmap        = lazy(() => import('./components/Roadmap'))
const Whitepaper     = lazy(() => import('./components/Whitepaper'))
const Contact        = lazy(() => import('./components/Contact'))
const Documentation  = lazy(() => import('./components/Documentation'))
const DownloadCenter = lazy(() => import('./components/DownloadCenter'))

// Minimal loading fallback shown while lazy chunks download
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0a0a0a', color: '#00ff88',
    fontFamily: 'monospace', fontSize: '14px', letterSpacing: '2px'
  }}>
    LOADING...
  </div>
)

// Helper component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('zeron_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  // Loading screen only shown once per session on the homepage
  const HomePageWithLoader = () => {
    const [isLoading, setIsLoading] = useState(
      () => !sessionStorage.getItem('zeron_loaded')
    )

    const handleLoadingComplete = () => {
      sessionStorage.setItem('zeron_loaded', 'true')
      setIsLoading(false)
    }

    return (
      <>
        {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
        <Navigation />
        <Hero />
        <HowItWorks />
        <Features />
        <DualAudience />
        <LiveDemo />
        <Footer />
      </>
    )
  }

  return (
    <div className="App">
      <Router>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePageWithLoader />} />
            <Route path="/identity" element={<IdentityPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/face-scan" element={<FaceScan />} />
            <Route path="/plan-selection" element={<PlanSelection />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/whitepaper" element={<Whitepaper />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/download" element={<DownloadCenter />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  )
}

export default App
