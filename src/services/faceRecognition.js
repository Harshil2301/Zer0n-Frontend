/**
 * Face Recognition Service
 * Handles face scanning, matching, and user identification
 */

import { generateUserId, redirectWithUUID } from '../utils/uuid'

/**
 * Scan face and check if user exists with complete data
 * @param {string} faceData - Base64 encoded face image
 * @returns {Promise<{exists: boolean, userId: string|null, hasCompleteData: boolean, confidence: number}>}
 */
export const scanFace = async (faceData) => {
  try {
    // TODO: Replace with actual face recognition API
    const response = await fetch('/api/face-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceData })
    })

    const data = await response.json()
    
    return {
      exists: data.exists || false,
      userId: data.userId || null,
      hasCompleteData: data.hasCompleteData || false, // Check if identity data is complete
      confidence: data.confidence || 0,
      faceId: data.faceId || null
    }
  } catch (error) {
    console.error('Face scan error (API not available):', error)
    // Return mock data for development - treat as NEW USER
    console.log('⚠️ API not available - treating as NEW USER for development')
    return {
      exists: false,
      userId: null,
      hasCompleteData: false,
      confidence: 0,
      faceId: null
    }
  }
}

/**
 * Process face scan and redirect user accordingly
 * @param {string} faceData - Base64 encoded face image
 * @returns {Promise<void>}
 */
export const processFaceScanAndRedirect = async (faceData) => {
  try {
    // Step 1: Scan face and check if it exists in database
    const scanResult = await scanFace(faceData)
    
    if (!scanResult.exists || !scanResult.userId) {
      // NEW USER - Face not found in database
      console.log('New user detected - creating new account')
      
      // Generate new UUID for the user
      const newUserId = generateUserId()
      
      // Store face signature in database
      const faceRegistration = await registerFace(faceData, newUserId)
      
      if (!faceRegistration.success) {
        throw new Error('Failed to register face signature')
      }
      
      // Create basic user document in database with UUID
      await createBasicUserDocument(newUserId, faceRegistration.faceId)
      
      // Redirect to identity page to fill profile data
      console.log('Redirecting to identity page:', newUserId)
      redirectWithUUID('/identity', newUserId)
      return
    }
    
    // EXISTING USER - Face found, now check if data is complete
    console.log('Existing user found:', scanResult.userId)
    
    // Step 2: Check if user has complete data in their UUID document
    const hasCompleteData = await checkUserDataComplete(scanResult.userId)
    
    if (!hasCompleteData) {
      // User exists but data is incomplete
      console.log('User data incomplete - redirecting to identity page')
      
      // Redirect to identity page to complete profile
      redirectWithUUID('/identity', scanResult.userId)
      return
    }
    
    // Step 3: User has complete data - create session and redirect to dashboard
    console.log('User data complete - creating session')
    
    // Create new session for the user
    const session = await createUserSession(scanResult.userId)
    
    if (!session.success) {
      throw new Error('Failed to create user session')
    }
    
    // Redirect to dashboard with user's UUID
    console.log('Redirecting to dashboard:', scanResult.userId)
    redirectWithUUID('/dashboard', scanResult.userId)
    
  } catch (error) {
    console.error('Face scan processing error:', error)
    throw error
  }
}

/**
 * Create basic user document in database
 * @param {string} userId - User UUID
 * @param {string} faceId - Face signature ID
 * @returns {Promise<{success: boolean}>}
 */
const createBasicUserDocument = async (userId, faceId) => {
  try {
    const response = await fetch('/api/user/create-basic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId,
        faceId,
        createdAt: new Date().toISOString(),
        profile: {}, // Empty profile - to be filled in identity page
        account: {
          plan: 'basic',
          credits: 0,
          status: 'pending', // Pending until identity is completed
          createdAt: new Date().toISOString()
        }
      })
    })
    
    const data = await response.json()
    return { success: data.success || false }
  } catch (error) {
    console.error('Create basic user error (API not available):', error)
    // Mock success for development
    console.log('⚠️ API not available - mocking successful user creation')
    return { success: true }
  }
}

/**
 * Check if user data is complete in UUID document
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>}
 */
const checkUserDataComplete = async (userId) => {
  try {
    const response = await fetch(`/api/user/${userId}/check-complete`)
    const data = await response.json()
    
    // Check if all required fields are present
    const isComplete = data.user && 
      data.user.profile &&
      data.user.profile.fullName &&
      data.user.profile.email &&
      data.user.profile.organization &&
      data.user.profile.role
    
    return isComplete || false
  } catch (error) {
    console.error('Check user data error (API not available):', error)
    // Mock incomplete for development - force to identity page
    console.log('⚠️ API not available - treating data as incomplete')
    return false
  }
}

/**
 * Create user session after successful face recognition
 * @param {string} userId - User UUID
 * @returns {Promise<{success: boolean, sessionId: string}>}
 */
export const createUserSession = async (userId) => {
  try {
    const response = await fetch('/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId,
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent
      })
    })

    const data = await response.json()
    
    if (data.success) {
      // Store session in localStorage
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('userId', userId)
    }
    
    return {
      success: data.success || false,
      sessionId: data.sessionId || null
    }
  } catch (error) {
    console.error('Session creation error:', error)
    return {
      success: false,
      sessionId: null
    }
  }
}

/**
 * Get user IP address
 * @returns {Promise<string>}
 */
const getUserIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Register new face signature for user
 * @param {string} faceData - Base64 encoded face image
 * @param {string} userId - User UUID
 * @returns {Promise<{success: boolean, faceId: string}>}
 */
export const registerFace = async (faceData, userId) => {
  try {
    const response = await fetch('/api/face-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceData, userId })
    })

    const data = await response.json()
    
    return {
      success: data.success || false,
      faceId: data.faceId || null
    }
  } catch (error) {
    console.error('Face registration error (API not available):', error)
    // Mock success for development
    console.log('⚠️ API not available - mocking successful face registration')
    return {
      success: true,
      faceId: 'mock-face-id-' + Math.random().toString(36).substr(2, 9)
    }
  }
}

/**
 * Capture face from video stream
 * @param {HTMLVideoElement} videoElement - Video element from camera
 * @returns {Promise<string>} Base64 encoded image
 */
export const captureFace = async (videoElement) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    
    const faceData = canvas.toDataURL('image/jpeg', 0.9)
    resolve(faceData)
  })
}

/**
 * Initialize camera for face scanning
 * @returns {Promise<MediaStream>}
 */
export const initializeCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    })
    return stream
  } catch (error) {
    console.error('Camera initialization error:', error)
    throw new Error('Unable to access camera')
  }
}
