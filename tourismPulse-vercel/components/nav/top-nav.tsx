'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { AppIcon } from './app-icon'
import { StealthMenu } from './stealth-menu'

interface TopNavProps {
  className?: string
}

export function TopNav({ className = '' }: TopNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const isStealthNav = process.env.NEXT_PUBLIC_ENABLE_STEALTH_NAV === '1'
  const isNeonNoir = process.env.NEXT_PUBLIC_NEON_NOIR_THEME === '1'

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const themeClasses = isNeonNoir
    ? 'bg-gray-900/90 border-gray-700 text-gray-100'
    : 'bg-white/90 border-gray-200 text-gray-900'

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 h-16
        ${themeClasses} backdrop-blur-lg border-b
        ${className}
      `}
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {isStealthNav && (
              <div className="relative" ref={triggerRef}>
                <AppIcon
                  isMenuOpen={isMenuOpen}
                  onClick={toggleMenu}
                />
                <StealthMenu
                  isOpen={isMenuOpen}
                  onClose={closeMenu}
                  triggerRef={triggerRef}
                />
              </div>
            )}

            {/* Logo */}
            <Link
              href="/"
              className={`
                flex items-center gap-2 font-bold text-lg
                ${isNeonNoir ? 'text-white hover:text-gray-200' : 'text-gray-900 hover:text-gray-700'}
                transition-colors duration-200
              `}
            >
              <span className="text-2xl" role="img" aria-label="Ailydian">
                🌟
              </span>
              <span className="hidden sm:block">
                Ailydian
              </span>
            </Link>
          </div>

          {/* Center section - Search hint */}
          <div className="hidden md:flex items-center">
            <div className={`
              px-3 py-1.5 rounded-lg text-sm
              ${isNeonNoir
                ? 'bg-gray-800/50 text-gray-400 border border-gray-700'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
              }
            `}>
              Press <kbd className={`
                px-1.5 py-0.5 rounded text-xs font-mono
                ${isNeonNoir ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}
              `}>Alt+K</kbd> to search
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* User menu placeholder */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isNeonNoir
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
              cursor-pointer transition-colors duration-200
            `}>
              U
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}