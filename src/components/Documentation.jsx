import React, { useState } from 'react';
import { BookOpen, Code, Server, Shield, Database, Terminal, Cpu, CheckCircle, Zap } from 'lucide-react';
import Navigation from './Navigation';
import CyberBackground from './CyberBackground';
import { TABS } from './docData';
import './Documentation.css';

const Documentation = () => {
  const [activeTabId, setActiveTabId] = useState('intro');

  const activeData = TABS.find(t => t.id === activeTabId)?.content;

  // Icons map for the sidebar
  const ICONS = {
    'intro': BookOpen,
    'architecture': Server,
    'api': Code,
    'agents': BrainIcon,
    'web3': Shield,
    'quickstart': Terminal
  };

  function BrainIcon(props) {
    return <Cpu {...props} />;
  }

  return (
    <div className="documentation-page">
      <Navigation />
      <CyberBackground count={20} />

      <div className="docs-container">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          <div className="sidebar-header">
            <h3>Developer Portal</h3>
            <span className="version-badge">v1.0.0</span>
          </div>
          <nav className="sidebar-nav">
            {TABS.map((tab) => {
              const Icon = ICONS[tab.id] || BookOpen;
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="docs-content">
          {activeData && (
            <div className="tab-content animate-fade-in">
              <h1>{activeData.title}</h1>
              <p className="lead">{activeData.lead}</p>

              {/* RENDER BODY PARAGRAPHS */}
              {activeData.body && activeData.body.map((b, i) => (
                <div key={i} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#00d4ff', marginBottom: '0.5rem' }}>{b.h}</h3>
                  <p style={{ lineHeight: 1.6, color: '#ccc' }}>{b.p}</p>
                </div>
              ))}

              {/* RENDER INTRO BADGES */}
              {activeData.badges && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                  {activeData.badges.map(([tech, label], i) => (
                    <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                      <div style={{ color: '#00ff88', fontWeight: 'bold' }}>{tech}</div>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER ARCHITECTURE LAYERS */}
              {activeData.layers && (
                <div style={{ marginTop: '2rem' }}>
                  {activeData.layers.map((layer, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.5)', borderLeft: `3px solid ${layer.color}` }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${layer.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: layer.color, fontWeight: 'bold' }}>
                        {i + 1}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: '#fff' }}>{layer.label}</h4>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>{layer.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER AGENTS */}
              {activeData.agents && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
                  {activeData.agents.map((agent, i) => (
                    <div key={i} style={{ padding: '1.5rem', background: 'rgba(10,10,10,0.8)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#00d4ff' }}>{agent.name}</h3>
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' }}>{agent.model}</span>
                      </div>
                      <div style={{ color: '#00ff88', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>ROLE: {agent.role}</div>
                      <p style={{ color: '#ccc', margin: 0, lineHeight: 1.5 }}>{agent.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER API ENDPOINTS */}
              {activeData.endpoints && (
                <div style={{ marginTop: '2rem' }}>
                  {activeData.endpoints.map((ep, i) => (
                    <div key={i} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{ background: ep.method === 'GET' ? '#00d4ff' : ep.method === 'POST' ? '#00ff88' : '#ffaa00', color: '#000', padding: '0.2rem 0.5rem', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.8rem' }}>{ep.method}</span>
                        <code style={{ color: '#fff', fontSize: '1.1rem' }}>{ep.url}</code>
                      </div>
                      <p style={{ color: '#aaa', marginBottom: '1rem' }}>{ep.desc}</p>
                      {ep.params && ep.params.length > 0 && (
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <th style={{ padding: '0.5rem' }}>Parameter</th>
                              <th style={{ padding: '0.5rem' }}>Type</th>
                              <th style={{ padding: '0.5rem' }}>Requirement</th>
                              <th style={{ padding: '0.5rem' }}>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ep.params.map((p, j) => (
                              <tr key={j} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem', color: '#00d4ff', fontFamily: 'monospace' }}>{p[0]}</td>
                                <td style={{ padding: '0.5rem', color: '#ccc' }}>{p[1]}</td>
                                <td style={{ padding: '0.5rem', color: p[2] === 'required' ? '#ff4444' : '#888' }}>{p[2]}</td>
                                <td style={{ padding: '0.5rem', color: '#999' }}>{p[3]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}

                  <h3 style={{ marginTop: '3rem', color: '#00d4ff' }}>Socket.io Events</h3>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '1rem' }}>
                    <tbody>
                      {activeData.socketEvents.map((ev, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem', color: '#00ff88', fontFamily: 'monospace' }}>{ev[0]}</td>
                          <td style={{ padding: '1rem', color: '#888' }}>{ev[1]}</td>
                          <td style={{ padding: '1rem', color: '#ccc' }}>{ev[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RENDER QUICKSTART STEPS */}
              {activeData.steps && (
                <div style={{ marginTop: '2rem' }}>
                  {activeData.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                      <div style={{ fontSize: '2rem', color: 'rgba(0,212,255,0.2)', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}>{step.n}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{step.title}</h4>
                        <pre style={{ background: 'rgba(0,0,0,0.6)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', color: '#00ff88', overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                  <div className="success-box" style={{ marginTop: '3rem', background: 'rgba(0,255,136,0.1)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle size={24} color="#00ff88" />
                    <span style={{ color: '#fff' }}><strong>Ready to hunt?</strong> Download ZERON.EXE to automate agents locally.</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Documentation;
