import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Shield, 
  Zap, 
  Crown, 
  Check, 
  X,
  Sparkles,
  Target,
  Lock,
  Wallet
} from 'lucide-react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import Footer from './Footer'
import './PlanSelection.css'

const PlanSelection = () => {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('id')
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      icon: Shield,
      price: 'Free',
      domains: 1,
      description: 'Perfect for individual users and small projects',
      features: [
        { text: '1 Domain Scan', included: true },
        { text: 'Basic Vulnerability Detection', included: true },
        { text: 'Email Reports', included: true },
        { text: 'Community Support', included: true },
        { text: 'Advanced Threat Analysis', included: false },
        { text: 'Priority Support', included: false },
        { text: 'API Access', included: false }
      ],
      color: '#00ff88',
      gradient: 'linear-gradient(135deg, #00ff88, #00ccff)'
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Zap,
      price: '$29',
      priceUnit: '/month',
      domains: 3,
      popular: true,
      description: 'Everything in Basic, plus:',
      features: [
        { text: '3 Domain Scans', included: true },
        { text: 'Advanced Vulnerability Detection', included: true },
        { text: 'Real-time Alerts', included: true },
        { text: 'Priority Email Support', included: true },
        { text: 'Advanced Threat Analysis', included: true },
        { text: 'API Access', included: true },
        { text: 'Custom Reports', included: false }
      ],
      color: '#00ccff',
      gradient: 'linear-gradient(135deg, #00ccff, #0099ff)'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Crown,
      price: '$99',
      priceUnit: '/month',
      domains: 6,
      description: 'Everything in Pro, plus:',
      features: [
        { text: '6 Domain Scans', included: true },
        { text: 'Enterprise-grade Detection', included: true },
        { text: 'Real-time Monitoring', included: true },
        { text: '24/7 Priority Support', included: true },
        { text: 'Advanced Threat Intelligence', included: true },
        { text: 'Full API Access', included: true },
        { text: 'Custom Integrations', included: true }
      ],
      color: '#ffd700',
      gradient: 'linear-gradient(135deg, #ffd700, #ffed4e)'
    }
  ]

  useEffect(() => {
    if (!userId) {
      navigate('/')
    }
  }, [userId, navigate])

  const handleSelectPlan = async (plan) => {
    if (loading) return
    
    console.log('Plan selected:', plan.id)
    
    setLoading(true)
    setSelectedPlan(plan.id)
    
    try {
      // For Basic and Pro plans - require wallet connection and signature
      if (plan.id === 'basic' || plan.id === 'pro') {
        console.log(`Processing ${plan.name} plan - checking for wallet...`)
        
        // Check if Core wallet or other provider is available
        const provider = window.avalanche || window.ethereum;
        
        if (!provider) {
          console.error('No wallet provider found')
          alert('Please install Core wallet extension to continue')
          setLoading(false)
          setSelectedPlan(null)
          return
        }

        console.log('Requesting wallet connection...')
        
        // Connect wallet
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        })
        
        console.log('Accounts received:', accounts)
        
        if (!accounts || accounts.length === 0) {
          alert('No wallet connected. Please connect your Core wallet.')
          setLoading(false)
          setSelectedPlan(null)
          return
        }

        const userWallet = accounts[0]
        setWalletAddress(userWallet)
        
        console.log('Wallet connected:', userWallet)

        // Auto-switch wallet to Avalanche Fuji Testnet (Chain ID: 43113 / 0xa869)
        const FUJI_CHAIN_ID = '0xa869'
        try {
          console.log('Requesting network switch to Avalanche Fuji Testnet...')
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: FUJI_CHAIN_ID }]
          })
        } catch (switchError) {
          // 4902 is the standard code for 'unrecognized chain ID' in MetaMask/Core
          if (switchError.code === 4902 || switchError.message?.toLowerCase().includes('unrecognized') || switchError.message?.toLowerCase().includes('not added')) {
            try {
              console.log('Fuji Testnet not added to wallet. Attempting to add network...')
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: FUJI_CHAIN_ID,
                    chainName: 'Avalanche Fuji Testnet',
                    nativeCurrency: {
                      name: 'AVAX',
                      symbol: 'AVAX',
                      decimals: 18
                    },
                    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                    blockExplorerUrls: ['https://testnet.snowtrace.io/']
                  }
                ]
              })
            } catch (addError) {
              console.error('Failed to add Fuji network:', addError)
              alert('Failed to add Avalanche Fuji Testnet to your wallet. Please add it manually in Core.')
              setLoading(false)
              setSelectedPlan(null)
              return
            }
          } else {
            console.error('Failed to switch network:', switchError)
            alert('Unsupported network. Please switch your Core wallet to Avalanche Fuji Testnet.')
            setLoading(false)
            setSelectedPlan(null)
            return
          }
        }

        // Web3 Security: Request Cryptographic Signature to verify wallet ownership
        console.log('Requesting wallet signature verification...')
        const message = `Welcome to ZerOn!\n\nPlease sign this message to verify ownership of this wallet and link it to your account.\n\nWallet: ${userWallet}\nTimestamp: ${Date.now()}`;
        
        // Convert string to hex for personal_sign
        const msgHex = '0x' + Array.from(new TextEncoder().encode(message))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        let signature = null;
        try {
          signature = await provider.request({
            method: 'personal_sign',
            params: [msgHex, userWallet]
          });
          console.log('Wallet verified with signature:', signature);
        } catch (sigError) {
          console.error('Signature rejected:', sigError);
          alert('Signature rejected. You must sign the message to verify wallet ownership.');
          setLoading(false);
          setSelectedPlan(null);
          return;
        }

        let txHash = 'basic_plan_no_tx';
        
        // Only charge for 'pro' plan (e.g., 0.01 ETH/AVAX on Testnet)
        if (plan.id === 'pro') {
          console.log('Initiating testnet transaction...');
          
          // 0.01 in hex wei (10000000000000000 wei)
          const valueInWeiHex = '0x2386F26FC10000'; 
          
          // ZerOn Treasury Wallet (User's MetaMask)
          const companyWallet = '0x28F6CAbd2d5B3b125F98ce8A3410676B23485A0b';
          
          const transactionParameters = {
            to: companyWallet,
            from: userWallet,
            value: valueInWeiHex,
          };

          try {
            // Request actual transaction
            txHash = await provider.request({
              method: 'eth_sendTransaction',
              params: [transactionParameters]
            });
            console.log('Transaction sent! Hash:', txHash);
          } catch (txError) {
            console.error('Transaction failed/rejected:', txError);
            alert('Transaction rejected or failed.\n\nNote: You need testnet tokens (like Sepolia ETH or Fuji AVAX) to complete this. Please use a Faucet if your wallet is empty.');
            setLoading(false);
            setSelectedPlan(null);
            return;
          }
        }

        console.log('Storing data in Firebase...')

        // Store plan selection and transaction hash in Firebase
        const userRef = doc(db, 'users', userId)
        
        await setDoc(userRef, {
          walletAddress: userWallet,
          transactionHash: txHash,
          transactionDate: new Date().toISOString(),
          signature: signature,
          signedAt: new Date().toISOString(),
          plan: {
            type: plan.id,
            name: plan.name,
            domains: plan.domains,
            domainsUsed: 0,
            selectedAt: new Date().toISOString(),
            status: 'active'
          }
        }, { merge: true })
        
        console.log('Data stored successfully!')

        // Navigate to dashboard
        setTimeout(() => {
          console.log('Redirecting to dashboard...')
          navigate(`/dashboard?id=${userId}`)
        }, 1000)
        
      } else {
        // For Enterprise plan (later implementation)
        alert('Enterprise plan will be available soon!')
        setLoading(false)
        setSelectedPlan(null)
      }
      
    } catch (error) {
      console.error('Error selecting plan:', error)
      
      if (error.code === 4001) {
        alert('Signature rejected. Please approve the signature to continue.')
      } else if (error.code === -32002) {
        alert('Please check your Core wallet. A connection request is already pending.')
      } else {
        alert('Failed to select plan. Please try again.')
      }
      
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="plan-selection-container">
      <div className="plans-container">
        {/* Header */}
        <motion.div 
          className="plans-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Plans and Pricing</h1>
          <p>
            Choose a plan that matches your requirements. Upgrade or downgrade anytime.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <motion.div
                key={plan.id}
                className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="plan-card-header">
                  <h3 className="plan-card-name">{plan.name}</h3>
                  <div className="plan-card-price">
                    <span className="price-value">{plan.price}</span>
                    {plan.priceUnit && <span className="price-period">{plan.priceUnit}</span>}
                  </div>
                  <p className="plan-card-description">{plan.description}</p>
                  <button
                    className="plan-learn-more"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <span className="btn-loading">
                        <span className="spinner"></span>
                        Connecting...
                      </span>
                    ) : (
                      <>
                        {(plan.id === 'basic' || plan.id === 'pro') && <Wallet size={16} />}
                        {plan.id === 'pro' ? 'Pay 0.01 (Testnet)' : plan.id === 'basic' ? 'Connect & Choose' : 'Choose this plan'}
                      </>
                    )}
                  </button>
                </div>

                <div className="plan-card-features">
                  {plan.features.map((feature, idx) => (
                    <div 
                      key={idx} 
                      className={`feature-row ${feature.included ? 'included' : 'excluded'}`}
                    >
                      {feature.included ? (
                        <Check size={16} className="feature-check included" />
                      ) : (
                        <X size={16} className="feature-check excluded" />
                      )}
                      <span className="feature-text">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default PlanSelection
