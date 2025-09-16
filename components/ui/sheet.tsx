/**
 * 📱 Mobile Sheet Component - Bottom drawer/modal for mobile interactions
 * Optimized for thumb zones and smooth animations
 */

'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
  className?: string;
}

export function Sheet({ 
  isOpen, 
  onClose, 
  children, 
  title,
  snapPoints = [0.3, 0.6, 0.9],
  defaultSnap = 1,
  className = '' 
}: SheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Touch handlers for drag gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) { // Only allow downward drag
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Determine snap point based on drag distance
    if (dragOffset > 100) {
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onClose();
      }
    } else if (dragOffset < -100) {
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
    }
    
    setDragOffset(0);
  };

  const currentHeight = snapPoints[currentSnap];
  const translateY = isDragging ? dragOffset : 0;

  if (!isOpen) return null;

  const sheetContent = (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0 
          bg-white dark:bg-gray-900 
          rounded-t-xl shadow-2xl
          transition-transform duration-300 ease-out
          ${isDragging ? 'duration-0' : ''}
          ${className}
        `}
        style={{
          height: `${currentHeight * 100}%`,
          transform: `translateY(${translateY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center p-3">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          {children}
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-bottom" />
      </div>
    </div>
  );

  // Portal for better z-index management
  if (typeof window !== 'undefined') {
    return createPortal(sheetContent, document.body);
  }

  return null;
}

// Quick action sheet for common mobile patterns
interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'primary';
    disabled?: boolean;
  }>;
}

export function QuickActionSheet({ isOpen, onClose, actions }: QuickActionSheetProps) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} snapPoints={[0.3]} defaultSnap={0}>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
            className={`
              w-full flex items-center gap-3 p-4 rounded-lg
              font-medium text-left transition-colors
              ${action.variant === 'danger' 
                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                : action.variant === 'primary'
                ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {action.icon && (
              <span className="flex-shrink-0 w-5 h-5">
                {action.icon}
              </span>
            )}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export default Sheet;
