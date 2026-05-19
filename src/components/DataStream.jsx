import React from 'react'
import { motion } from 'framer-motion'
import './DataStream.css'

const DataStream = ({ direction = 'vertical', density = 20, className = "" }) => {
  const generateStreams = () => {
    const streams = []
    const characters = '01ABCDEF></*[]{}()!@#$%^&*+-=|\\:;.,?'
    
    for (let i = 0; i < density; i++) {
      const stream = []
      const streamLength = Math.random() * 20 + 10
      
      for (let j = 0; j < streamLength; j++) {
        stream.push(characters[Math.floor(Math.random() * characters.length)])
      }
      
      streams.push({
        id: i,
        data: stream,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 8,
        position: Math.random() * 100
      })
    }
    
    return streams
  }

  const streams = generateStreams()

  return (
    <div className={`data-stream ${direction} ${className}`}>
      {streams.map((stream) => (
        <motion.div
          key={stream.id}
          className="stream"
          style={{
            [direction === 'vertical' ? 'left' : 'top']: `${stream.position}%`
          }}
          initial={{
            [direction === 'vertical' ? 'y' : 'x']: '-100px',
            opacity: 0
          }}
          animate={{
            [direction === 'vertical' ? 'y' : 'x']: 
              direction === 'vertical' ? 'calc(100vh + 100px)' : 'calc(100vw + 100px)',
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: stream.duration,
            delay: stream.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {stream.data.map((char, index) => (
            <motion.span
              key={index}
              className="stream-char"
              style={{
                opacity: 1 - (index / stream.data.length) * 0.8
              }}
              animate={{
                color: [
                  '#00ff41',
                  '#ffffff',
                  '#00d4ff',
                  '#ff0080',
                  '#00ff41'
                ]
              }}
              transition={{
                duration: 2,
                delay: index * 0.1,
                repeat: Infinity
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

export default DataStream