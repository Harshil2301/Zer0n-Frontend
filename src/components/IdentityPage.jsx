import React, { useEffect } from 'react'
import Navigation from './Navigation'
import Identity from './Identity'
import ParticleField from './ParticleField'
import NetworkPulse from './NetworkPulse'
import './IdentityPage.css'

const IdentityPage = () => {
  useEffect(() => {
    document.title = 'Identity Verification - ZerOn'
    return () => {
      document.title = 'ZerOn - Web3 Infrastructure Solutions'
    }
  }, [])

  return (
    <div className="identity-page">
      <Navigation />
      <ParticleField count={50} className="identity-particles" />
      <NetworkPulse className="network-background" />
      <Identity />
    </div>
  )
}

export default IdentityPage