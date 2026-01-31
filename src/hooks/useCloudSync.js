import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { loadFromCloud, saveToCloud } from '../lib/cloudSync'

/**
 * Simplified cloud sync hook
 *
 * Key principles:
 * 1. Cloud is source of truth - always load from cloud first on login
 * 2. NEVER sync to cloud until after successful cloud load
 * 3. Simple debounced sync for user changes after initial load
 */
export function useCloudSync(session, debounceMs = 1500) {
  const hasLoadedFromCloudRef = useRef(false)
  const syncTimeoutRef = useRef(null)
  const lastSyncedDataRef = useRef(null)
  const isLoadingRef = useRef(false)
  const skipNextSyncRef = useRef(false) // Skip sync right after loading

  // Get store actions
  const setCloudSyncReady = useStore((state) => state.setCloudSyncReady)
  const cloudSyncReady = useStore((state) => state._cloudSyncReady)

  // Get data for change detection
  const today = useStore((state) => state.today)
  const backlog = useStore((state) => state.backlog)
  const recurring = useStore((state) => state.recurring)
  const done = useStore((state) => state.done)
  const settings = useStore((state) => state.settings)

  // Load from cloud and apply to store
  const loadAndApply = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      console.log('[useCloudSync] Already loading, skipping')
      return false
    }

    isLoadingRef.current = true
    skipNextSyncRef.current = true // Prevent sync triggered by setState
    console.log('[useCloudSync] Loading from cloud...')

    try {
      const result = await loadFromCloud()

      if (!result.success) {
        console.error('[useCloudSync] Failed to load:', result.error)
        skipNextSyncRef.current = false
        return false
      }

      if (result.data) {
        console.log('[useCloudSync] Applying cloud data to store:', {
          todayCount: result.data.today?.length || 0,
          backlogCount: result.data.backlog?.length || 0
        })

        // Build the normalized data object
        const normalizedData = {
          today: result.data.today || [],
          backlog: result.data.backlog || [],
          recurring: result.data.recurring || [],
          done: result.data.done || [],
          settings: result.data.settings || {}
        }

        // Remember what we loaded BEFORE setting state
        // This prevents the sync effect from thinking data changed
        lastSyncedDataRef.current = JSON.stringify(normalizedData)

        // Directly set the store state from cloud data
        useStore.setState(normalizedData)

        hasLoadedFromCloudRef.current = true

        // Keep skip flag on for a moment to let React settle
        setTimeout(() => {
          skipNextSyncRef.current = false
        }, 100)

      } else if (result.isNewUser) {
        console.log('[useCloudSync] New user - will sync current local data to cloud')
        hasLoadedFromCloudRef.current = true
        skipNextSyncRef.current = false

        // For new users, sync current local state to cloud
        const currentState = useStore.getState()
        const dataToSync = {
          today: currentState.today || [],
          backlog: currentState.backlog || [],
          recurring: currentState.recurring || [],
          done: currentState.done || [],
          settings: currentState.settings || {}
        }

        const saveResult = await saveToCloud(dataToSync)
        if (saveResult.success) {
          console.log('[useCloudSync] Initial data synced to cloud for new user')
          lastSyncedDataRef.current = JSON.stringify(dataToSync)
        }
      }

      return true
    } finally {
      isLoadingRef.current = false
    }
  }, [])

  // Save current state to cloud
  const syncCurrentState = useCallback(async () => {
    // CRITICAL: Never sync before we've loaded from cloud
    if (!hasLoadedFromCloudRef.current) {
      console.log('[useCloudSync] BLOCKED: Cannot sync before loading from cloud')
      return { success: false, error: 'Not loaded from cloud yet' }
    }

    // Skip if we just loaded (prevents sync loop)
    if (skipNextSyncRef.current) {
      console.log('[useCloudSync] BLOCKED: Skipping sync right after load')
      return { success: false, error: 'Skipping post-load sync' }
    }

    const currentState = useStore.getState()

    const dataToSync = {
      today: currentState.today || [],
      backlog: currentState.backlog || [],
      recurring: currentState.recurring || [],
      done: currentState.done || [],
      settings: currentState.settings || {}
    }

    // Check if data actually changed from what we last synced
    const currentDataString = JSON.stringify(dataToSync)
    if (currentDataString === lastSyncedDataRef.current) {
      console.log('[useCloudSync] Data unchanged, skipping sync')
      return { success: true, skipped: true }
    }

    console.log('[useCloudSync] Syncing to cloud...', {
      todayCount: dataToSync.today.length,
      backlogCount: dataToSync.backlog.length
    })

    const result = await saveToCloud(dataToSync)

    if (result.success) {
      lastSyncedDataRef.current = currentDataString
      console.log('[useCloudSync] Sync successful')
    } else {
      console.error('[useCloudSync] Sync failed:', result.error)
    }

    return result
  }, [])

  // Debounced sync
  const debouncedSync = useCallback(() => {
    // Extra safety checks
    if (!hasLoadedFromCloudRef.current) {
      console.log('[useCloudSync] BLOCKED debounced sync: not loaded yet')
      return
    }

    if (skipNextSyncRef.current) {
      console.log('[useCloudSync] BLOCKED debounced sync: skip flag set')
      return
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncCurrentState()
    }, debounceMs)
  }, [syncCurrentState, debounceMs])

  // Initial load on login
  useEffect(() => {
    if (!session) {
      // Reset everything on logout
      hasLoadedFromCloudRef.current = false
      lastSyncedDataRef.current = null
      isLoadingRef.current = false
      skipNextSyncRef.current = false
      setCloudSyncReady(false)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
      return
    }

    // Only load once per session
    if (hasLoadedFromCloudRef.current) return

    const init = async () => {
      console.log('[useCloudSync] Initializing for user:', session.user.id)

      const success = await loadAndApply()

      if (success) {
        console.log('[useCloudSync] Cloud sync ready - syncing now enabled')
        setCloudSyncReady(true)
      }
    }

    init()
  }, [session, loadAndApply, setCloudSyncReady])

  // Sync on data changes (only after initial load)
  useEffect(() => {
    // Multiple safety checks
    if (!session) return
    if (!cloudSyncReady) return
    if (!hasLoadedFromCloudRef.current) return
    if (!lastSyncedDataRef.current) return
    if (skipNextSyncRef.current) return // Don't sync right after load

    debouncedSync()

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [today, backlog, recurring, done, settings, session, cloudSyncReady, debouncedSync])

  // Sync when coming back online
  useEffect(() => {
    if (!session) return

    const handleOnline = async () => {
      console.log('[useCloudSync] Back online - reloading from cloud')
      await loadAndApply()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [session, loadAndApply])

  // Handle visibility change (user returns to tab)
  useEffect(() => {
    if (!session || !cloudSyncReady) return

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[useCloudSync] Tab became visible - checking for updates')
        await loadAndApply()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session, cloudSyncReady, loadAndApply])

  return {
    manualSync: syncCurrentState,
    reload: loadAndApply,
    isReady: cloudSyncReady
  }
}
