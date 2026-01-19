import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import TodayView from './components/TodayView'
import BacklogView from './components/BacklogView'
import SettingsView from './components/SettingsView'
import AuthView from './components/AuthView'
import useStore from './store/useStore'
import useDarkMode from './hooks/useDarkMode'

function App() {
  const [currentView, setCurrentView] = useState('today')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const { checkAndResetDay } = useStore()
  useDarkMode() // Initialize dark mode

  // Check for existing session and set up auth listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check for day reset on mount and every minute (only when signed in)
  useEffect(() => {
    if (!session) return

    checkAndResetDay()
    
    const interval = setInterval(() => {
      checkAndResetDay()
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [checkAndResetDay, session])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Session will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-calm-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-[#F0A500] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth view if not signed in
  if (!session) {
    return <AuthView />
  }

  // Main app (user is signed in)
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
                  ? 'border-[#F0A500] text-calm-700 dark:text-gray-100'
                  : 'border-transparent text-calm-600 dark:text-gray-400 hover:text-calm-700 dark:hover:text-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentView('backlog')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'backlog'
                  ? 'border-[#F0A500] text-calm-700 dark:text-gray-100'
                  : 'border-transparent text-calm-600 dark:text-gray-400 hover:text-calm-700 dark:hover:text-gray-300'
              }`}
            >
              Backlog
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'settings'
                  ? 'border-[#F0A500] text-calm-700 dark:text-gray-100'
                  : 'border-transparent text-calm-600 dark:text-gray-400 hover:text-calm-700 dark:hover:text-gray-300'
              }`}
            >
              Settings
            </button>

            {/* User menu */}
            <div className="ml-auto flex items-center">
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
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
