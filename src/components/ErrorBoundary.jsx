import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '3rem', textAlign: 'center',
          background: 'rgba(255, 50, 50, 0.05)', borderRadius: '12px',
          border: '1px solid rgba(255, 50, 50, 0.2)', margin: '2rem auto',
          maxWidth: '600px'
        }}>
          <AlertTriangle size={48} style={{ color: '#ff7b7b', marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.5rem' }}>
            Component Failed to Load
          </h3>
          <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {this.state.error?.message || 'An unexpected error occurred in this widget.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#222', border: '1px solid #444', borderRadius: '8px',
              padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem'
            }}
          >
            <RefreshCw size={14} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
