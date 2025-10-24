/**
 * MOBILE OPTIMIZED BUTTON
 *
 * Touch-friendly button with:
 * - Minimum 44×44px touch target (Apple guidelines)
 * - Haptic feedback
 * - Active states
 * - Loading states
 */

'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { vibrate } from '@/lib/mobile/touch-handlers';

export interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
}

export function MobileOptimizedButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  haptic = true,
  fullWidth = false,
  className = '',
  onClick,
  disabled,
  ...props
}: MobileButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    // Haptic feedback
    if (haptic) {
      vibrate(10);
    }

    onClick?.(e);
  };

  // Size classes (minimum 44px height)
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 text-sm',
    md: 'min-h-[48px] px-6 text-base',
    lg: 'min-h-[56px] px-8 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white',
    success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 active:bg-gray-700 text-gray-300 border border-gray-700',
  };

  const baseClasses = `
    font-semibold rounded-lg
    transition-all duration-150
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    touch-manipulation
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={baseClasses.trim()}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Yükleniyor...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
