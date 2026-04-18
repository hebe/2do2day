import { useEffect, useState } from 'react'
import useStore from '../store/useStore'

export function useDarkMode() {
  const { settings } = useStore()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const applyDark = (on, variant = 'dark') => {
      const root = document.documentElement
      if (on) {
        root.classList.add('dark')
        if (variant === 'dark-2') root.classList.add('dark-2')
        else root.classList.remove('dark-2')
      } else {
        root.classList.remove('dark', 'dark-2')
      }
      setIsDark(on)
    }

    const updateDarkMode = () => {
      const mode = settings.colorMode || 'auto'

      if (mode === 'dark') {
        applyDark(true, 'dark')
      } else if (mode === 'dark-2') {
        applyDark(true, 'dark-2')
      } else if (mode === 'light') {
        applyDark(false)
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        applyDark(prefersDark, 'dark')
      }
    }

    updateDarkMode()

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
