import React from 'react'
import { motion } from 'framer-motion'
import './GlitchText.css'

const GlitchText = ({ children, className = "", intensity = 'medium' }) => {
  return (
    <div className={`glitch-container ${intensity} ${className}`}>
      <motion.div 
        className="glitch-text"
        animate={{
          textShadow: [
            '2px 0 #ff0080, -2px 0 #00d4ff',
            '3px 0 #ff0080, -3px 0 #00d4ff',
            '1px 0 #ff0080, -1px 0 #00d4ff',
            '2px 0 #ff0080, -2px 0 #00d4ff'
          ]
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatType: 'mirror'
        }}
      >
        {children}
      </motion.div>
      <div className="glitch-text glitch-layer" data-text={children}>
        {children}
      </div>
      <div className="glitch-text glitch-layer glitch-layer-2" data-text={children}>
        {children}
      </div>
    </div>
  )
}

export default GlitchText