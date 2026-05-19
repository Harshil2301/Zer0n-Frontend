import React, { useMemo } from 'react'

// Cyber symbols that fall vertically — same as the landing page aesthetic
const SYMBOLS = ['0', '1', '{', '}', '<', '>', '/', '\\', '#', '$', '%', '&', '~', '^', '|', ';', ':', '!', '@', '*']

const CyberBackground = ({ count = 20 }) => {
  const columns = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const symbol = SYMBOLS[i % SYMBOLS.length]
      const left = (i / count) * 100
      const duration = 8 + (i % 7) * 2   // 8s – 20s
      const delay = -(i * (14 / count))   // stagger so they don't all start at once
      const opacity = 0.06 + (i % 4) * 0.03
      return { symbol, left, duration, delay, opacity }
    })
  }, [count])

  return (
    <div className="cyber-symbols" aria-hidden="true">
      {columns.map((col, i) => (
        <span
          key={i}
          style={{
            left: `${col.left}%`,
            animationDuration: `${col.duration}s`,
            animationDelay: `${col.delay}s`,
            opacity: col.opacity,
          }}
        >
          {col.symbol}
        </span>
      ))}
    </div>
  )
}

export default CyberBackground
