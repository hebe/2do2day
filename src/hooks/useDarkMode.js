import { useEffect, useState } from 'react'
import useStore from '../store/useStore'

export function useDarkMode() {
  const { settings } = useStore()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateDarkMode = () => {
      const mode = settings.colorMode || 'auto'
      
      if (mode === 'dark') {
        setIsDark(true)
        document.documentElement.classList.add('dark')
      } else if (mode === 'light') {
        setIsDark(false)
        document.documentElement.classList.remove('dark')
      } else {
        // Auto mode - follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
        if (prefersDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    updateDarkMode()

    // Listen for system preference changes (only in auto mode)
    if (settings.colorMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => updateDarkMode()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [settings.colorMode])

  return isDark
}

export default useDarkMode
