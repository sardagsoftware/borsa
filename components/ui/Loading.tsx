'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRegime } from '@/lib/ui/regime';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'orbit';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}: LoadingSpinnerProps) {
  const { regime } = useRegime();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-12 h-12';
      default: return 'w-6 h-6';
    }
  };

  const getRegimeColor = () => {
    switch (regime) {
      case 'shock': return 'border-warn';
      case 'elevated': return 'border-accent1';
      default: return 'border-brand1';
    }
  };

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`rounded-full ${
              regime === 'shock' ? 'bg-warn' :
              regime === 'elevated' ? 'bg-accent1' :
              'bg-brand1'
            } ${size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'}`}
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={`${getSizeClasses()} rounded-full ${
          regime === 'shock' ? 'bg-warn/20' :
          regime === 'elevated' ? 'bg-accent1/20' :
          'bg-brand1/20'
        } ${className}`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className={`w-full h-full rounded-full ${
          regime === 'shock' ? 'bg-warn' :
          regime === 'elevated' ? 'bg-accent1' :
          'bg-brand1'
        }`} />
      </motion.div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`${
              regime === 'shock' ? 'bg-warn' :
              regime === 'elevated' ? 'bg-accent1' :
              'bg-brand1'
            } ${
              size === 'sm' ? 'w-0.5 h-3' :
              size === 'lg' ? 'w-1 h-6' :
              size === 'xl' ? 'w-1.5 h-8' :
              'w-0.5 h-4'
            } rounded-full`}
            animate={{
              scaleY: [1, 2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'orbit') {
    return (
      <div className={`${getSizeClasses()} relative ${className}`}>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: regime === 'shock' ? 'var(--warn)' :
                          regime === 'elevated' ? 'var(--accent1)' :
                          'var(--brand1)'
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className={`absolute inset-2 rounded-full ${
            regime === 'shock' ? 'bg-warn/20' :
            regime === 'elevated' ? 'bg-accent1/20' :
            'bg-brand1/20'
          }`}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    );
  }

  // Default spinner
  return (
    <div 
      className={`${getSizeClasses()} border-2 border-current border-t-transparent rounded-full animate-spin ${getRegimeColor()} ${className}`}
    />
  );
}

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  variant?: 'default' | 'minimal' | 'detailed';
  className?: string;
}

export function LoadingScreen({
  message = "Loading...",
  subMessage,
  progress,
  variant = 'default',
  className = ''
}: LoadingScreenProps) {
  const { regime } = useRegime();

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-bg ${className}`}>
        <LoadingSpinner size="lg" variant="orbit" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 ${className}`} data-regime={regime}>
        <div className="text-center max-w-md mx-auto p-8">
          {/* Ailydian AI Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl ${
                regime === 'shock' ? 'bg-warn/20' :
                regime === 'elevated' ? 'bg-accent1/20' :
                'bg-blue-500/20'
              } flex items-center justify-center`}>
                <span className={`text-xl font-bold ${
                  regime === 'shock' ? 'text-warn' :
                  regime === 'elevated' ? 'text-accent1' :
                  'text-blue-400'
                }`}>AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AILYDIAN AI
                </h1>
                <p className="text-xs text-slate-400">8 Advanced AI Models</p>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Spinner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <LoadingSpinner size="xl" variant="orbit" />
          </motion.div>

          {/* Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <h3 className="text-lg font-semibold text-white">
              {message}
            </h3>
            {subMessage && (
              <p className="text-sm text-slate-400">
                {subMessage}
              </p>
            )}
          </motion.div>

          {/* Progress bar */}
          {progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {Math.round(progress)}% complete
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Default loading screen
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-bg ${className}`} data-regime={regime}>
      <LoadingSpinner size="lg" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-gray-400"
      >
        {message}
      </motion.p>
      {subMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-1 text-sm text-gray-500"
        >
          {subMessage}
        </motion.p>
      )}
    </div>
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  variant?: 'blur' | 'dark' | 'transparent';
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  variant = 'blur',
  className = ''
}: LoadingOverlayProps) {
  const { regime } = useRegime();

  if (!isVisible) return null;

  const getBackgroundClass = () => {
    switch (variant) {
      case 'dark':
        return 'bg-bg/90';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'bg-panel/20 backdrop-blur-sm';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${getBackgroundClass()} ${className}`}
      data-regime={regime}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-sm text-gray-300"
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}

// Loading skeleton components
export function LoadingSkeleton({ className = '', ...props }) {
  return (
    <div 
      className={`animate-pulse bg-panel/50 rounded ${className}`} 
      {...props} 
    />
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-2xl bg-panel border border-panel/30 p-6">
      <div className="space-y-4">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-6 w-1/2" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-full" />
          <LoadingSkeleton className="h-3 w-5/6" />
        </div>
        <div className="flex gap-2 pt-2">
          <LoadingSkeleton className="h-8 w-20" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${cols}`}>
      {Array.from({ length: count }, (_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
