import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  Trash2,
  CheckCheck
} from 'lucide-react'
import './NotificationPanel.css'

const NotificationPanel = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Profile Completed',
      message: 'Your profile has been successfully verified and activated.',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Welcome to ZerOn',
      message: 'Thank you for joining ZerOn security platform. Start scanning now!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Security Update',
      message: 'New security features are available. Update your preferences.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <Check size={18} />
      case 'warning':
        return <AlertTriangle size={18} />
      case 'info':
        return <Info size={18} />
      default:
        return <Bell size={18} />
    }
  }

  const getTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="notification-panel"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="notification-header">
              <div className="header-title">
                <Bell size={20} />
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="notification-actions">
                <button 
                  className="action-btn"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
                <button className="action-btn danger" onClick={clearAll}>
                  <Trash2 size={16} />
                  Clear all
                </button>
              </div>
            )}

            {/* List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={48} />
                  <p>No notifications</p>
                  <span>You're all caught up!</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    className={`notification-item ${notification.type} ${notification.read ? 'read' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    layout
                  >
                    <div className="notification-icon">
                      {getIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{getTimeAgo(notification.timestamp)}</div>
                    </div>
                    <div className="notification-controls">
                      {!notification.read && (
                        <button
                          className="control-btn"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        className="control-btn delete"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationPanel
