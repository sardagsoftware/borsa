'use client'

import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
          },
        }}
      />
    </>
  )
}