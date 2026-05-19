import React from 'react'
import { motion } from 'framer-motion'
import { 
  Github, 
  Twitter, 
  MessageSquare, 
  Mail, 
  Shield, 
  ExternalLink,
  Globe,
  FileText,
  Users,
  HelpCircle
} from 'lucide-react'
import './Footer.css'

const Footer = () => {
  const footerSections = {
    resources: [
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Security Framework', href: '#' },
      { name: 'Web3 Integration', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'Analytics', href: '#' },
      { name: 'ZerOn Conf', href: '#' },
      { name: 'Enterprise', href: '#' }
    ],
    company: [
      { name: 'About ZerOn', href: '#' },
      { name: 'Open Source', href: '#' },
      { name: 'GitHub', href: '#' },
      { name: 'Twitter', href: '#' },
      { name: 'LinkedIn', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' }
    ]
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Logo and Social Links */}
          <div className="footer-brand">
            <div className="brand-logo">
              <img src="/assets/zeron-logo.png" alt="ZerOn" className="footer-logo-image" />
            </div>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div className="footer-links">
            <div className="links-column">
              <h4 className="column-title">Resources</h4>
              <ul className="links-list">
                {footerSections.resources.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="links-column">
              <h4 className="column-title">Company</h4>
              <ul className="links-list">
                {footerSections.company.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="links-column">
              <h4 className="column-title">Legal</h4>
              <ul className="links-list">
                {footerSections.legal.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="links-column newsletter-column">
              <h4 className="column-title">Stay Updated</h4>
              <p className="newsletter-description">
                Get the latest updates on ZerOn features, Web3 infrastructure, and security advancements.
              </p>
              <div className="newsletter-form">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="newsletter-input"
                />
                <button className="newsletter-btn">Subscribe</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="copyright">© 2025 ZerOn, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
