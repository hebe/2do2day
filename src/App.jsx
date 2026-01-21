import React, { useState, useEffect } from 'react'
import TodayView from './components/TodayView'
import BacklogView from './components/BacklogView'
import SettingsView from './components/SettingsView'
import useStore from './store/useStore'
import useDarkMode from './hooks/useDarkMode'

function App() {
  const [currentView, setCurrentView] = useState('today')
  const { checkAndResetDay } = useStore()
  useDarkMode() // Initialize dark mode

  // Check for day reset on mount and every minute
  useEffect(() => {
    checkAndResetDay()
    
    const interval = setInterval(() => {
      checkAndResetDay()
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [checkAndResetDay])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-calm-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Navigation */}
      <nav className="border-b border-calm-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-6 md:gap-8">
            <button
              onClick={() => setCurrentView('today')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'today'
                  ? 'border-[#F0A500] text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentView('backlog')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'backlog'
                  ? 'border-[#F0A500] text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              Backlog
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'settings'
                  ? 'border-[#F0A500] text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Views */}
      {currentView === 'today' && <TodayView />}
      {currentView === 'backlog' && <BacklogView />}
      {currentView === 'settings' && <SettingsView />}
    </div>
  )
}

export default App
