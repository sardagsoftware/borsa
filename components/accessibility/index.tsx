/**
 * ♿ AILYDIAN Accessibility - WCAG AA Compliance & Inclusive Design
 * Comprehensive accessibility utilities and components
 * © Emrah Şardağ. All rights reserved.
 */

"use client"

import { useEffect, useState, useRef, useCallback, ReactNode } from 'react'

// Focus management hook
export function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', trapFocus)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', trapFocus)
    }
  }, [active])

  return containerRef
}

// Reduced motion detection
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

// High contrast detection
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    
    setHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return highContrast
}

// Screen reader detection
export function useScreenReader(): boolean {
  const [screenReader, setScreenReader] = useState(false)

  useEffect(() => {
    // Detect screen reader by checking for specific properties
    const hasScreenReader = !!(
      navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA/) ||
      window.speechSynthesis ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    )
    
    setScreenReader(hasScreenReader)
  }, [])

  return screenReader
}

// Keyboard navigation hook
export function useKeyboardNavigation(onEscape?: () => void, onEnter?: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.()
          break
        case 'Enter':
          onEnter?.()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, onEnter])
}

// ARIA live region hook
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('')
    }, priority === 'assertive' ? 10000 : 7000)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { announce, announcement }
}

// Skip link component
interface SkipLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-brand1 text-bg px-4 py-2 rounded-lg font-medium z-50 
        focus:outline-none focus:ring-2 focus:ring-brand1/50 focus:ring-offset-2 focus:ring-offset-bg
        transition-all duration-smooth
        ${className}
      `}
    >
      {children}
    </a>
  )
}

// Screen reader only text component
interface SROnlyProps {
  children: ReactNode
}

export function SROnly({ children }: SROnlyProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// ARIA live region component
interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  className?: string
}

export function LiveRegion({ message, priority = 'polite', className = '' }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  )
}

// Focus visible utility
export function FocusVisible({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div 
      className={`
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand1/50 
        focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xl
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Color contrast utilities
export const colorContrast = {
  // WCAG AA minimum contrast ratio is 4.5:1
  // WCAG AAA preferred contrast ratio is 7:1
  
  checkContrast: (foreground: string, background: string): number => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    // Calculate relative luminance
    const getLuminance = (rgb: {r: number, g: number, b: number}) => {
      const rsRGB = rgb.r / 255
      const gsRGB = rgb.g / 255
      const bsRGB = rgb.b / 255

      const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
      const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
      const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const fgRgb = hexToRgb(foreground)
    const bgRgb = hexToRgb(background)

    if (!fgRgb || !bgRgb) return 0

    const fgLuminance = getLuminance(fgRgb)
    const bgLuminance = getLuminance(bgRgb)

    const brightest = Math.max(fgLuminance, bgLuminance)
    const darkest = Math.min(fgLuminance, bgLuminance)

    return (brightest + 0.05) / (darkest + 0.05)
  },

  isAACompliant: (foreground: string, background: string): boolean => {
    return colorContrast.checkContrast(foreground, background) >= 4.5
  },

  isAAACompliant: (foreground: string, background: string): boolean => {
    return colorContrast.checkContrast(foreground, background) >= 7
  }
}

// Accessible modal component
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function AccessibleModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}: AccessibleModalProps) {
  const modalRef = useFocusTrap(isOpen)
  const { announce } = useAnnouncement()

  useKeyboardNavigation(onClose)

  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`, 'assertive')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, title, announce])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className={`
          relative w-full max-w-md bg-panel rounded-2xl shadow-card border border-panel/30 p-6
          focus:outline-none focus:ring-2 focus:ring-brand1/50 focus:ring-offset-2 focus:ring-offset-bg
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-semibold text-gray-100 mb-4">
          {title}
        </h2>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-panel/50 focus:outline-none focus:ring-2 focus:ring-brand1/50"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {children}
      </div>
    </div>
  )
}

// Accessible form field component
interface AccessibleFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function AccessibleField({ 
  id, 
  label, 
  error, 
  hint, 
  required = false, 
  children, 
  className = '' 
}: AccessibleFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-200">
        {label}
        {required && (
          <span className="text-neg ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-400">
          {hint}
        </p>
      )}

      <div>
        {children}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-neg" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Export all utilities
const accessibilityUtils = {
  useFocusTrap,
  useReducedMotion,
  useHighContrast,
  useScreenReader,
  useKeyboardNavigation,
  useAnnouncement,
  colorContrast,
}

export default accessibilityUtils
