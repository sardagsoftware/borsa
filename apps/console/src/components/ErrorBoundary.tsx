/**
 * 🛡️ Error Boundary Component
 * Catches React errors and provides recovery options
 * 
 * @module components/ErrorBoundary
 * @white-hat Compliant
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Send to telemetry
    this.sendToTelemetry(error, errorInfo);

    // Call parent onError handler
    this.props.onError?.(error, errorInfo);
  }

  sendToTelemetry(error: Error, errorInfo: ErrorInfo) {
    try {
      fetch('/api/ui-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'react_error',
          error: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
        credentials: 'include',
      }).catch(console.warn);
    } catch (e) {
      console.warn('Failed to send error to telemetry', e);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearState = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear state', e);
    }
  };

  handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI (Premium Black-Gold theme)
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
            color: '#f5f5f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#d4af37',
                marginBottom: '1rem',
              }}
            >
              Bir Hata Oluştu
            </h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Üzgünüz, uygulama beklenmeyen bir hata ile karşılaştı. Lütfen sayfayı
              yenileyin veya durumu temizleyin.
            </p>

            {this.state.error && (
              <details
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Teknik Detaylar
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    color: '#ff6b6b',
                  }}
                >
                  {this.state.error.message}
                  {this.state.error.stack && `

${this.state.error.stack}`}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔄 Sayfayı Yenile
              </button>

              <button
                onClick={this.handleClearState}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#f5f5f5',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🗑️ Durumu Temizle
              </button>

              <button
                onClick={this.handleDismiss}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d4af37',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Görmezden Gel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
