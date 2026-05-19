import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings,
  LogOut
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ProfileModal.css'

const ProfileModal = ({ isOpen, onClose, userData, userId }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleManageAccount = () => {
    onClose()
    // Navigate to dashboard settings tab
    const currentUrl = new URL(window.location.href)
    const searchParams = new URLSearchParams(currentUrl.search)
    navigate(`/dashboard?id=${userId}&tab=settings`)
    
    // Trigger settings tab activation after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openSettings'))
    }, 100)
  }

  const handleSignOut = () => {
    localStorage.removeItem('sessionId')
    localStorage.removeItem('userId')
    onClose()
    navigate('/face-scan')
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="profile-modal-backdrop-dash"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="profile-modal-dash"
          >
            <div className="profile-header-dash">
              <div className="profile-avatar-dash">
                {getInitials(userData?.profile?.fullName || userData?.fullName)}
              </div>
              <div className="profile-info-dash">
                <h3>{userData?.profile?.fullName || userData?.fullName || 'User'}</h3>
                <p>{userData?.profile?.email || userData?.email || 'No email provided'}</p>
              </div>
            </div>

            <div className="profile-actions-dash">
              <button className="profile-action-btn-dash" onClick={handleManageAccount}>
                <Settings size={20} />
                <span>Manage account</span>
              </button>
              
              <button className="profile-action-btn-dash" onClick={handleSignOut}>
                <LogOut size={20} />
                <span>Sign out</span>
              </button>
            </div>

            <div className="profile-footer-dash">
              Development mode
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ProfileModal
