'use client'

import { useEffect } from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const isNeonNoir = process.env.NEXT_PUBLIC_NEON_NOIR_THEME === '1'

  useEffect(() => {
    if (isNeonNoir) {
      document.documentElement.classList.add('theme-neon-noir')
      document.body.classList.add('theme-neon-noir')
    } else {
      document.documentElement.classList.remove('theme-neon-noir')
      document.body.classList.remove('theme-neon-noir')
    }

    return () => {
      document.documentElement.classList.remove('theme-neon-noir')
      document.body.classList.remove('theme-neon-noir')
    }
  }, [isNeonNoir])

  return <>{children}</>
}