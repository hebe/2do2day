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
  const loadFromCloudAndMerge = useStore((state) => state.loadFromCloudAndMerge)
  const cloudSyncReady = useStore((state) => state._cloudSyncReady)
  useDarkMode() // Initialize dark mode
  useCloudSync(session) // Initialize cloud sync

  // Re-sync from cloud when the tab regains focus or becomes visible.
  // Initial cloud load only runs once on login, so without this, another
  // device/tab can leave this tab with stale state and overwrite cloud
  // changes (e.g. items marked done elsewhere reappearing).
  useEffect(() => {
    if (!session || !cloudSyncReady) return

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        loadFromCloudAndMerge().catch((err) =>
          console.error('[App] Cloud refresh failed:', err)
        )
      }
    }

    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [session, cloudSyncReady, loadFromCloudAndMerge])

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
          <div className="flex items-center gap-6 md:gap-8">
            <button
              onClick={() => setCurrentView('today')}
              aria-label="Go to Today"
              className="mr-auto py-4 flex items-center gap-2 font-display text-xl md:text-2xl font-semibold text-ink hover:opacity-80 transition-opacity"
            >
              <svg
                className="logo-mark w-7 h-5 md:w-8 md:h-6"
                viewBox="0 0 32 20"
                aria-hidden="true"
              >
                <circle className="logo-accent" cx="10" cy="10" r="10" />
                <circle className="logo-mono"   cx="22" cy="10" r="10" />
              </svg>
              2do2day
            </button>
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
          </div>
        </div>
      </nav>

      {/* Views */}
      {currentView === 'today' && <TodayView />}
      {currentView === 'backlog' && <BacklogView />}
      {currentView === 'matrix' && <MatrixView />}
      {currentView === 'settings' && <SettingsView onSignOut={handleSignOut} />}

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  )
}

export default App
