import React, { createContext, useContext, useState, useEffect } from 'react'
import { getUUIDFromURL } from '../utils/uuid'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load user data on mount if UUID exists in URL
  useEffect(() => {
    const loadUser = async () => {
      const userId = getUUIDFromURL()
      
      if (userId) {
        try {
          setLoading(true)
          // TODO: Replace with actual API call
          const response = await fetch(`/api/user/${userId}`)
          const userData = await response.json()
          
          if (userData.success) {
            setUser(userData.user)
          } else {
            setError('User not found')
          }
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Create new user
  const createUser = async (faceId, profileData) => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceId, profile: profileData })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        return data.userId
      } else {
        throw new Error(data.message)
      }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update user profile
  const updateUser = async (userId, updates) => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const response = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser({ ...user, ...updates })
        return true
      }
      return false
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get user by ID
  const getUserById = async (userId) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/user/${userId}`)
      const data = await response.json()
      return data.success ? data.user : null
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const value = {
    user,
    loading,
    error,
    createUser,
    updateUser,
    getUserById,
    setUser
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
