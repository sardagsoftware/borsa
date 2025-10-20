/**
 * ERROR BOUNDARY - User-Friendly Error Handling
 *
 * Catches React errors and shows friendly messages
 */

'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 border border-red-500/30">
            <div className="text-center">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bir Sorun Oluştu
              </h2>
              <p className="text-gray-400 mb-6">
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
