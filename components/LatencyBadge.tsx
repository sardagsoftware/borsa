// components/LatencyBadge.tsx
// AI Performance Indicator & Model Selection Badge
// © 2024 Emrah Şardağ. All Rights Reserved.

'use client';

import { useState, useEffect } from 'react';
import { Cpu, Zap, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface LatencyBadgeProps {
  model?: string;
  ttft?: number; // Time to First Token (ms)
  totalTime?: number; // Total response time (ms)
  task?: string;
  tokensPerSecond?: number;
  className?: string;
  showDetails?: boolean;
}

interface PerformanceMetrics {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  icon: React.ComponentType<any>;
}

/**
 * Get performance status based on TTFT and task type
 */
function getPerformanceStatus(ttft: number, task?: string): PerformanceMetrics {
  // Different thresholds for different task types
  const thresholds = {
    ui_suggest: { excellent: 100, good: 200, fair: 500 },
    quick_qa: { excellent: 150, good: 300, fair: 750 },
    deep_analysis: { excellent: 300, good: 800, fair: 2000 },
    code: { excellent: 250, good: 600, fair: 1500 },
    translate: { excellent: 100, good: 250, fair: 600 },
  };

  const threshold = thresholds[task as keyof typeof thresholds] || thresholds.quick_qa;

  if (ttft <= threshold.excellent) {
    return { status: 'excellent', color: 'text-green-500', icon: CheckCircle };
  } else if (ttft <= threshold.good) {
    return { status: 'good', color: 'text-blue-500', icon: Zap };
  } else if (ttft <= threshold.fair) {
    return { status: 'fair', color: 'text-yellow-500', icon: AlertTriangle };
  } else {
    return { status: 'poor', color: 'text-red-500', icon: XCircle };
  }
}

/**
 * Format model name for display
 */
function formatModelName(model: string): string {
  const modelMap: Record<string, string> = {
    'llama-3.1-8b-instruct': 'Llama 3.1 8B',
    'llama-3.1-70b-versatile': 'Llama 3.1 70B',
    'mixtral-8x7b-32768': 'Mixtral 8x7B',
    'gemma2-9b-it': 'Gemma2 9B',
  };

  return modelMap[model] || model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format task name for display
 */
function formatTaskName(task: string): string {
  const taskMap: Record<string, string> = {
    'ui_suggest': 'UI Öneri',
    'quick_qa': 'Hızlı Soru',
    'deep_analysis': 'Derin Analiz',
    'code': 'Kod Üretimi',
    'translate': 'Çeviri',
  };

  return taskMap[task] || task;
}

export default function LatencyBadge({ 
  model, 
  ttft, 
  totalTime,
  task = 'quick_qa',
  tokensPerSecond,
  className = '',
  showDetails = true
}: LatencyBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Show badge when model data is available
  useEffect(() => {
    if (model && ttft !== undefined) {
      setIsVisible(true);
      setAnimationClass('animate-slide-up');
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setAnimationClass('animate-fade-out');
        setTimeout(() => setIsVisible(false), 300);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [model, ttft]);

  if (!isVisible || !model || ttft === undefined) {
    return null;
  }

  const performance = getPerformanceStatus(ttft, task);
  const StatusIcon = performance.icon;
  const modelDisplayName = formatModelName(model);
  const taskDisplayName = formatTaskName(task);

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-panel/90 backdrop-blur-sm border border-glass rounded-lg p-3 shadow-lg z-50 ${animationClass} ${className}`}
      role="status"
      aria-label={`AI Model Performance: ${modelDisplayName}, ${ttft}ms response time`}
    >
      <div className="flex items-center space-x-3 min-w-0">
        {/* Status Icon */}
        <div className={`flex-shrink-0 ${performance.color}`}>
          <StatusIcon className="w-4 h-4" />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 text-sm">
            <Cpu className="w-4 h-4 text-muted" />
            <span className="font-medium text-text truncate">
              {modelDisplayName}
            </span>
          </div>
          
          {showDetails && (
            <div className="flex items-center space-x-4 text-xs text-muted mt-1">
              {/* TTFT */}
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span className={performance.color}>
                  {ttft}ms
                </span>
              </div>

              {/* Task Type */}
              <div className="flex items-center space-x-1">
                <span className="opacity-60">•</span>
                <span>{taskDisplayName}</span>
              </div>

              {/* Tokens per second (if available) */}
              {tokensPerSecond && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>{tokensPerSecond} t/s</span>
                </div>
              )}

              {/* Total time (if different from TTFT) */}
              {totalTime && totalTime > ttft && (
                <div className="flex items-center space-x-1">
                  <span className="opacity-60">Total:</span>
                  <span>{totalTime}ms</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setAnimationClass('animate-fade-out');
            setTimeout(() => setIsVisible(false), 300);
          }}
          className="flex-shrink-0 text-muted hover:text-text transition-colors p-1"
          aria-label="Performans rozetini kapat"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Performance Bar */}
      {showDetails && (
        <div className="mt-2 w-full bg-glass/30 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out ${
              performance.status === 'excellent' ? 'bg-green-500' :
              performance.status === 'good' ? 'bg-blue-500' :
              performance.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ 
              width: `${Math.max(10, Math.min(100, (1000 - ttft) / 10))}%` 
            }}
          />
        </div>
      )}
    </div>
  );
}

// CSS animations should be added to global styles or Tailwind config:
/*
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

.animate-fade-out {
  animation: fade-out 0.3s ease-out forwards;
}
*/
