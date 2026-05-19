import React, { useState } from 'react';
import { 
  Rocket, 
  Shield, 
  Brain, 
  Globe, 
  Coins, 
  Code, 
  Target,
  Clock,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Briefcase,
  Settings,
  BarChart3,
  Database
} from 'lucide-react';
import Navigation from './Navigation';
import CyberBackground from './CyberBackground';
import './Roadmap.css';

const Roadmap = () => {
  const roadmapPhases = [
    {
      phase: "Phase 1",
      period: "Q1 2026",
      title: "Biometric Identity & Foundation",
      status: "Completed",
      progress: "100%",
      description: "Establishing the core foundational layer of the ZerOn platform, focusing on Sybil-resistant identity verification and basic autonomous scanning capabilities.",
      keyItems: [
        "MediaPipe Face Mesh Integration (468 landmarks)",
        "Dynamic Eye Aspect Ratio (EAR) Blink Calibration",
        "AES-256 Encrypted Biometric Embeddings", 
        "JWT-based Biometric Session Binding",
        "Interactive React SPA Dashboard UI",
        "Role-based Access Control (Assessor Mode)"
      ],
      techStack: "React 18, Vite 5, Firebase SDK, face-api.js, MediaPipe Face Mesh, Framer Motion",
      deliverables: "High-Assurance Identity Gate, Biometric Encrypted Vault, Core User Dashboard",
      targetMetrics: "99.9% Liveness Confidence • <200ms Face Match Verification"
    },
    {
      phase: "Phase 2", 
      period: "Q2 2026",
      title: "MoA Swarm & Core Engine",
      status: "Completed",
      progress: "100%",
      description: "Building the Mixture of Agents (MoA) distributed scanning engine with specialized LLMs to perform parallel vulnerability exploitation.",
      keyItems: [
        "Master Agent Orchestrator (Gemini 1.5 Flash)",
        "6 Parallel Specialist Agents (SQLi, XSS, SSRF, Auth, IDOR, Headers)",
        "JSON RAG Memory Store for Continuous Learning",
        "Context-Aware Payload Generation Pipeline",
        "Puppeteer-Based Headless SPA Crawling",
        "Regex Parameter Routing System"
      ],
      techStack: "Node.js 18, Express.js, Puppeteer, Gemini 1.5 Flash, NVIDIA NIM, Groq, Cohere, Mistral",
      deliverables: "Parallel Distributed Scanner, RAG Memory Engine, Multi-LLM API Integration",
      targetMetrics: "6 Concurrent AI Agents • <12s Payload Timeout Backoff"
    },
    {
      phase: "Phase 3",
      period: "Q3 2026",
      title: "Two-Stage Judge & Web3 Escrow", 
      status: "In Progress",
      progress: "85%",
      description: "Implementing advanced AI validation to eliminate false positives and integrating real blockchain smart contracts for instant bounty distributions.",
      keyItems: [
        "Cerebras llama3.1-8b Fast Triage Pipeline",
        "SambaNova DeepSeek-R1 Chain-of-Thought Judge",
        "Avalanche Fuji Testnet Bounty Escrow",
        "Pinata IPFS Immutable Report Pinning",
        "Real-time Socket.io Terminal Monitoring",
        "PDF Report Generation & Gemini Remediation"
      ],
      techStack: "Cerebras, SambaNova (DeepSeek-R1), Ethers.js v6, Solidity, Socket.io, Pinata IPFS, PDFKit",
      deliverables: "Auto-funding Smart Contract, Zero-False-Positive Validation, Real-time Dashboard Sync",
      targetMetrics: "<30s Payout Automation • 0% False Positive Reporting"
    },
    {
      phase: "Phase 4",
      period: "Q4 2026", 
      title: "Enterprise Deploy & DAO Scaling",
      status: "Planned",
      progress: "15%",
      description: "Achieving global production readiness by scaling the network, open-sourcing community bot endpoints, and solidifying regulatory compliance.",
      keyItems: [
        "Enterprise API Webhook Integrations",
        "Decentralized Autonomous Organization (DAO) DAO Setup",
        "Community Security Bot Payload Submissions",
        "Tokenomics Integration ($ZERON Mainnet)",
        "Global Compliance Frameworks (SOC2, GDPR)",
        "Self-Sustaining Bug Bounty Economics"
      ],
      techStack: "Avalanche C-Chain Mainnet, Layer 2 Bridges, GraphQL API, Webhooks, Hardhat",
      deliverables: "Mainnet Protocol Launch, Enterprise API Documentation, DAO Governance Portal",
      targetMetrics: "1,000+ Enterprise Scans/Day • $5M+ Mainnet Bounty Pool"
    }
  ];

  return (
    <div className="roadmap-page">
      <Navigation />
      <CyberBackground count={22} />
      
      {/* Document Header */}
      <div className="roadmap-document">
        <div className="document-header">
          <h1>ZerOn Protocol Development Roadmap</h1>
          <p>2025-2026 Strategic Implementation Plan</p>
          <div className="document-meta">
            <span>4 Phases</span> • <span>18 Months</span> • <span>$100M+ Target</span>
          </div>
        </div>

        {/* Document Content */}
        <div className="document-content">
          {roadmapPhases.map((phase, index) => (
            <div key={index} className="phase-section">
              
              {/* Phase Header */}
              <div className="phase-header">
                <div className="phase-number">{phase.phase}</div>
                <div className="phase-info">
                  <h2>{phase.title}</h2>
                  <div className="phase-meta">
                    <span className="period">{phase.period}</span>
                    <span className={`status ${phase.status.toLowerCase().replace(' ', '-')}`}>
                      {phase.status}
                    </span>
                    <span className="progress">{phase.progress}</span>
                  </div>
                </div>
              </div>

              {/* Phase Content */}
              <div className="phase-content">
                <p className="description">{phase.description}</p>
                
                <div className="content-grid">
                  <div className="content-column">
                    <h4>Key Features</h4>
                    <ul>
                      {phase.keyItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="content-column">
                    <h4>Technology Stack</h4>
                    <div className="tech-tags">
                      {phase.techStack.split(',').map((tech, i) => (
                        <span key={i} className="tech-tag">{tech.trim()}</span>
                      ))}
                    </div>
                    
                    <h4>Deliverables</h4>
                    <p className="deliverables">{phase.deliverables}</p>
                    
                    <h4>Target Metrics</h4>
                    <p className="metrics">{phase.targetMetrics}</p>
                  </div>
                </div>
              </div>
              
              {index < roadmapPhases.length - 1 && <div className="phase-separator"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
