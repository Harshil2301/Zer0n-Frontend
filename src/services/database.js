/**
 * Database Service
 * Handles all database operations for users, scans, and transactions
 */

const DB_CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api'
}

/**
 * Create new user in database
 * @param {object} userData - User data object
 * @returns {Promise<{success: boolean, userId: string}>}
 */
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return await response.json()
  } catch (error) {
    console.error('Create user error:', error)
    return { success: false, userId: null }
  }
}

/**
 * Create basic user document with UUID (called after face scan for new users)
 * @param {string} userId - User UUID
 * @param {string} faceId - Face signature ID
 * @returns {Promise<{success: boolean}>}
 */
export const createBasicUser = async (userId, faceId) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/user/create-basic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        faceId,
        createdAt: new Date().toISOString(),
        profile: {}, // Empty - to be filled in identity page
        account: {
          plan: 'basic',
          credits: 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        scans: [],
        transactions: []
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Create basic user error:', error)
    return { success: false }
  }
}

/**
 * Complete user profile (called from identity page)
 * @param {string} userId - User UUID
 * @param {object} profileData - Profile information
 * @returns {Promise<{success: boolean}>}
 */
export const completeUserProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/user/${userId}/complete-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: profileData,
        account: {
          status: 'active', // Activate account after profile completion
          completedAt: new Date().toISOString()
        }
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Complete profile error:', error)
    return { success: false }
  }
}

/**
 * Check if user has complete identity data
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>}
 */
export const hasCompleteIdentityData = async (userId) => {
  try {
    const user = await getUserById(userId)
    
    if (!user || !user.profile) return false
    
    // Check if all required identity fields are present
    const requiredFields = ['fullName', 'email', 'organization', 'role']
    
    return requiredFields.every(field => {
      const value = user.profile[field]
      return value && value.trim() !== ''
    })
  } catch (error) {
    console.error('Check complete data error:', error)
    return false
  }
}

/**
 * Get user by ID
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>}
 */
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/user/${userId}`)
    const data = await response.json()
    return data.success ? data.user : null
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {object} updates - Data to update
 * @returns {Promise<boolean>}
 */
export const updateUser = async (userId, updates) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
    const data = await response.json()
    return data.success || false
  } catch (error) {
    console.error('Update user error:', error)
    return false
  }
}

/**
 * Save scan results
 * @param {string} userId - User UUID
 * @param {object} scanData - Scan results
 * @returns {Promise<{success: boolean, scanId: string}>}
 */
export const saveScanResults = async (userId, scanData) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/scan/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...scanData })
    })
    return await response.json()
  } catch (error) {
    console.error('Save scan error:', error)
    return { success: false, scanId: null }
  }
}

/**
 * Get scan history for user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>}
 */
export const getScanHistory = async (userId) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/scan/history/${userId}`)
    const data = await response.json()
    return data.success ? data.scans : []
  } catch (error) {
    console.error('Get scan history error:', error)
    return []
  }
}

/**
 * Create transaction
 * @param {string} userId - User UUID
 * @param {object} transactionData - Transaction details
 * @returns {Promise<{success: boolean, transactionId: string}>}
 */
export const createTransaction = async (userId, transactionData) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/transaction/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...transactionData })
    })
    return await response.json()
  } catch (error) {
    console.error('Create transaction error:', error)
    return { success: false, transactionId: null }
  }
}

/**
 * Get transaction history
 * @param {string} userId - User UUID
 * @returns {Promise<Array>}
 */
export const getTransactionHistory = async (userId) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/transaction/history/${userId}`)
    const data = await response.json()
    return data.success ? data.transactions : []
  } catch (error) {
    console.error('Get transaction history error:', error)
    return []
  }
}

/**
 * Create user session
 * @param {string} userId - User UUID
 * @param {object} sessionData - Session information
 * @returns {Promise<{success: boolean, sessionId: string}>}
 */
export const createSession = async (userId, sessionData) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...sessionData })
    })
    return await response.json()
  } catch (error) {
    console.error('Create session error:', error)
    return { success: false, sessionId: null }
  }
}

/**
 * Validate user session
 * @param {string} sessionId - Session ID
 * @returns {Promise<{valid: boolean, userId: string|null}>}
 */
export const validateSession = async (sessionId) => {
  try {
    const response = await fetch(`${DB_CONFIG.apiUrl}/session/validate/${sessionId}`)
    const data = await response.json()
    return {
      valid: data.valid || false,
      userId: data.userId || null
    }
  } catch (error) {
    console.error('Validate session error:', error)
    return { valid: false, userId: null }
  }
}
