'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface RegimeContextType {
  regime: string
  setRegime: (regime: string) => void
  isLoading: boolean
}

const RegimeContext = createContext<RegimeContextType | undefined>(undefined)

export const useRegime = () => {
  const context = useContext(RegimeContext)
  if (context === undefined) {
    // Return default values for SSR/Static generation instead of throwing
    if (typeof window === 'undefined') {
      return {
        regime: 'bull' as string,
        setRegime: () => {},
        isLoading: false
      }
    }
    // Only throw error on client-side when Provider is actually missing
    throw new Error('useRegime must be used within a RegimeProvider')
  }
  return context
}

interface RegimeProviderProps {
  children: ReactNode
}

export const RegimeProvider: React.FC<RegimeProviderProps> = ({ children }) => {
  const [regime, setRegime] = useState('bull')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize with default regime
    setIsLoading(false)
  }, [])

  const value = {
    regime,
    setRegime,
    isLoading
  }

  return (
    <RegimeContext.Provider value={value}>
      {children}
    </RegimeContext.Provider>
  )
}
