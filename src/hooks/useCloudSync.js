import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { migrateLocalToCloud } from '../lib/cloudSync'
import { supabase } from '../lib/supabase'

/**
 * Custom hook to manage cloud synchronization
 *
 * Key behaviors:
 * 1. On login: Load cloud data FIRST, then enable syncing
 * 2. On state changes: Sync to cloud (debounced) - but only after cloud load completed
 * 3. Real-time: Listen for changes from other devices and apply them
 * 4. Offline: Continue working locally, sync when back online
 *
 * @param {Object} session - Supabase session object
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 2000)
 */
export function useCloudSync(session, debounceMs = 2000) {
  // Select only the specific actions we need (not the whole store!)
  const syncToCloud = useStore((state) => state.syncToCloud)
  const loadFromCloudAndMerge = useStore((state) => state.loadFromCloudAndMerge)
  const setCloudSyncReady = useStore((state) => state.setCloudSyncReady)
  const cloudSyncReady = useStore((state) => state._cloudSyncReady)

  // Select data arrays for change detection (but NOT the whole store object)
  const today = useStore((state) => state.today)
  const backlog = useStore((state) => state.backlog)
  const recurring = useStore((state) => state.recurring)
  const done = useStore((state) => state.done)
  const settings = useStore((state) => state.settings)

  // Track sync state
  const syncTimeoutRef = useRef(null)
  const hasMigratedRef = useRef(false)
  const hasInitializedRef = useRef(false)
  const isSyncingFromRealtimeRef = useRef(false)

  // Debounced sync function
  const debouncedSync = useCallback(() => {
    if (!session) return

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Set new timeout
    syncTimeoutRef.current = setTimeout(async () => {
      // Double-check we're still ready (state might have changed)
      const currentState = useStore.getState()
      if (!currentState._cloudSyncReady) {
        console.log('[CloudSync] Skipping sync - not ready yet')
        return
      }

      const result = await syncToCloud()
      if (!result.success && result.error !== 'Cloud sync not ready') {
        console.error('[CloudSync] Failed to sync to cloud:', result.error)
      }
    }, debounceMs)
  }, [session, syncToCloud, debounceMs])

  // Initial load on login - this MUST complete before any syncing happens
  useEffect(() => {
    if (!session || hasInitializedRef.current) return

    const initializeCloudSync = async () => {
      console.log('[CloudSync] Initializing cloud sync for user:', session.user.id)
      hasInitializedRef.current = true

      try {
        // CRITICAL: Load from cloud FIRST
        const loadResult = await loadFromCloudAndMerge()

        if (loadResult.success && loadResult.data) {
          console.log('[CloudSync] Successfully loaded data from cloud:', {
            todayCount: loadResult.data.today?.length || 0,
            backlogCount: loadResult.data.backlog?.length || 0
          })
        } else if (loadResult.success && !loadResult.data) {
          // No cloud data exists - this is a new user or first sync
          // Migrate local data to cloud
          if (!hasMigratedRef.current) {
            console.log('[CloudSync] No cloud data found, migrating local data...')
            const currentState = useStore.getState()
            const migrateResult = await migrateLocalToCloud(currentState)

            if (migrateResult.success && migrateResult.migrated) {
              console.log('[CloudSync] Successfully migrated local data to cloud')
              hasMigratedRef.current = true
            } else if (migrateResult.success && migrateResult.skipped) {
              console.log('[CloudSync] Migration skipped:', migrateResult.reason)
            }
          }
        } else {
          console.error('[CloudSync] Failed to load from cloud:', loadResult.error)
          // Even on error, we might want to allow local-only operation
          // But we should NOT sync potentially stale local data to cloud
        }
      } catch (error) {
        console.error('[CloudSync] Error initializing cloud sync:', error)
      }
    }

    initializeCloudSync()
  }, [session, loadFromCloudAndMerge])

  // Reset initialization when session changes (logout/login)
  useEffect(() => {
    if (!session) {
      hasInitializedRef.current = false
      hasMigratedRef.current = false
      setCloudSyncReady(false)
    }
  }, [session, setCloudSyncReady])

  // Sync on state changes (debounced) - ONLY after cloud load completed
  useEffect(() => {
    // Skip if not logged in or cloud sync not ready
    if (!session || !cloudSyncReady) {
      return
    }

    // Skip if this change came from a real-time update (avoid sync loop)
    if (isSyncingFromRealtimeRef.current) {
      return
    }

    debouncedSync()

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [today, backlog, recurring, done, settings, debouncedSync, session, cloudSyncReady])

  // Sync when going online
  useEffect(() => {
    if (!session) return

    const handleOnline = async () => {
      console.log('[CloudSync] Back online')

      // When coming back online, load from cloud first to get any updates
      // that happened while we were offline
      const loadResult = await loadFromCloudAndMerge()

      if (loadResult.success) {
        console.log('[CloudSync] Loaded latest data after coming online')
        // After loading, sync our local changes (if any)
        // The debounced sync will handle this naturally
      }
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [session, loadFromCloudAndMerge])

  // Real-time sync: Listen for changes from other devices
  useEffect(() => {
    if (!session) return

    console.log('[Realtime] Setting up real-time sync for user:', session.user.id)

    let realtimeTimeout = null

    const channel = supabase
      .channel('user_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_data',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('[Realtime] Received update:', {
            eventType: payload.eventType,
            userId: payload.new?.user_id
          })

          // Verify the update is for the current user
          if (payload.new?.user_id !== session.user.id) {
            console.error('[Realtime] Ignoring update for different user!')
            return
          }

          // Debounce real-time updates
          if (realtimeTimeout) {
            clearTimeout(realtimeTimeout)
          }

          realtimeTimeout = setTimeout(async () => {
            console.log('[Realtime] Applying update from another device')

            // Mark that we're syncing from real-time to prevent sync loop
            isSyncingFromRealtimeRef.current = true

            try {
              await loadFromCloudAndMerge()
            } finally {
              // Reset the flag after a short delay to allow the state to settle
              setTimeout(() => {
                isSyncingFromRealtimeRef.current = false
              }, 100)
            }
          }, 500)
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    return () => {
      console.log('[Realtime] Cleaning up subscription')
      if (realtimeTimeout) {
        clearTimeout(realtimeTimeout)
      }
      supabase.removeChannel(channel)
    }
  }, [session, loadFromCloudAndMerge])

  // Return sync function for manual sync
  return {
    manualSync: syncToCloud,
    isReady: cloudSyncReady
  }
}
