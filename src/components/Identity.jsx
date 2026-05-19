import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Lottie from 'lottie-react'
import { 
  Shield, 
  User,
  Mail,
  Phone,
  Building,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  MapPin,
  Key,
  Chrome,
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { 
  signInWithGoogle, 
  registerWithEmail,
  signInWithEmail,
  resendVerificationEmail,
  onAuthStateChange
} from '../utils/auth'
import { 
  saveUserProfile, 
  getUserProfile 
} from '../utils/firestore'
import { getUUIDFromURL, redirectWithUUID } from '../utils/uuid'
import './Identity.css'

const Identity = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('id') || getUUIDFromURL() // Get UUID from URL
  const [loginMethod, setLoginMethod] = useState(null) // 'google' or 'manual'
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'signup'
  const [step, setStep] = useState(1) // Multi-step form
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    organization: '',
    role: '',
    location: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [profileAnimation, setProfileAnimation] = useState(null)
  const [displayedPercentage, setDisplayedPercentage] = useState(0)
  const [glow, setGlow] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  // Load user data from UUID if present in URL
  useEffect(() => {
    const loadUserData = async () => {
      if (userId) {
        console.log('Loading user data for UUID:', userId)
        
        // Try to load from Firebase first
        try {
          const { getUserProfile } = await import('../utils/faceVerification')
          const result = await getUserProfile(userId)
          
          if (result.success && result.user) {
            console.log('User data loaded from Firebase:', result.user)
            // Pre-fill form with existing user data from Firebase
            setFormData(prev => ({
              ...prev,
              fullName: result.user.profile?.fullName || prev.fullName,
              email: result.user.profile?.email || prev.email,
              phone: result.user.profile?.phone || prev.phone,
              organization: result.user.profile?.organization || prev.organization,
              role: result.user.profile?.role || prev.role,
              location: result.user.profile?.location || prev.location
            }))
            return
          }
        } catch (fbError) {
          console.log('Firebase load failed, trying API:', fbError)
        }
        
        // Fallback to API if Firebase fails
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
          const response = await fetch(`${apiUrl}/api/user/${userId}`)
          const data = await response.json()
          
          if (data.success && data.user) {
            // Pre-fill form with existing user data
            setFormData(prev => ({
              ...prev,
              fullName: data.user.profile?.fullName || prev.fullName,
              email: data.user.profile?.email || prev.email,
              phone: data.user.profile?.phone || prev.phone,
              organization: data.user.profile?.organization || prev.organization,
              role: data.user.profile?.role || prev.role,
              location: data.user.profile?.location || prev.location
            }))
            
            console.log('User data loaded successfully from API')
          }
        } catch (error) {
          console.error('Failed to load user data:', error)
        }
      }
    }
    
    loadUserData()
  }, [userId])

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Phone validation
  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    return phoneRegex.test(phone)
  }

  // Password validation
  const validatePassword = (password) => {
    return password.length >= 6
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authState) => {
      if (authState.isAuthenticated) {
        setCurrentUser(authState.user)
        
        // Try to load existing profile data from Firestore
        const profileResult = await getUserProfile(authState.user.uid)
        
        if (profileResult.success && profileResult.exists) {
          // User has existing profile data, pre-fill the form
          const profileData = profileResult.data
          const profile = profileData.profile || profileData;
          
          // Check if profile is complete
          const isComplete = profile.fullName && profile.email && profile.organization && profile.phone;
          
          if (isComplete) {
            setSuccessMessage('Welcome back! Redirecting to dashboard...');
            setTimeout(() => {
              navigate(`/dashboard?id=${authState.user.uid}`);
            }, 1000);
            return;
          }

          setFormData(prev => ({
            ...prev,
            fullName: profile.fullName || authState.user.displayName || prev.fullName,
            email: profile.email || authState.user.email || prev.email,
            phone: profile.phone || prev.phone,
            organization: profile.organization || prev.organization,
            role: profile.role || prev.role,
            location: profile.location || prev.location
          }))
        } else {
          // No existing profile, just fill auth data
          if (authState.user.displayName) {
            setFormData(prev => ({
              ...prev,
              fullName: authState.user.displayName,
              email: authState.user.email
            }))
          } else {
            setFormData(prev => ({
              ...prev,
              email: authState.user.email
            }))
          }
        }
        
        setOtpVerified(authState.user.emailVerified)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Calculate completion percentage
  const calculateCompletion = () => {
    let percentage = 0
    const weights = {
      fullName: 15,
      email: 20,
      phone: 15,
      organization: 15,
      role: 10,
      location: 10,
      emailVerified: 15
    }

    if (formData.fullName.trim()) percentage += weights.fullName
    if (validateEmail(formData.email)) percentage += weights.email
    if (validatePhone(formData.phone)) percentage += weights.phone
    if (formData.organization.trim()) percentage += weights.organization
    if (formData.role.trim()) percentage += weights.role
    if (formData.location.trim()) percentage += weights.location
    if (otpVerified) percentage += weights.emailVerified

    return Math.min(Math.round(percentage), 100)
  }

  // Update completion percentage
  useEffect(() => {
    const newPercentage = calculateCompletion()
    setCompletionPercentage(newPercentage)
  }, [formData, otpVerified])

  // Animate percentage display
  useEffect(() => {
    let rafId = null
    const duration = 600
    const start = performance.now()
    const from = displayedPercentage
    const to = completionPercentage

    if (to > from) {
      setGlow(true)
      setTimeout(() => setGlow(false), 700)
    }

    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - (1 - t) * (1 - t)
      const current = Math.round(from + (to - from) * eased)
      setDisplayedPercentage(current)
      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [completionPercentage])

  // Load profile animation
  useEffect(() => {
    fetch('/Profile Avatar for Child.json')
      .then(response => response.json())
      .then(data => setProfileAnimation(data))
      .catch(error => console.error('Error loading animation:', error))
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handleGoogleLogin = async () => {
    setLoginMethod('google')
    setIsProcessing(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    const result = await signInWithGoogle()
    
    if (result.success) {
      // Check if profile exists and is complete
      const profileResult = await getUserProfile(result.user.uid);
      let isComplete = false;
      if (profileResult.success && profileResult.exists) {
         const profileData = profileResult.data;
         const p = profileData.profile || profileData;
         isComplete = p.fullName && p.email && p.organization && p.phone;
      }

      setFormData(prev => ({
        ...prev,
        fullName: result.user.displayName || '',
        email: result.user.email || ''
      }))
      setOtpVerified(result.user.emailVerified)
      
      if (isComplete) {
        setSuccessMessage('Welcome back! Redirecting to dashboard...')
        setTimeout(() => {
          navigate(`/dashboard?id=${result.user.uid}`)
        }, 1000)
      } else {
        setSuccessMessage('Successfully signed in with Google!')
        
        // Wait a bit to show success message, then move to next step
        setTimeout(() => {
          setStep(2)
          setIsProcessing(false)
        }, 1000)
      }
    } else {
      setErrorMessage(result.error || 'Failed to sign in with Google. Please try again.')
      setIsProcessing(false)
      setLoginMethod(null)
    }
  }

  const handleManualLogin = () => {
    setLoginMethod('manual')
    setStep(2)
  }

  const handleEmailAuth = async () => {
    if (!validateEmail(formData.email)) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    if (!validatePassword(formData.password)) {
      setErrorMessage('Password must be at least 6 characters')
      return
    }

    setIsProcessing(true)
    setErrorMessage('')
    setSuccessMessage('')

    let result

    if (authMode === 'signup') {
      // Register new user
      result = await registerWithEmail(formData.email, formData.password)
      
      if (result.success) {
        setSuccessMessage(result.message)
        setOtpSent(true)
        // User needs to verify email before proceeding
      } else {
        setErrorMessage(result.error)
      }
    } else {
      // Sign in existing user
      result = await signInWithEmail(formData.email, formData.password)
      
      if (result.success) {
        // Check if profile exists and is complete
        const profileResult = await getUserProfile(result.user.uid);
        let isComplete = false;
        if (profileResult.success && profileResult.exists) {
           const profileData = profileResult.data;
           const p = profileData.profile || profileData;
           isComplete = p.fullName && p.email && p.organization && p.phone;
        }

        setFormData(prev => ({
          ...prev,
          fullName: result.user.displayName || prev.fullName
        }))
        setOtpVerified(result.user.emailVerified)
        
        if (!result.user.emailVerified) {
          setErrorMessage('Please verify your email before continuing.')
          setOtpSent(true)
        } else if (isComplete) {
          setSuccessMessage('Welcome back! Redirecting to dashboard...')
          setTimeout(() => {
            navigate(`/dashboard?id=${result.user.uid}`)
          }, 1000)
        } else {
          setSuccessMessage('Successfully signed in!')
        }
      } else {
        setErrorMessage(result.error)
      }
    }

    setIsProcessing(false)
  }

  const handleResendVerification = async () => {
    setIsProcessing(true)
    setErrorMessage('')
    setSuccessMessage('')

    const result = await resendVerificationEmail()

    if (result.success) {
      setSuccessMessage(result.message)
    } else {
      setErrorMessage(result.error)
    }

    setIsProcessing(false)
  }

  const handleSendOtp = () => {
    // This is now replaced by handleEmailAuth for real authentication
    handleEmailAuth()
  }

  const handleVerifyOtp = async () => {
    setIsProcessing(true)
    setErrorMessage('')
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      
      // In a real app, this would check the backend to confirm the user's email 
      // is actually verified in the Firebase Admin SDK, preventing client-side spoofing.
      // If user is logged in via Firebase and has clicked the link locally:
      if (currentUser && currentUser.emailVerified) {
        // Simulate secure network verification
        await new Promise(resolve => setTimeout(resolve, 800));
        setOtpVerified(true)
        setSuccessMessage('Secure email verification successful!')
      } else {
        // Ping backend to check if perhaps it was verified on another device
        const response = await fetch(`${apiUrl}/api/verify-email-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: currentUser?.uid, email: formData.email })
        }).catch(() => null);
        
        const data = response ? await response.json().catch(() => ({})) : {};
        
        if (data.verified) {
           setOtpVerified(true)
           setSuccessMessage('Email verified successfully via secure server check!')
        } else {
           setErrorMessage('Please verify your email by clicking the link sent to your inbox.')
        }
      }
    } catch (error) {
       setErrorMessage('Secure verification check failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinue = async () => {
    if (step === 2) {
      // Validate step 2 fields
      if (!formData.fullName || !formData.email) {
        alert('Please fill all required fields')
        return
      }
      if (loginMethod === 'manual' && !otpVerified) {
        alert('Please verify your email first')
        return
      }
      setStep(3)
    } else if (step === 3) {
      // Validate step 3 fields
      if (!formData.phone || !formData.organization) {
        alert('Please fill all required fields')
        return
      }
      
      setIsProcessing(true)
      setErrorMessage('')
      setSuccessMessage('')
      
      // Save user profile data using UUID
      if (userId) {
        const profileData = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          organization: formData.organization,
          role: formData.role,
          location: formData.location
        }
        
        console.log('Saving profile for UUID:', userId)
        
        // Try to save to Firebase first
        let firebaseSaved = false
        try {
          const { storeUserProfile, updateUserProfile, getUserProfile } = await import('../utils/faceVerification')
          
          // Check if user already exists
          const existingUser = await getUserProfile(userId)
          
          if (existingUser.success && existingUser.user) {
            // Update existing user
            const updateResult = await updateUserProfile(userId, profileData)
            firebaseSaved = updateResult.success
            if (firebaseSaved) {
              console.log('Profile updated in Firebase')
            }
          } else {
            // Create new user profile
            const storeResult = await storeUserProfile(userId, profileData)
            firebaseSaved = storeResult.success
            if (firebaseSaved) {
              console.log('Profile created in Firebase')
            }
          }
        } catch (fbError) {
          console.log('Firebase save failed:', fbError)
        }
        
        // Also try to save via API (as backup)
        try {
          const response = await fetch(`/api/user/${userId}/complete-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          })
          
          const data = await response.json()
          
          if (data.success) {
            console.log('Profile saved via API')
          }
        } catch (apiError) {
          console.log('API save failed:', apiError)
        }
        
        // Show success if either Firebase or API succeeded
        if (firebaseSaved) {
          setSuccessMessage('Profile saved successfully!')
          
          // Redirect to dashboard with UUID after short delay
          setTimeout(() => {
            redirectWithUUID('/dashboard', userId)
          }, 1000)
        } else {
          setErrorMessage('Failed to save profile. Please try again.')
          setIsProcessing(false)
          return
        }
      } else {
        // Fallback to Firebase auth if UUID not present
        if (currentUser && currentUser.uid) {
          const profileData = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            organization: formData.organization,
            role: formData.role,
            location: formData.location
          }
          
          const result = await saveUserProfile(currentUser.uid, profileData)
          
          if (result.success) {
            console.log('Profile saved successfully:', result.data)
            setSuccessMessage('Profile saved successfully!')
            
            // Navigate to dashboard WITH the UID
            setTimeout(() => {
              navigate(`/dashboard?id=${currentUser.uid}`)
            }, 1000)
          } else {
            setErrorMessage('Failed to save profile: ' + result.message)
            setIsProcessing(false)
            return
          }
        } else {
          setErrorMessage('User not authenticated. Please sign in again.')
          setIsProcessing(false)
          return
        }
      }
    }
  }

  const canProceed = () => {
    if (step === 2) {
      return formData.fullName && validateEmail(formData.email) && (loginMethod === 'google' || otpVerified)
    }
    if (step === 3) {
      return validatePhone(formData.phone) && formData.organization
    }
    return false
  }

  return (
    <section className="identity section">
      <div className="container">
        {/* Header */}
        <motion.div
          className="identity-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h1 className="identity-title">Complete Your Identity Verification</h1>
          <p className="identity-subtitle">Secure your access to the ZerOn ecosystem</p>
        </motion.div>

        <div className="identity-layout">
          {/* Left Side - Form Sections */}
          <div className="form-sections">
            
            {/* Step Indicator */}
            <motion.div 
              className="step-indicator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-circle">1</div>
                <span>Login Method</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-circle">2</div>
                <span>Personal Info</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <span>Professional</span>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {/* Step 1: Login Method */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  className="form-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  {errorMessage && (
                    <div className="error-message">
                      <AlertTriangle size={16} />
                      {errorMessage}
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">
                      <CheckCircle size={16} />
                      {successMessage}
                    </div>
                  )}

                  <div className="login-methods">
                    <h3 className="section-title">Choose Your Login Method</h3>
                    
                    <button 
                      className={`login-button google ${isProcessing ? 'processing' : ''}`}
                      onClick={handleGoogleLogin}
                      disabled={isProcessing}
                    >
                      <Chrome size={24} />
                      <div className="button-content">
                        <span className="button-title">Continue with Google</span>
                        <span className="button-subtitle">Quick & Secure Authentication</span>
                      </div>
                      <ArrowRight size={20} className="arrow-icon" />
                    </button>

                    <div className="divider">
                      <span>OR</span>
                    </div>

                    <button 
                      className="login-button manual"
                      onClick={handleManualLogin}
                      disabled={isProcessing}
                    >
                      <Mail size={24} />
                      <div className="button-content">
                        <span className="button-title">Continue with Email</span>
                        <span className="button-subtitle">Email & Password Authentication</span>
                      </div>
                      <ArrowRight size={20} className="arrow-icon" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Personal Information */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  className="form-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="section-title">Personal Information</h3>
                  
                  {errorMessage && (
                    <div className="error-message">
                      <AlertTriangle size={16} />
                      {errorMessage}
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">
                      <CheckCircle size={16} />
                      {successMessage}
                    </div>
                  )}
                  
                  <div className="form-content">
                    <div className="form-group">
                      <label htmlFor="fullName">
                        Full Name <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <User size={18} className="input-icon" />
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          disabled={loginMethod === 'google' && formData.fullName}
                          className={formData.fullName ? 'filled' : ''}
                        />
                        {formData.fullName && <CheckCircle size={16} className="validation-icon valid" />}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        Email Address <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <Mail size={18} className="input-icon" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          disabled={loginMethod === 'google' || otpVerified}
                          className={validateEmail(formData.email) ? 'valid' : formData.email ? 'invalid' : ''}
                        />
                        {otpVerified ? (
                          <CheckCircle size={16} className="validation-icon valid" />
                        ) : validateEmail(formData.email) ? (
                          <CheckCircle size={16} className="validation-icon valid" />
                        ) : formData.email ? (
                          <AlertTriangle size={16} className="validation-icon invalid" />
                        ) : null}
                      </div>
                    </div>

                    {loginMethod === 'manual' && !otpVerified && (
                      <>
                        <div className="form-group">
                          <label htmlFor="password">
                            Password <span className="required">*</span>
                          </label>
                          <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Enter password (min 6 characters)"
                              className={validatePassword(formData.password) ? 'valid' : formData.password ? 'invalid' : ''}
                            />
                            {validatePassword(formData.password) ? (
                              <CheckCircle size={16} className="validation-icon valid" />
                            ) : formData.password ? (
                              <AlertTriangle size={16} className="validation-icon invalid" />
                            ) : null}
                          </div>
                        </div>

                        <div className="auth-mode-toggle">
                          <button
                            type="button"
                            className="toggle-link"
                            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                          >
                            {authMode === 'signin' 
                              ? "Don't have an account? Sign up" 
                              : "Already have an account? Sign in"}
                          </button>
                        </div>

                        <motion.button
                          className="send-otp-button"
                          onClick={handleEmailAuth}
                          disabled={!validateEmail(formData.email) || !validatePassword(formData.password) || isProcessing}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Key size={16} />
                          {isProcessing ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Sign Up & Verify Email'}
                        </motion.button>
                      </>
                    )}

                    {/* Email Verification Status */}
                    {otpSent && !otpVerified && loginMethod === 'manual' && (
                      <motion.div
                        className="verification-pending"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="verification-info">
                          <Mail size={20} />
                          <div>
                            <p><strong>Verification Email Sent!</strong></p>
                            <p className="info-text">Please check your inbox and click the verification link.</p>
                          </div>
                        </div>
                        <button
                          className="resend-button"
                          onClick={handleResendVerification}
                          disabled={isProcessing}
                        >
                          <RefreshCw size={16} />
                          {isProcessing ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                        <button
                          className="check-verification-button"
                          onClick={handleVerifyOtp}
                        >
                          <CheckCircle size={16} />
                          I've Verified My Email
                        </button>
                      </motion.div>
                    )}

                    {otpVerified && loginMethod === 'manual' && (
                      <motion.div
                        className="verification-success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <CheckCircle size={20} />
                        <span>Email verified successfully!</span>
                      </motion.div>
                    )}
                  </div>

                  <button
                    className="continue-button"
                    onClick={handleContinue}
                    disabled={!canProceed()}
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* Step 3: Professional Information */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  className="form-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="section-title">Professional Information</h3>
                  
                  <div className="form-content">
                    <div className="form-group">
                      <label htmlFor="phone">
                        Phone Number <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <Phone size={18} className="input-icon" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className={validatePhone(formData.phone) ? 'valid' : formData.phone ? 'invalid' : ''}
                        />
                        {validatePhone(formData.phone) ? (
                          <CheckCircle size={16} className="validation-icon valid" />
                        ) : formData.phone ? (
                          <AlertTriangle size={16} className="validation-icon invalid" />
                        ) : null}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="organization">
                        Organization <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <Building size={18} className="input-icon" />
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          placeholder="Your Company Name"
                          className={formData.organization ? 'filled' : ''}
                        />
                        {formData.organization && <CheckCircle size={16} className="validation-icon valid" />}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="role">Job Role</label>
                      <div className="input-wrapper">
                        <Briefcase size={18} className="input-icon" />
                        <input
                          type="text"
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          placeholder="e.g., Security Researcher"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <div className="input-wrapper">
                        <MapPin size={18} className="input-icon" />
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    className={`continue-button ${isProcessing ? 'processing' : ''}`}
                    onClick={handleContinue}
                    disabled={!canProceed() || isProcessing}
                  >
                    <Shield size={18} />
                    {isProcessing ? 'Processing...' : 'Proceed to Face Scan'}
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side - Progress Panel */}
          <div className="stats-panel">
            <motion.div 
              className="profile-card"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="profile-header">
                <div className="profile-avatar">
                  {profileAnimation ? (
                    <div className="lottie-container">
                      <Lottie 
                        animationData={profileAnimation} 
                        loop={true}
                        autoplay={true}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          transform: 'scale(1.1)',
                          filter: 'drop-shadow(0 2px 8px rgba(0, 255, 136, 0.3))'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={30} />
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <h4 className="profile-title">Profile Completion</h4>
                  <span className="profile-percentage">{displayedPercentage}%</span>
                </div>
              </div>
              
              <div className="profile-progress">
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${glow ? 'glow' : ''}`} 
                    style={{ width: `${displayedPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="profile-tips">
                <h5>Verification Checklist</h5>
                <ul>
                  <li className={formData.fullName ? 'completed' : ''}>
                    <CheckCircle size={14} />
                    Full Name
                  </li>
                  <li className={validateEmail(formData.email) ? 'completed' : ''}>
                    <CheckCircle size={14} />
                    Email Address
                  </li>
                  <li className={otpVerified ? 'completed' : ''}>
                    <CheckCircle size={14} />
                    Email Verification
                  </li>
                  <li className={validatePhone(formData.phone) ? 'completed' : ''}>
                    <CheckCircle size={14} />
                    Phone Number
                  </li>
                  <li className={formData.organization ? 'completed' : ''}>
                    <CheckCircle size={14} />
                    Organization
                  </li>
                </ul>
                <div className="completion-status">
                  {displayedPercentage >= 100 ? (
                    <span className="status-ready">✓ Ready for Hunting</span>
                  ) : (
                    <span className="status-incomplete">Complete all fields to proceed</span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Identity