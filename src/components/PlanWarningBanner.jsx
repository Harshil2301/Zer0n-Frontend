import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Sparkles, ArrowRight, RefreshCw, Shield, Zap, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './PlanWarningBanner.css'

const planIcons = { basic: Shield, pro: Zap, premium: Crown }
const planColors = { basic: '#00ff88', pro: '#00d4ff', premium: '#a855f7' }

const PlanWarningBanner = ({ userId, hasPlan, currentPlan }) => {
  const navigate = useNavigate()

  const handleSelectPlan = () => {
    navigate(`/plan-selection?id=${userId}`)
  }

  if (hasPlan && currentPlan) {
    const PlanIcon = planIcons[currentPlan.type] || Shield
    const planColor = planColors[currentPlan.type] || '#00ff88'

    return (
      <motion.div
        className="plan-warning-banner plan-active-banner"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ borderColor: `${planColor}33`, background: `linear-gradient(135deg, ${planColor}08, transparent)` }}
      >
        <div className="banner-content">
          <div className="banner-left">
            <div className="banner-icon" style={{ background: `${planColor}15`, border: `1px solid ${planColor}33`, color: planColor }}>
              <PlanIcon size={16} />
            </div>
            <div className="banner-text">
              <h4 className="banner-title" style={{ color: '#ccc' }}>
                Active Plan: <span style={{ color: planColor }}>{currentPlan.name || currentPlan.type?.toUpperCase()}</span>
                &nbsp;·&nbsp;
                <span style={{ color: '#666', fontWeight: 400, fontSize: '0.75rem' }}>
                  {currentPlan.domains} domain{currentPlan.domains > 1 ? 's' : ''}
                </span>
              </h4>
              <p className="banner-description">
                Want more domains or features? Upgrade or change your plan anytime.
              </p>
            </div>
          </div>
          <motion.button
            className="banner-action-btn banner-change-btn"
            onClick={handleSelectPlan}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ borderColor: `${planColor}44`, color: planColor }}
          >
            <RefreshCw size={14} />
            <span>Change Plan</span>
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // No plan selected yet
  return (
    <motion.div
      className="plan-warning-banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="banner-content">
        <div className="banner-left">
          <div className="banner-icon">
            <AlertCircle size={20} />
          </div>
          <div className="banner-text">
            <h4 className="banner-title">Choose Your Plan to Get Started</h4>
            <p className="banner-description">
              Select a plan to unlock domain scanning and vulnerability assessment features
            </p>
          </div>
        </div>
        <motion.button
          className="banner-action-btn"
          onClick={handleSelectPlan}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles size={16} />
          <span>Select Plan</span>
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default PlanWarningBanner
