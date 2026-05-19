import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Users, 
  MessageSquare, 
  Clock,
  Globe,
  Shield,
  Linkedin,
  Twitter,
  Github
} from 'lucide-react';
import Navigation from './Navigation';
import CyberBackground from './CyberBackground';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success, error

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      primary: "contact@zeronprotocol.com",
      secondary: "support@zeronprotocol.com"
    },
    {
      icon: Phone,
      title: "Phone",
      primary: "+1 (555) 123-4567",
      secondary: "+1 (555) 987-6543"
    },
    {
      icon: MapPin,
      title: "Office",
      primary: "123 Blockchain Street",
      secondary: "San Francisco, CA 94105"
    },
    {
      icon: Clock,
      title: "Hours",
      primary: "Mon - Fri: 9:00 AM - 6:00 PM PST",
      secondary: "24/7 Emergency Support"
    }
  ];

  const teamContacts = [
    {
      name: "Harshil Parmar",
      email: "harshil@zeronprotocol.com",
    },
    {
      name: "Pushti Vyas",
      email: "pushti@zeronprotocol.com",
    }
  ];

  return (
    <div className="contact-page">
      <Navigation />
      <CyberBackground count={18} />
      
      {/* Document Header */}
      <div className="contact-document">
        <div className="document-header">
          <h1>Contact ZerOn Protocol</h1>
          <p>Get in Touch with Our Cybersecurity Innovation Team</p>
          <div className="document-meta">
            <span>24/7 Support</span> • <span>Global Reach</span> • <span>Enterprise Ready</span>
          </div>
        </div>

        {/* Contact Content */}
        <div className="contact-content">
          
          {/* Contact Form Section */}
          <div className="contact-section">
            <div className="section-header">
              <div className="section-number">01</div>
              <div className="section-info">
                <h2>Send Us a Message</h2>
                <div className="section-meta">
                  <span className="category">Contact Form</span>
                  <span className="status">Available</span>
                  <span className="response-time">Response within 24h</span>
                </div>
              </div>
            </div>

            <div className="section-content">
              <div className="content-grid">
                <div className="form-column">
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="company">Company/Organization</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Subject</option>
                          <option value="general">General Inquiry</option>
                          <option value="partnership">Partnership Opportunity</option>
                          <option value="enterprise">Enterprise Solutions</option>
                          <option value="technical">Technical Support</option>
                          <option value="security">Security Research</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="6"
                        required
                      ></textarea>
                    </div>

                    <button type="submit" className="submit-button" disabled={submitStatus === 'submitting'}>
                      <Send size={14} />
                      {submitStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                    {submitStatus === 'success' && (
                      <div style={{color: '#00ff41', marginTop: '10px', fontSize: '0.85rem'}}>
                        Message sent successfully! We will get back to you soon.
                      </div>
                    )}
                    {submitStatus === 'error' && (
                      <div style={{color: '#ff3333', marginTop: '10px', fontSize: '0.85rem'}}>
                        Failed to send message. Please try again later.
                      </div>
                    )}
                  </form>
                </div>

                <div className="info-column">
                  <h4>Why Contact Us?</h4>
                  <ul>
                    <li>Enterprise cybersecurity solutions</li>
                    <li>Partnership opportunities</li>
                    <li>Technical integration support</li>
                    <li>Security research collaboration</li>
                    <li>Investment inquiries</li>
                    <li>Media and press relations</li>
                  </ul>
                  
                  <h4>Response Times</h4>
                  <p className="response-info">
                    General Inquiries: Within 24 hours<br/>
                    Enterprise: Within 4 hours<br/>
                    Security Issues: Immediate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="contact-section">
            <div className="section-header">
              <div className="section-number">02</div>
              <div className="section-info">
                <h2>Contact Information</h2>
                <div className="section-meta">
                  <span className="category">Direct Contact</span>
                  <span className="status">Available</span>
                  <span className="availability">24/7 Emergency</span>
                </div>
              </div>
            </div>

            <div className="section-content">
              <div className="contact-info-grid">
                {contactInfo.map((info, index) => (
                  <div key={index} className="contact-info-item">
                    <div className="info-icon">
                      <info.icon size={16} />
                    </div>
                    <div className="info-content">
                      <h4>{info.title}</h4>
                      <p className="primary">{info.primary}</p>
                      <p className="secondary">{info.secondary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Contacts Section */}
          <div className="contact-section">
            <div className="section-header">
              <div className="section-number">03</div>
              <div className="section-info">
                <h2>Team Contacts</h2>
                <div className="section-meta">
                  <span className="category">Leadership Team</span>
                  <span className="status">Available</span>
                  <span className="departments">4 Departments</span>
                </div>
              </div>
            </div>

            <div className="section-content">
              <div className="team-grid">
                {teamContacts.map((member, index) => (
                  <div key={index} className="team-member">
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p className="email" style={{ marginTop: '0.5rem' }}>{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social & Links Section */}
          <div className="contact-section">
            <div className="section-header">
              <div className="section-number">04</div>
              <div className="section-info">
                <h2>Connect With Us</h2>
                <div className="section-meta">
                  <span className="category">Social Media</span>
                  <span className="status">Active</span>
                  <span className="platforms">Multiple Platforms</span>
                </div>
              </div>
            </div>

            <div className="section-content">
              <div className="social-content">
                <div className="social-links">
                  <a href="#" className="social-link">
                    <Linkedin size={16} />
                    <span>LinkedIn</span>
                  </a>
                  <a href="#" className="social-link">
                    <Twitter size={16} />
                    <span>Twitter</span>
                  </a>
                  <a href="#" className="social-link">
                    <Github size={16} />
                    <span>GitHub</span>
                  </a>
                  <a href="#" className="social-link">
                    <Globe size={16} />
                    <span>Website</span>
                  </a>
                </div>
                
                <div className="social-info">
                  <h4>Follow Our Journey</h4>
                  <p>Stay updated with ZerOn Protocol development, security research, and industry insights through our social channels.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;