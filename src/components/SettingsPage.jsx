import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Palette,
  Moon,
  Sun,
  Globe,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Save,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import './SettingsPage.css'

const SettingsPage = ({ userData, userId, onSave }) => {
  const [activeSection, setActiveSection] = useState('profile')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    location: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    scanAlerts: true,
    securityUpdates: true,
    weeklyReport: false
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('zeron_theme') || 'dark')
  const { language, setLanguage, t } = useLanguage()
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (userData) {
      const profile = userData.profile || userData;
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        organization: profile.organization || '',
        role: profile.role || '',
        location: profile.location || ''
      })
    }
  }, [userData])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const { updateUserProfile } = await import('../utils/faceVerification')
      const result = await updateUserProfile(userId, formData)

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
        if (onSave) onSave(formData)
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveMessage({ type: 'error', text: 'An error occurred while saving' })
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const handleSavePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setSaveMessage({ type: 'success', text: 'Password updated successfully!' })
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleSaveNotifications = () => {
    setSaveMessage({ type: 'success', text: 'Notification preferences saved!' })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const sections = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette }
  ]

  return (
    <div className="settings-page-dash">
      {saveMessage && (
        <motion.div
          className={`save-message-dash ${saveMessage.type}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {saveMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {saveMessage.text}
        </motion.div>
      )}

      <div className="settings-container-dash">
        {/* Sidebar */}
        <div className="settings-sidebar-dash">
          <div className="settings-sidebar-header-dash">
            <Shield size={24} />
            <h2>Settings</h2>
          </div>
          <nav className="settings-nav-dash">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  className={`settings-nav-item-dash ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={18} />
                  <span>{section.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="settings-content-dash">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <motion.div
              className="settings-section-dash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-header-settings-dash">
                <User size={24} />
                <div>
                  <h3>Profile Information</h3>
                  <p>Update your personal details</p>
                </div>
              </div>

              <div className="form-grid-dash">
                <div className="form-group-settings-dash">
                  <label>
                    <User size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Building size={16} />
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="Your Company Name"
                  />
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Briefcase size={16} />
                    Job Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="e.g., Security Researcher"
                  />
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <MapPin size={16} />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <button 
                className="save-btn-dash"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <motion.div
              className="settings-section-dash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-header-settings-dash">
                <Lock size={24} />
                <div>
                  <h3>Security Settings</h3>
                  <p>Manage your password and security preferences</p>
                </div>
              </div>

              <div className="form-grid-dash">
                <div className="form-group-settings-dash">
                  <label>
                    <Lock size={16} />
                    Current Password
                  </label>
                  <div className="password-input-wrapper-dash">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="toggle-password-dash"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Lock size={16} />
                    New Password
                  </label>
                  <div className="password-input-wrapper-dash">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="toggle-password-dash"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Lock size={16} />
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button className="save-btn-dash" onClick={handleSavePassword}>
                <Save size={18} />
                Update Password
              </button>
            </motion.div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <motion.div
              className="settings-section-dash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-header-settings-dash">
                <Bell size={24} />
                <div>
                  <h3>Notification Preferences</h3>
                  <p>Choose what updates you want to receive</p>
                </div>
              </div>

              <div className="notification-settings-dash">
                <div className="notification-item-settings-dash">
                  <div className="notification-info-dash">
                    <Mail size={20} />
                    <div>
                      <h4>Email Notifications</h4>
                      <p>Receive updates via email</p>
                    </div>
                  </div>
                  <label className="toggle-switch-dash">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                    />
                    <span className="toggle-slider-dash"></span>
                  </label>
                </div>

                <div className="notification-item-settings-dash">
                  <div className="notification-info-dash">
                    <Shield size={20} />
                    <div>
                      <h4>Scan Alerts</h4>
                      <p>Get notified about scan results</p>
                    </div>
                  </div>
                  <label className="toggle-switch-dash">
                    <input
                      type="checkbox"
                      checked={notifications.scanAlerts}
                      onChange={() => handleNotificationChange('scanAlerts')}
                    />
                    <span className="toggle-slider-dash"></span>
                  </label>
                </div>

                <div className="notification-item-settings-dash">
                  <div className="notification-info-dash">
                    <Lock size={20} />
                    <div>
                      <h4>Security Updates</h4>
                      <p>Important security announcements</p>
                    </div>
                  </div>
                  <label className="toggle-switch-dash">
                    <input
                      type="checkbox"
                      checked={notifications.securityUpdates}
                      onChange={() => handleNotificationChange('securityUpdates')}
                    />
                    <span className="toggle-slider-dash"></span>
                  </label>
                </div>

                <div className="notification-item-settings-dash">
                  <div className="notification-info-dash">
                    <Mail size={20} />
                    <div>
                      <h4>Weekly Report</h4>
                      <p>Summary of your activity</p>
                    </div>
                  </div>
                  <label className="toggle-switch-dash">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={() => handleNotificationChange('weeklyReport')}
                    />
                    <span className="toggle-slider-dash"></span>
                  </label>
                </div>
              </div>

              <button className="save-btn-dash" onClick={handleSaveNotifications}>
                <Save size={18} />
                Save Preferences
              </button>
            </motion.div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <motion.div
              className="settings-section-dash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-header-settings-dash">
                <Palette size={24} />
                <div>
                  <h3>Appearance</h3>
                  <p>Customize the look and feel</p>
                </div>
              </div>

              <div className="appearance-settings-dash">
                <div className="form-group-settings-dash">
                  <label>
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    {t('theme')}
                  </label>
                  <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="dark">{t('darkMode')}</option>
                    <option value="light">{t('lightMode')}</option>
                    <option value="auto">{t('autoSystem')}</option>
                  </select>
                </div>

                <div className="form-group-settings-dash">
                  <label>
                    <Globe size={16} />
                    {t('language')}
                  </label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>

              <button className="save-btn-dash" onClick={() => {
                localStorage.setItem('zeron_theme', theme)
                document.body.setAttribute('data-theme', theme)
                setSaveMessage({ type: 'success', text: t('saveAppearance') + '!' })
                setTimeout(() => setSaveMessage(null), 3000)
              }}>
                <Save size={18} />
                {t('saveAppearance')}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
