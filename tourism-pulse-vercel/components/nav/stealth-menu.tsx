'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigationConfig, NavigationItem } from '@/lib/navigation-config'

interface StealthMenuProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLElement>
}

export function StealthMenu({ isOpen, onClose, triggerRef }: StealthMenuProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isStealthNav = process.env.NEXT_PUBLIC_ENABLE_STEALTH_NAV === '1'
  const isNeonNoir = process.env.NEXT_PUBLIC_NEON_NOIR_THEME === '1'

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, triggerRef])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Handle Alt+M keyboard shortcut
  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.altKey && event.key === 'm') {
        event.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [isOpen, onClose])

  if (!isStealthNav) return null

  const themeClasses = isNeonNoir
    ? 'bg-gray-900/95 border-gray-700 text-gray-100'
    : 'bg-white/95 border-gray-200 text-gray-900'

  const itemHoverClasses = isNeonNoir
    ? 'hover:bg-gray-800/80 hover:text-white'
    : 'hover:bg-gray-50 hover:text-gray-900'

  const activeClasses = isNeonNoir
    ? 'bg-gray-800 text-white border-l-2 border-l-blue-400'
    : 'bg-blue-50 text-blue-700 border-l-2 border-l-blue-500'

  const renderNavItem = (item: NavigationItem, level = 0) => {
    const isActive = pathname === item.href
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItem === item.id

    return (
      <div key={item.id}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.2,
            delay: level * 0.05,
            ease: 'easeOut'
          }}
          whileHover={{ x: 4 }}
          className={`
            group relative flex items-center justify-between px-4 py-3 rounded-lg
            transition-all duration-200 cursor-pointer
            ${level > 0 ? 'ml-6' : ''}
            ${isActive ? activeClasses : itemHoverClasses}
            ${isNeonNoir && isActive ? 'shadow-md shadow-blue-500/20' : ''}
          `}
          onClick={() => {
            if (hasChildren) {
              setExpandedItem(isExpanded ? null : item.id)
            }
          }}
          role="menuitem"
          aria-haspopup={hasChildren ? 'menu' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {hasChildren ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-lg" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className={`text-xs ${isNeonNoir ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={isNeonNoir ? 'text-gray-400' : 'text-gray-400'}
              >
                ▼
              </motion.div>
            </div>
          ) : (
            <Link
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 w-full"
            >
              <span className="text-lg" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <div>
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className={`text-xs ${isNeonNoir ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          )}
        </motion.div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="py-2">
                {item.children?.map((child) => renderNavItem(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            ref={menuRef}
            initial={{
              opacity: 0,
              scale: 0.95,
              y: -10
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: -10
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut'
            }}
            className={`
              absolute top-full left-0 mt-2 w-80 max-h-[80vh] overflow-y-auto
              ${themeClasses} backdrop-blur-lg border rounded-xl shadow-2xl z-50
              scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
              ${isNeonNoir ? 'scrollbar-thumb-gray-600' : 'scrollbar-thumb-gray-300'}
            `}
            role="menu"
            aria-label="Navigation menu"
          >
            <div className="p-4 space-y-1">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isNeonNoir ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Navigation
              </div>

              {navigationConfig.map((item) => renderNavItem(item))}

              <div className={`border-t pt-3 mt-4 ${
                isNeonNoir ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`text-xs ${isNeonNoir ? 'text-gray-500' : 'text-gray-400'} text-center`}>
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">Alt+M</kbd> to toggle
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}