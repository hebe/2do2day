import { supabase } from './supabase'

const SCHEMA_VERSION = 1

/**
 * Load user data from Supabase
 * This is the ONLY way to get data - cloud is source of truth
 */
export async function loadFromCloud() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[CloudSync] loadFromCloud: Not authenticated')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('[CloudSync] Loading from cloud for user:', user.id)

    const { data, error } = await supabase
      .from('user_data')
      .select('data, schema_version, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // No data found = new user, that's OK
      if (error.code === 'PGRST116') {
        console.log('[CloudSync] No cloud data found (new user)')
        return { success: true, data: null, isNewUser: true }
      }
      console.error('[CloudSync] Error loading from cloud:', error)
      return { success: false, error: error.message }
    }

    console.log('[CloudSync] Loaded from cloud:', {
      todayCount: data.data?.today?.length || 0,
      backlogCount: data.data?.backlog?.length || 0,
      recurringCount: data.data?.recurring?.length || 0,
      updatedAt: data.updated_at
    })

    return {
      success: true,
      data: data.data,
      updatedAt: data.updated_at,
      schemaVersion: data.schema_version
    }
  } catch (error) {
    console.error('[CloudSync] Exception in loadFromCloud:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Save user data to Supabase
 * Only call this AFTER a successful load, and only with intentional user changes
 */
export async function saveToCloud(data) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[CloudSync] saveToCloud: Not authenticated')
      return { success: false, error: 'Not authenticated' }
    }

    // Sanity check - don't save empty/smaller data if cloud has more data.
    // Tombstones count as "items accounted for" so legitimate cross-device
    // deletes (which shrink the local lists) aren't blocked.
    const tombstoneCount = data._tombstones?.length || 0
    const totalItems = (data.today?.length || 0) +
                       (data.backlog?.length || 0) +
                       (data.recurring?.length || 0) +
                       (data.done?.length || 0) +
                       tombstoneCount

    // Always check cloud before saving to prevent data loss
    const { data: existing } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', user.id)
      .single()

    if (existing?.data) {
      const cloudTombstoneCount = existing.data._tombstones?.length || 0
      const cloudTotal = (existing.data.today?.length || 0) +
                        (existing.data.backlog?.length || 0) +
                        (existing.data.recurring?.length || 0) +
                        (existing.data.done?.length || 0) +
                        cloudTombstoneCount

      // Block if we're about to lose significant data (more than 2 items)
      if (cloudTotal > 0 && totalItems < cloudTotal - 2) {
        console.error('[CloudSync] BLOCKED: Would lose data!', {
          cloudTotal,
          localTotal: totalItems,
          wouldLose: cloudTotal - totalItems
        })
        return { success: false, error: 'Refusing to save - would lose data' }
      }

      // Also block completely empty saves when cloud has any data
      if (totalItems === 0 && cloudTotal > 0) {
        console.error('[CloudSync] BLOCKED: Refusing to overwrite cloud data with empty state!', {
          cloudTotal,
          localTotal: totalItems
        })
        return { success: false, error: 'Refusing to save empty data over existing data' }
      }
    }

    console.log('[CloudSync] Saving to cloud for user:', user.id, {
      todayCount: data.today?.length || 0,
      backlogCount: data.backlog?.length || 0,
      recurringCount: data.recurring?.length || 0
    })

    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        data: {
          today: data.today || [],
          backlog: data.backlog || [],
          recurring: data.recurring || [],
          done: data.done || [],
          _tombstones: data._tombstones || [],
          settings: data.settings || {}
        },
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
    console.error('[CloudSync] Exception in saveToCloud:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete user's cloud data
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
      console.error('[CloudSync] Error deleting cloud data:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[CloudSync] Exception in deleteCloudData:', error)
    return { success: false, error: error.message }
  }
}
