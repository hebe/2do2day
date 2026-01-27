import { supabase } from './supabase'

const SCHEMA_VERSION = 1

/**
 * Save the entire app state to Supabase
 * @param {Object} state - The Zustand store state
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveToCloud(state) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[CloudSync] saveToCloud: Not authenticated')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('[CloudSync] Saving to cloud for user:', user.id, {
      todayCount: state.today?.length || 0,
      backlogCount: state.backlog?.length || 0,
      recurringCount: state.recurring?.length || 0
    })

    // Prepare data for cloud storage
    const cloudData = {
      today: state.today,
      backlog: state.backlog,
      recurring: state.recurring,
      done: state.done,
      settings: state.settings
    }

    // Upsert user data
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        data: cloudData,
        schema_version: SCHEMA_VERSION
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('[CloudSync] Error saving to cloud:', error)
      return { success: false, error: error.message }
    }

    console.log('[CloudSync] Successfully saved to cloud')
    return { success: true }
  } catch (error) {
    console.error('[CloudSync] Error in saveToCloud:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load app state from Supabase
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadFromCloud() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[CloudSync] loadFromCloud: Not authenticated')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('[CloudSync] Loading from cloud for user:', user.id)

    const { data, error } = await supabase
      .from('user_data')
      .select('data, schema_version, updated_at, user_id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no data found, that's okay (new user)
      if (error.code === 'PGRST116') {
        console.log('[CloudSync] No cloud data found (new user)')
        return { success: true, data: null }
      }
      console.error('[CloudSync] Error loading from cloud:', error)
      return { success: false, error: error.message }
    }

    // CRITICAL: Verify the data belongs to the current user
    if (data.user_id !== user.id) {
      console.error('[CloudSync] DATA MISMATCH! Loaded data for wrong user!', {
        currentUser: user.id,
        dataUser: data.user_id
      })
      return { success: false, error: 'User ID mismatch' }
    }

    console.log('[CloudSync] Loaded from cloud:', {
      todayCount: data.data.today?.length || 0,
      backlogCount: data.data.backlog?.length || 0,
      recurringCount: data.data.recurring?.length || 0,
      updatedAt: data.updated_at
    })

    // TODO: Handle schema migrations if schema_version differs
    if (data.schema_version !== SCHEMA_VERSION) {
      console.warn('[CloudSync] Schema version mismatch, migration needed')
      // For now, just use the data as-is
    }

    return {
      success: true,
      data: data.data,
      updatedAt: data.updated_at,
      userId: data.user_id
    }
  } catch (error) {
    console.error('[CloudSync] Error in loadFromCloud:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Migrate local storage data to cloud on first login
 * @param {Object} localState - Current state from localStorage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function migrateLocalToCloud(localState) {
  try {
    // Check if cloud data already exists
    const cloudResult = await loadFromCloud()

    if (cloudResult.success && cloudResult.data) {
      // Cloud data already exists, don't overwrite
      return { success: true, skipped: true, reason: 'Cloud data already exists' }
    }

    // No cloud data, migrate local data
    const saveResult = await saveToCloud(localState)

    if (saveResult.success) {
      return { success: true, migrated: true }
    }

    return saveResult
  } catch (error) {
    console.error('Error in migrateLocalToCloud:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if user has cloud data
 * @returns {Promise<boolean>}
 */
export async function hasCloudData() {
  const result = await loadFromCloud()
  return result.success && result.data !== null
}

/**
 * Delete user's cloud data (for account deletion)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCloudData() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('user_data')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting cloud data:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteCloudData:', error)
    return { success: false, error: error.message }
  }
}
