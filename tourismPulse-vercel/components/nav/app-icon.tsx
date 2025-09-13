'use client'

import { motion } from 'framer-motion'

interface AppIconProps {
  isMenuOpen?: boolean
  onClick?: () => void
  className?: string
}

export function AppIcon({ isMenuOpen, onClick, className = '' }: AppIconProps) {
  const isStealthNav = process.env.NEXT_PUBLIC_ENABLE_STEALTH_NAV === '1'

  if (!isStealthNav) return null

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600
        flex items-center justify-center text-white font-bold text-lg
        hover:from-blue-700 hover:to-purple-700 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label="Open navigation menu"
      aria-haspopup="menu"
      aria-expanded={isMenuOpen}
    >
      <motion.div
        animate={isMenuOpen ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.2 }}
      >
        🚀
      </motion.div>
    </motion.button>
  )
}