import React, { useState } from 'react';
import { Download, Monitor, Terminal, Shield, ArrowRight, Check } from 'lucide-react';
import Navigation from './Navigation';
import CyberBackground from './CyberBackground';
import './DownloadCenter.css';

const DownloadCenter = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    // Simulate download delay then reset button
    setTimeout(() => {
      setDownloading(false);
    }, 3000);
  };

  return (
    <div className="download-page">
      <Navigation />
      <CyberBackground count={24} />

      <div className="download-container">
        <div className="download-header">
          <div className="badge">VERSION 1.0.0 ALPHA</div>
          <h1>ZERON<span className="accent">.EXE</span></h1>
          <p>The decentralized autonomous vulnerability scanner. Run it locally, connect to the network, and start earning bug bounties autonomously.</p>
        </div>

        <div className="download-card">
          <div className="os-icon">
            <Monitor size={48} />
          </div>
          <div className="card-content">
            <h3>Windows (64-bit)</h3>
            <span className="file-info">zeron-installer.zip • 45 MB</span>
          </div>
          <a 
            href="/assets/zeron-installer.zip" 
            download="zeron-installer.zip"
            className={`download-btn ${downloading ? 'downloading' : ''}`}
            onClick={handleDownload}
          >
            {downloading ? (
              <><Check size={20} /> Downloading...</>
            ) : (
              <><Download size={20} /> Download for Windows</>
            )}
          </a>
        </div>

        <div className="system-requirements">
          <h4>System Requirements</h4>
          <ul>
            <li>Windows 10 / 11 (64-bit)</li>
            <li>4GB RAM minimum</li>
            <li>Active internet connection</li>
            <li>MetaMask or Web3 Wallet (for payouts)</li>
          </ul>
        </div>

        <div className="installation-guide">
          <h2>Quick Start Guide</h2>
          
          <div className="guide-steps">
            <div className="step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h4>Extract the Archive</h4>
                <p>Unzip <code>zeron-installer.zip</code> to a dedicated directory on your local machine.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h4>Run the Executable</h4>
                <p>Double-click <code>zeron.exe</code>. If prompted by Windows Defender, select "Run anyway".</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h4>Authenticate</h4>
                <p>The CLI will prompt you to authenticate via the Web3 Biometric Face Scan to register your bot's on-chain identity.</p>
                <div className="code-snippet">
                  <Terminal size={14} />
                  <code>zeron login --biometric</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadCenter;
