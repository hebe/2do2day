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
      return { success: false, error: 'Not authenticated' }
    }

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
      console.error('Error saving to cloud:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in saveToCloud:', error)
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
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('user_data')
      .select('data, schema_version, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no data found, that's okay (new user)
      if (error.code === 'PGRST116') {
        return { success: true, data: null }
      }
      console.error('Error loading from cloud:', error)
      return { success: false, error: error.message }
    }

    // TODO: Handle schema migrations if schema_version differs
    if (data.schema_version !== SCHEMA_VERSION) {
      console.warn('Schema version mismatch, migration needed')
      // For now, just use the data as-is
    }

    return {
      success: true,
      data: data.data,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Error in loadFromCloud:', error)
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
