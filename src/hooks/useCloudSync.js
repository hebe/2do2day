import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { loadFromCloud, saveToCloud } from '../lib/cloudSync'

/**
 * ULTRA SIMPLE cloud sync hook - NO automatic syncing
 *
 * Only syncs when:
 * 1. User first logs in (load from cloud)
 * 2. User explicitly makes a change (debounced save)
 *
 * NO visibility change syncing
 * NO online/offline syncing
 */
export function useCloudSync(session, debounceMs = 2000) {
  const hasLoadedFromCloudRef = useRef(false)
  const syncTimeoutRef = useRef(null)
  const lastSyncedDataRef = useRef(null)
  const isLoadingRef = useRef(false)

  // Get store actions
  const setCloudSyncReady = useStore((state) => state.setCloudSyncReady)
  const cloudSyncReady = useStore((state) => state._cloudSyncReady)

  // Get data for change detection
  const today = useStore((state) => state.today)
  const backlog = useStore((state) => state.backlog)
  const recurring = useStore((state) => state.recurring)
  const done = useStore((state) => state.done)
  const tombstones = useStore((state) => state._tombstones)
  const settings = useStore((state) => state.settings)

  // Load from cloud and apply to store
  const loadAndApply = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('[useCloudSync] Already loading, skipping')
      return false
    }

    isLoadingRef.current = true
    console.log('[useCloudSync] Loading from cloud...')

    try {
      const result = await loadFromCloud()

      if (!result.success) {
        console.error('[useCloudSync] Failed to load:', result.error)
        return false
      }

      if (result.data) {
        console.log('[useCloudSync] Got cloud data:', {
          todayCount: result.data.today?.length || 0,
          backlogCount: result.data.backlog?.length || 0
        })

        const normalizedData = {
          today: result.data.today || [],
          backlog: result.data.backlog || [],
          recurring: result.data.recurring || [],
          done: result.data.done || [],
          _tombstones: result.data._tombstones || [],
          settings: result.data.settings || {}
        }

        // Set the "last synced" BEFORE updating state to prevent sync loop
        lastSyncedDataRef.current = JSON.stringify(normalizedData)

        // Apply to store
        useStore.setState(normalizedData)

        hasLoadedFromCloudRef.current = true
        console.log('[useCloudSync] Applied cloud data to store')

      } else if (result.isNewUser) {
        console.log('[useCloudSync] New user detected')
        hasLoadedFromCloudRef.current = true

        // For new users, save current state to cloud
        const currentState = useStore.getState()
        const dataToSync = {
          today: currentState.today || [],
          backlog: currentState.backlog || [],
          recurring: currentState.recurring || [],
          done: currentState.done || [],
          _tombstones: currentState._tombstones || [],
          settings: currentState.settings || {}
        }

        lastSyncedDataRef.current = JSON.stringify(dataToSync)
        await saveToCloud(dataToSync)
        console.log('[useCloudSync] Saved initial data for new user')
      }

      return true
    } finally {
      isLoadingRef.current = false
    }
  }, [])

  // Save current state to cloud
  const syncCurrentState = useCallback(async () => {
    if (!hasLoadedFromCloudRef.current) {
      console.log('[useCloudSync] BLOCKED: Not loaded from cloud yet')
      return { success: false, error: 'Not loaded yet' }
    }

    const currentState = useStore.getState()
    const dataToSync = {
      today: currentState.today || [],
      backlog: currentState.backlog || [],
      recurring: currentState.recurring || [],
      done: currentState.done || [],
      _tombstones: currentState._tombstones || [],
      settings: currentState.settings || {}
    }

    const currentDataString = JSON.stringify(dataToSync)

    // Check if data actually changed
    if (currentDataString === lastSyncedDataRef.current) {
      console.log('[useCloudSync] Data unchanged, skipping sync')
      return { success: true, skipped: true }
    }

    console.log('[useCloudSync] Saving to cloud:', {
      todayCount: dataToSync.today.length,
      backlogCount: dataToSync.backlog.length
    })

    const result = await saveToCloud(dataToSync)

    if (result.success) {
      lastSyncedDataRef.current = currentDataString
      console.log('[useCloudSync] Save successful')
    } else {
      console.error('[useCloudSync] Save failed:', result.error)
    }

    return result
  }, [])

  // Initial load on login - ONLY ONCE
  useEffect(() => {
    if (!session) {
      // Reset on logout
      hasLoadedFromCloudRef.current = false
      lastSyncedDataRef.current = null
      isLoadingRef.current = false
      setCloudSyncReady(false)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
      return
    }

    if (hasLoadedFromCloudRef.current) {
      console.log('[useCloudSync] Already loaded, skipping init')
      return
    }

    const init = async () => {
      console.log('[useCloudSync] Initializing for user:', session.user.id)
      const success = await loadAndApply()
      if (success) {
        console.log('[useCloudSync] Ready')
        setCloudSyncReady(true)
      }
    }

    init()
  }, [session, loadAndApply, setCloudSyncReady])

  // Sync on data changes - debounced, only after initial load
  useEffect(() => {
    if (!session) return
    if (!cloudSyncReady) return
    if (!hasLoadedFromCloudRef.current) return
    if (!lastSyncedDataRef.current) return

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Debounce the sync
    syncTimeoutRef.current = setTimeout(() => {
      syncCurrentState()
    }, debounceMs)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [today, backlog, recurring, done, tombstones, settings, session, cloudSyncReady, syncCurrentState, debounceMs])

  // NO visibility change handler
  // NO online/offline handler

  return {
    manualSync: syncCurrentState,
    reload: loadAndApply,
    isReady: cloudSyncReady
  }
}
