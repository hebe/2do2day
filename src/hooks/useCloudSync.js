import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { migrateLocalToCloud } from '../lib/cloudSync'
import { supabase } from '../lib/supabase'

/**
 * Custom hook to manage cloud synchronization
 * @param {Object} session - Supabase session object
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 2000)
 */
export function useCloudSync(session, debounceMs = 2000) {
  const syncToCloud = useStore((state) => state.syncToCloud)
  const loadFromCloudAndMerge = useStore((state) => state.loadFromCloudAndMerge)

  // Track sync state
  const syncTimeoutRef = useRef(null)
  const hasMigratedRef = useRef(false)
  const isInitialLoadRef = useRef(true)

  // Subscribe to entire store state for changes
  const storeState = useStore()

  // Debounced sync function
  const debouncedSync = useCallback(() => {
    if (!session) return

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Set new timeout
    syncTimeoutRef.current = setTimeout(async () => {
      const result = await syncToCloud()
      if (!result.success) {
        console.error('Failed to sync to cloud:', result.error)
      }
    }, debounceMs)
  }, [session, syncToCloud, debounceMs])

  // Initial load and migration on login
  useEffect(() => {
    if (!session || !isInitialLoadRef.current) return

    const initializeCloudSync = async () => {
      try {
        // First, try to load from cloud
        const loadResult = await loadFromCloudAndMerge()

        if (loadResult.success && loadResult.data) {
          console.log('Loaded data from cloud')
        } else if (loadResult.success && !loadResult.data) {
          // No cloud data exists, migrate local data
          if (!hasMigratedRef.current) {
            console.log('No cloud data found, migrating local data...')
            const migrateResult = await migrateLocalToCloud(storeState)

            if (migrateResult.success && migrateResult.migrated) {
              console.log('Successfully migrated local data to cloud')
              hasMigratedRef.current = true
            } else if (migrateResult.success && migrateResult.skipped) {
              console.log('Migration skipped:', migrateResult.reason)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing cloud sync:', error)
      } finally {
        isInitialLoadRef.current = false
      }
    }

    initializeCloudSync()
  }, [session, loadFromCloudAndMerge, storeState])

  // Sync on state changes (debounced)
  useEffect(() => {
    // Skip sync on initial load and when not logged in
    if (isInitialLoadRef.current || !session) return

    debouncedSync()

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [
    storeState.today,
    storeState.backlog,
    storeState.recurring,
    storeState.done,
    storeState.settings,
    debouncedSync,
    session
  ])

  // Sync when going online
  useEffect(() => {
    if (!session) return

    const handleOnline = () => {
      console.log('Back online, syncing to cloud...')
      syncToCloud()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [session, syncToCloud])

  // Real-time sync: Listen for changes from other devices
  useEffect(() => {
    if (!session) return

    console.log('[Realtime] Setting up real-time sync for user:', session.user.id)

    // Debounce real-time updates to avoid rapid consecutive reloads
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
          console.log('[Realtime] Received real-time update from another device:', {
            eventType: payload.eventType,
            userId: payload.new?.user_id,
            currentUser: session.user.id
          })

          // Verify the update is for the current user
          if (payload.new?.user_id !== session.user.id) {
            console.error('[Realtime] Ignoring update for different user!', {
              updateUser: payload.new?.user_id,
              currentUser: session.user.id
            })
            return
          }

          // Only reload if we're not currently in the middle of initial load
          if (isInitialLoadRef.current) {
            console.log('[Realtime] Skipping reload during initial load')
            return
          }

          // Debounce: wait 500ms before reloading in case multiple updates come in
          if (realtimeTimeout) {
            clearTimeout(realtimeTimeout)
          }

          realtimeTimeout = setTimeout(async () => {
            console.log('[Realtime] Loading updated data from cloud')
            await loadFromCloudAndMerge()
          }, 500)
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    return () => {
      console.log('[Realtime] Cleaning up real-time sync subscription')
      if (realtimeTimeout) {
        clearTimeout(realtimeTimeout)
      }
      supabase.removeChannel(channel)
    }
  }, [session, loadFromCloudAndMerge])

  // Return sync function for manual sync
  return {
    manualSync: syncToCloud
  }
}
