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
  const { recurrencePattern, recurrenceDays, createdAt } = recurringTask

  if (!recurrencePattern) return false

  switch (recurrencePattern) {
    case 'daily':
      return true // Every day

    case 'weekdays': {
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
    }

    case 'weekly': {
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      return recurrenceDays && recurrenceDays.includes(dayOfWeek)
    }

    case 'biweekly': {
      const dayOfWeek = date.getDay()
      if (!recurrenceDays || !recurrenceDays.includes(dayOfWeek)) {
        return false
      }

      // Check if it's been 2 weeks since creation or last added
      const referenceDate = recurringTask.lastAddedToToday
        ? new Date(recurringTask.lastAddedToToday)
        : createdAt ? new Date(createdAt) : date

      const daysDiff = Math.floor((date - referenceDate) / (1000 * 60 * 60 * 24))
      return daysDiff >= 14
    }

    case 'monthly': {
      const dayOfMonth = date.getDate() // 1-31
      return recurrenceDays && recurrenceDays.includes(dayOfMonth)
    }

    case 'yearly': {
      if (!recurrenceDays || recurrenceDays.length === 0) return false

      // recurrenceDays stores MMDD format (e.g., 1225 for Dec 25)
      const targetMMDD = recurrenceDays[0]
      const targetMonth = Math.floor(targetMMDD / 100) // Extract month
      const targetDate = targetMMDD % 100 // Extract date

      const currentMonth = date.getMonth() + 1 // getMonth() is 0-indexed
      const currentDate = date.getDate()

      return currentMonth === targetMonth && currentDate === targetDate
    }

    case 'manual':
      return false // Never auto-add

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

    case 'weekdays':
      return 'Weekdays (Mon-Fri)'

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

    case 'biweekly': {
      if (!recurrenceDays || recurrenceDays.length === 0) return 'Every 2 weeks'

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const selectedDays = recurrenceDays.map(d => dayNames[d])

      if (selectedDays.length === 1) {
        return `Every other ${selectedDays[0]}`
      } else {
        return `Every 2 weeks on ${selectedDays.join(', ')}`
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

    case 'yearly': {
      if (!recurrenceDays || recurrenceDays.length === 0) return 'Yearly'

      const mmdd = recurrenceDays[0]
      const month = Math.floor(mmdd / 100)
      const date = mmdd % 100

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]

      const ordinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd']
        const v = n % 100
        return n + (s[(v - 20) % 10] || s[v] || s[0])
      }

      return `${monthNames[month - 1]} ${ordinal(date)}`
    }

    case 'manual':
      return 'Manual (add when needed)'

    default:
      return 'Custom schedule'
  }
}
