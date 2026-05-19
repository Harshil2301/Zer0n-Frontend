import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LoadingScreen.css'

const LoadingScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => {
            setIsComplete(true)
            setTimeout(() => onLoadingComplete(), 500)
          }, 500)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)

    return () => clearInterval(timer)
  }, [onLoadingComplete])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="loading-content">
            <motion.div
              className="loading-logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="logo-icon">⚡</div>
              <h2>ZerOn Cyber Defense System</h2>
            </motion.div>
            
            <div className="loading-bar-container">
              <div className="loading-bar">
                <motion.div
                  className="loading-fill"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <motion.span 
                className="loading-percentage"
                key={Math.floor(progress)}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
              >
                {Math.floor(progress)}%
              </motion.span>
            </div>
            
            <motion.p
              className="loading-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Initializing secure protocols...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoadingScreen
