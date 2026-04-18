import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import TodayView from './components/TodayView'
import BacklogView from './components/BacklogView'
import MatrixView from './components/MatrixView'
import SettingsView from './components/SettingsView'
import OfflineIndicator from './components/OfflineIndicator'
import AuthView from './components/AuthView'
import useStore from './store/useStore'
import useDarkMode from './hooks/useDarkMode'
import { useCloudSync } from './hooks/useCloudSync'

function App() {
  const [currentView, setCurrentView] = useState('today')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const checkAndResetDay = useStore((state) => state.checkAndResetDay)
  const cloudSyncReady = useStore((state) => state._cloudSyncReady)
  useDarkMode() // Initialize dark mode
  useCloudSync(session) // Initialize cloud sync

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

  // Check for day reset on mount and every minute
  // IMPORTANT: Only run after cloud data is loaded to avoid resetting stale data
  useEffect(() => {
    if (!session || !cloudSyncReady) return

    checkAndResetDay()

    const interval = setInterval(() => {
      checkAndResetDay()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [checkAndResetDay, session, cloudSyncReady])

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
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-edge border-t-brand rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-muted">Loading...</p>
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
    <div className="min-h-screen bg-page transition-colors">
      {/* Navigation */}
      <nav className="border-b border-edge surface-nav backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-6 md:gap-8">
            <button
              onClick={() => setCurrentView('today')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'today'
                  ? 'border-brand text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentView('backlog')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'backlog'
                  ? 'border-brand text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              }`}
            >
              Backlog
            </button>
            <button
              onClick={() => setCurrentView('matrix')}
              className={`hidden md:block py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'matrix'
                  ? 'border-brand text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              }`}
            >
              Matrix
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'settings'
                  ? 'border-brand text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              }`}
            >
              Settings
            </button>

            {/* User menu */}
            <div className="ml-auto flex items-center">
              <button
                onClick={handleSignOut}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
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
      {currentView === 'matrix' && <MatrixView />}
      {currentView === 'settings' && <SettingsView />}

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  )
}

export default App
