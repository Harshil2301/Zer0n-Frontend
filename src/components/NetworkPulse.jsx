import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './NetworkPulse.css'

const NetworkPulse = ({ nodeCount = 8, className = "" }) => {
  const [connections, setConnections] = useState([])
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    // Generate nodes in a circle
    const newNodes = Array.from({ length: nodeCount }, (_, i) => {
      const angle = (i / nodeCount) * 2 * Math.PI
      const radius = 120
      return {
        id: i,
        x: Math.cos(angle) * radius + 150,
        y: Math.sin(angle) * radius + 150,
        active: false
      }
    })

    // Generate connections between nodes
    const newConnections = []
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (Math.random() > 0.6) {
          newConnections.push({
            id: `${i}-${j}`,
            from: newNodes[i],
            to: newNodes[j],
            active: false
          })
        }
      }
    }

    setNodes(newNodes)
    setConnections(newConnections)
  }, [nodeCount])

  useEffect(() => {
    const activateNode = () => {
      const randomNode = Math.floor(Math.random() * nodes.length)
      
      setNodes(prev => prev.map((node, index) => ({
        ...node,
        active: index === randomNode
      })))

      setConnections(prev => prev.map(conn => ({
        ...conn,
        active: conn.from.id === randomNode || conn.to.id === randomNode
      })))

      setTimeout(() => {
        setNodes(prev => prev.map(node => ({ ...node, active: false })))
        setConnections(prev => prev.map(conn => ({ ...conn, active: false })))
      }, 2000)
    }

    const interval = setInterval(activateNode, 3000)
    return () => clearInterval(interval)
  }, [nodes.length])

  return (
    <div className={`network-pulse ${className}`}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Connections */}
        {connections.map(conn => (
          <motion.line
            key={conn.id}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke={conn.active ? '#00ff41' : '#333333'}
            strokeWidth={conn.active ? 2 : 1}
            opacity={conn.active ? 1 : 0.3}
            animate={{
              stroke: conn.active ? '#00ff41' : '#333333',
              strokeWidth: conn.active ? 2 : 1,
              opacity: conn.active ? 1 : 0.3
            }}
            transition={{ duration: 0.3 }}
          />
        ))}

        {/* Data packets */}
        {connections.filter(conn => conn.active).map(conn => (
          <motion.circle
            key={`packet-${conn.id}`}
            r="3"
            fill="#00d4ff"
            initial={{ 
              cx: conn.from.x, 
              cy: conn.from.y,
              opacity: 0 
            }}
            animate={{ 
              cx: conn.to.x, 
              cy: conn.to.y,
              opacity: [0, 1, 0] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatDelay: 1 
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map(node => (
          <motion.g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.active ? 12 : 8}
              fill={node.active ? '#00ff41' : '#333333'}
              stroke={node.active ? '#ffffff' : '#555555'}
              strokeWidth={node.active ? 2 : 1}
              animate={{
                r: node.active ? 12 : 8,
                fill: node.active ? '#00ff41' : '#333333',
                stroke: node.active ? '#ffffff' : '#555555'
              }}
              transition={{ duration: 0.3 }}
            />
            {node.active && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill="none"
                stroke="#00ff41"
                strokeWidth="1"
                opacity="0.6"
                initial={{ r: 8, opacity: 0.8 }}
                animate={{ r: 25, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

export default NetworkPulse