'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      // Alt+K to focus search (redirect to search page)
      if (event.altKey && event.key === 'k') {
        event.preventDefault()
        router.push('/search')

        // Focus the search input after navigation
        setTimeout(() => {
          const searchInput = document.querySelector('textarea[placeholder*="Mesajınızı yazın"]') as HTMLTextAreaElement
          if (searchInput) {
            searchInput.focus()
          }
        }, 100)
      }

      // Escape to close modals/dropdowns
      if (event.key === 'Escape') {
        // Close any open dropdowns or modals
        const openElements = document.querySelectorAll('[aria-expanded="true"]')
        openElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.click()
          }
        })
      }

      // Enter + Ctrl/Cmd to send message (handled in individual components)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const sendButton = document.querySelector('button[aria-label="Send message"], button:has([aria-label="Send message"])')
        if (sendButton instanceof HTMLElement) {
          sendButton.click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [router])
}