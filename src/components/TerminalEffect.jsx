import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './TerminalEffect.css'

const TerminalEffect = ({ commands, className = "", onComplete }) => {
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [displayedLines, setDisplayedLines] = useState([''])

  useEffect(() => {
    if (currentLine < commands.length) {
      const currentCommand = commands[currentLine]
      
      if (currentChar < currentCommand.length) {
        const timer = setTimeout(() => {
          setDisplayedLines(prev => {
            const newLines = [...prev]
            newLines[currentLine] = currentCommand.slice(0, currentChar + 1)
            return newLines
          })
          setCurrentChar(prev => prev + 1)
        }, Math.random() * 100 + 50) // Random typing speed
        
        return () => clearTimeout(timer)
      } else {
        // Line completed, move to next after pause
        setTimeout(() => {
          setCurrentLine(prev => prev + 1)
          setCurrentChar(0)
          setDisplayedLines(prev => [...prev, ''])
        }, 800)
      }
    } else if (onComplete) {
      onComplete()
    }
  }, [currentLine, currentChar, commands, onComplete])

  return (
    <div className={`terminal-effect ${className}`}>
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="terminal-button close"></span>
          <span className="terminal-button minimize"></span>
          <span className="terminal-button maximize"></span>
        </div>
        <div className="terminal-title">ZerOn Security Scanner</div>
      </div>
      <div className="terminal-body">
        {displayedLines.map((line, index) => (
          <motion.div
            key={index}
            className="terminal-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            <span className="terminal-prompt">$</span>
            <span className="terminal-text">{line}</span>
            {index === currentLine && (
              <span className="terminal-cursor">|</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default TerminalEffect