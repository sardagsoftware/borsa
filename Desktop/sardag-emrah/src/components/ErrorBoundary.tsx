"use client";

/**
 * ERROR BOUNDARY COMPONENT
 *
 * Graceful error handling with user-friendly fallback UI
 * - Catches React errors
 * - Logs to monitoring service
 * - Provides recovery options
 * - Prevents full app crash
 */

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to your error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] p-4">
          <div className="max-w-md w-full bg-[#1a1f2e] border border-red-500/20 rounded-lg p-6 shadow-xl">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Bir Hata Oluştu
            </h2>

            {/* Error Message */}
            <p className="text-gray-400 text-center text-sm mb-4">
              Üzgünüz, beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenilemeyi deneyin.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 bg-black/30 rounded p-3 text-xs">
                <summary className="cursor-pointer text-red-400 font-medium mb-2">
                  Teknik Detaylar (Development)
                </summary>
                <pre className="text-red-300 overflow-auto max-h-32 text-[10px]">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Sayfayı Yenile
              </button>
            </div>

            {/* Help Link */}
            <div className="mt-4 text-center">
              <a
                href="/market"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ana Sayfaya Dön →
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for functional components to handle errors
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
