/**
 * Utility functions for recurring tasks
 */

/**
 * Check if a recurring task is "ready" to be added to Today
 * A task is ready if it matches today's schedule and hasn't been added yet today
 *
 * @param {Object} recurringTask - The recurring task to check
 * @param {string} dayStartTime - The day start time from settings (e.g., "05:00")
 * @returns {boolean} - True if the task is ready to be added
 */
export function isRecurringTaskReady(recurringTask, dayStartTime) {
  const now = new Date()
  const [hours, minutes] = dayStartTime.split(':').map(Number)

  // Create today's day-start time
  const todayDayStart = new Date(now)
  todayDayStart.setHours(hours, minutes, 0, 0)

  // If current time is before today's day-start, we're still in "yesterday"
  if (now < todayDayStart) {
    todayDayStart.setDate(todayDayStart.getDate() - 1)
  }

  // Check if task was already added today (after the day-start time)
  if (recurringTask.lastAddedToToday) {
    const lastAdded = new Date(recurringTask.lastAddedToToday)
    if (lastAdded >= todayDayStart) {
      return false // Already added today
    }
  }

  // Check if today matches the recurrence pattern
  return matchesRecurrencePattern(recurringTask, now)
}

/**
 * Check if today matches the recurring task's pattern
 *
 * @param {Object} recurringTask - The recurring task
 * @param {Date} date - The date to check (usually now)
 * @returns {boolean} - True if today matches the pattern
 */
function matchesRecurrencePattern(recurringTask, date) {
  const { recurrencePattern, recurrenceDays } = recurringTask

  if (!recurrencePattern) return false

  switch (recurrencePattern) {
    case 'daily':
      return true // Every day

    case 'weekly': {
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      return recurrenceDays && recurrenceDays.includes(dayOfWeek)
    }

    case 'monthly': {
      const dayOfMonth = date.getDate() // 1-31
      return recurrenceDays && recurrenceDays.includes(dayOfMonth)
    }

    default:
      return false
  }
}

/**
 * Get all recurring tasks that are ready to be added today
 *
 * @param {Array} recurringTasks - All recurring tasks
 * @param {string} dayStartTime - The day start time from settings
 * @returns {Array} - Array of ready recurring tasks
 */
export function getReadyRecurringTasks(recurringTasks, dayStartTime) {
  if (!recurringTasks || recurringTasks.length === 0) {
    return []
  }

  return recurringTasks.filter(task =>
    isRecurringTaskReady(task, dayStartTime)
  )
}

/**
 * Get a human-readable description of the recurrence pattern
 *
 * @param {Object} recurringTask - The recurring task
 * @returns {string} - Description like "Every Wednesday" or "Daily"
 */
export function getRecurrenceDescription(recurringTask) {
  const { recurrencePattern, recurrenceDays } = recurringTask

  if (!recurrencePattern) return 'No schedule'

  switch (recurrencePattern) {
    case 'daily':
      return 'Daily'

    case 'weekly': {
      if (!recurrenceDays || recurrenceDays.length === 0) return 'Weekly'

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const selectedDays = recurrenceDays.map(d => dayNames[d])

      if (selectedDays.length === 1) {
        return `Every ${selectedDays[0]}`
      } else if (selectedDays.length === 7) {
        return 'Daily'
      } else {
        return `Every ${selectedDays.join(', ')}`
      }
    }

    case 'monthly': {
      if (!recurrenceDays || recurrenceDays.length === 0) return 'Monthly'

      const ordinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd']
        const v = n % 100
        return n + (s[(v - 20) % 10] || s[v] || s[0])
      }

      const selectedDays = recurrenceDays.map(d => ordinal(d))

      if (selectedDays.length === 1) {
        return `${selectedDays[0]} of each month`
      } else {
        return `${selectedDays.join(', ')} of each month`
      }
    }

    default:
      return 'Custom schedule'
  }
}
