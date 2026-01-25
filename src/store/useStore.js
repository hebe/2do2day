import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORY_COLOR_PALETTE } from '../utils/colorUtils'
import { saveToCloud, loadFromCloud } from '../lib/cloudSync'

const DEFAULT_CATEGORIES = [
  { id: 'personal', name: 'Personal', color: CATEGORY_COLOR_PALETTE[1] }, // Mint Green
  { id: 'work', name: 'Work', color: CATEGORY_COLOR_PALETTE[0] },      // Sky Blue
  { id: 'hobby', name: 'Hobby', color: CATEGORY_COLOR_PALETTE[3] },    // Violet
  { id: 'health', name: 'Health', color: CATEGORY_COLOR_PALETTE[2] },  // Amber
]

const useStore = create(
  persist(
    (set, get) => ({
      // State
      today: [],
      backlog: [],
      recurring: [],
      done: [],
      settings: {
        dayStart: '05:00',
        snoozeOptions: [2, 5, 60, 'Tonight'],
        lastDayReset: null,
        backlogSortBy: 'recent', // 'recent', 'postponed', 'oldest'
        colorMode: 'auto', // 'light', 'dark', or 'auto'
        categories: DEFAULT_CATEGORIES, // User's custom categories
      },

      // Today actions
      addTodayTask: (title, category = null, urgent = false) => {
        const newTask = {
          id: Date.now().toString(),
          title,
          done: false,
          prio: false,
          note: '',
          snoozeUntil: null,
          category, // New field
          urgent, // New field
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          today: [...state.today, newTask]
        }))
      },

      toggleDone: (id) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task
          )
        }))
      },

      toggleUrgent: (id) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent } : task
          )
        }))
      },

      // Toggle urgent for backlog items
      toggleBacklogUrgent: (id) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent } : task
          )
        }))
      },

      // Toggle urgent for recurring items
      toggleRecurringUrgent: (id) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent } : task
          )
        }))
      },

      updateTaskCategory: (id, category) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, category } : task
          )
        }))
      },

      sortTodayByCompletion: () => {
        set((state) => {
          const undone = state.today.filter(t => !t.done)
          const done = state.today.filter(t => t.done)
          return { today: [...undone, ...done] }
        })
      },

      deleteTask: (id) => {
        set((state) => ({
          today: state.today.filter((task) => task.id !== id)
        }))
      },

      editTask: (id, newTitle) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, title: newTitle } : task
          )
        }))
      },

      moveToBacklog: (id) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id)
          if (!task) return state
          
          // Check if this task already exists in backlog
          const existingBacklogTask = state.backlog.find((t) => t.id === task.id)
          
          if (existingBacklogTask) {
            // Update existing backlog item
            return {
              today: state.today.filter((t) => t.id !== id),
              backlog: state.backlog.map((t) => 
                t.id === task.id 
                  ? {
                      ...t,
                      addedToBacklogCount: (t.addedToBacklogCount || 0) + 1,
                      lastAddedToBacklog: new Date().toISOString()
                    }
                  : t
              )
            }
          } else {
            // Create new backlog item
            return {
              today: state.today.filter((t) => t.id !== id),
              backlog: [...state.backlog, { 
                id: task.id, 
                title: task.title,
                category: task.category, // Preserve category
                urgent: task.urgent || false, // Preserve urgent status
                isRecurring: false,
                createdAt: task.createdAt || new Date().toISOString(),
                addedToBacklogCount: 1,
                lastAddedToBacklog: new Date().toISOString()
              }]
            }
          }
        })
      },

      // Backlog actions
      addBacklogTask: (title, category = null, urgent = false) => {
        const newTask = {
          id: Date.now().toString(),
          title,
          category,
          urgent, // Add urgent field
          isRecurring: false,
          createdAt: new Date().toISOString(),
          addedToBacklogCount: 1,
          lastAddedToBacklog: new Date().toISOString()
        }
        set((state) => ({
          backlog: [...state.backlog, newTask]
        }))
      },

      addFromBacklog: (id) => {
        set((state) => {
          const backlogTask = state.backlog.find((t) => t.id === id)
          if (!backlogTask) return state

          const newTodayTask = {
            id: Date.now().toString(),
            title: backlogTask.title,
            category: backlogTask.category, // Preserve category
            done: false,
            prio: false,
            note: '',
            urgent: backlogTask.urgent || false, // Preserve urgent status
            snoozeUntil: null,
            createdAt: new Date().toISOString(),
            originalBacklogId: backlogTask.id // Track original backlog item
          }

          return {
            today: [...state.today, newTodayTask],
            backlog: state.backlog.filter((t) => t.id !== id)
          }
        })
      },

      deleteBacklogTask: (id) => {
        set((state) => ({
          backlog: state.backlog.filter((task) => task.id !== id)
        }))
      },

      editBacklogTask: (id, newTitle) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, title: newTitle } : task
          )
        }))
      },

      updateBacklogCategory: (id, category) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, category } : task
          )
        }))
      },

      updateRecurringCategory: (id, category) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, category } : task
          )
        }))
      },

      toggleRecurring: (id) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, isRecurring: !task.isRecurring } : task
          )
        }))
      },

      moveBacklogToRecurring: (id, recurrencePattern, recurrenceDays = []) => {
        set((state) => {
          const task = state.backlog.find((t) => t.id === id)
          if (!task) return state

          return {
            backlog: state.backlog.filter((t) => t.id !== id),
            recurring: [...state.recurring, {
              id: task.id,
              title: task.title,
              category: task.category,
              urgent: task.urgent || false,
              note: '',
              recurrencePattern, // 'daily', 'weekly', 'monthly'
              recurrenceDays, // For weekly: [0-6], for monthly: [1-31]
              lastAddedToToday: null,
              createdAt: task.createdAt
            }]
          }
        })
      },

      moveTodayToRecurring: (id, recurrencePattern, recurrenceDays = []) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id)
          if (!task) return state

          return {
            today: state.today.filter((t) => t.id !== id),
            recurring: [...state.recurring, {
              id: task.id,
              title: task.title,
              category: task.category,
              urgent: task.urgent || false,
              note: task.note || '',
              recurrencePattern,
              recurrenceDays,
              lastAddedToToday: null,
              createdAt: task.createdAt || new Date().toISOString()
            }]
          }
        })
      },

      updateRecurringPattern: (id, recurrencePattern, recurrenceDays) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, recurrencePattern, recurrenceDays } : task
          )
        }))
      },

      addFromRecurring: (id) => {
        set((state) => {
          const recurringTask = state.recurring.find((t) => t.id === id)
          if (!recurringTask) return state

          const newTodayTask = {
            id: Date.now().toString(),
            title: recurringTask.title,
            category: recurringTask.category,
            done: false,
            prio: false,
            note: recurringTask.note || '',
            urgent: recurringTask.urgent || false,
            snoozeUntil: null,
            fromRecurring: true, // Mark that this came from recurring
            recurringId: recurringTask.id, // Track which recurring task it came from
            createdAt: new Date().toISOString()
          }

          return {
            today: [...state.today, newTodayTask],
            recurring: state.recurring.map((t) =>
              t.id === id ? { ...t, lastAddedToToday: new Date().toISOString() } : t
            )
          }
        })
      },

      deleteRecurringTask: (id) => {
        set((state) => ({
          recurring: state.recurring.filter((task) => task.id !== id)
        }))
      },

      editRecurringTask: (id, newTitle) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, title: newTitle } : task
          )
        }))
      },

      // Archive completed task
      archiveTask: (id) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id && t.done)
          if (!task) return state

          // Check if this is a recurring task completion
          if (task.recurringId) {
            // Find existing done entry for this recurring task
            const existingDoneEntry = state.done.find((d) => d.recurringId === task.recurringId)

            if (existingDoneEntry) {
              // Update existing entry: increment counter and update timestamp
              return {
                today: state.today.filter((t) => t.id !== id),
                done: state.done.map((d) =>
                  d.recurringId === task.recurringId
                    ? {
                        ...d,
                        completionCount: (d.completionCount || 1) + 1,
                        lastCompletedAt: new Date().toISOString()
                      }
                    : d
                )
              }
            } else {
              // Create first done entry for this recurring task
              return {
                today: state.today.filter((t) => t.id !== id),
                done: [...state.done, {
                  id: `${task.recurringId}_done`,
                  title: task.title,
                  category: task.category,
                  recurringId: task.recurringId,
                  completionCount: 1,
                  lastCompletedAt: new Date().toISOString(),
                  firstCompletedAt: new Date().toISOString(),
                  isRecurringCompletion: true
                }]
              }
            }
          } else {
            // Regular one-time task completion
            return {
              today: state.today.filter((t) => t.id !== id),
              done: [...state.done, {
                id: task.id,
                title: task.title,
                category: task.category,
                completedAt: new Date().toISOString()
              }]
            }
          }
        })
      },

      // Reorder tasks
      reorderTodayTasks: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.today)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { today: result }
        })
      },

      reorderBacklogTasks: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.backlog)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          return { backlog: result }
        })
      },

      // Category management
      addCategory: (name, color) => {
        set((state) => ({
          settings: {
            ...state.settings,
            categories: [
              ...(state.settings.categories || DEFAULT_CATEGORIES),
              {
                id: Date.now().toString(),
                name,
                color
              }
            ]
          }
        }))
      },

      updateCategory: (id, name, color) => {
        set((state) => ({
          settings: {
            ...state.settings,
            categories: state.settings.categories.map((cat) =>
              cat.id === id ? { ...cat, name, color } : cat
            )
          }
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            categories: state.settings.categories.filter((cat) => cat.id !== id)
          },
          // Remove category from all tasks
          today: state.today.map((task) =>
            task.category === id ? { ...task, category: null } : task
          ),
          backlog: state.backlog.map((task) =>
            task.category === id ? { ...task, category: null } : task
          ),
          recurring: state.recurring.map((task) =>
            task.category === id ? { ...task, category: null } : task
          )
        }))
      },

      // Settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      // New Day Reset Logic
      checkAndResetDay: () => {
        set((state) => {
          const now = new Date()
          const [hours, minutes] = state.settings.dayStart.split(':').map(Number)
          
          // Create today's reset time
          const todayReset = new Date(now)
          todayReset.setHours(hours, minutes, 0, 0)
          
          // If current time is before today's reset time, the reset time was yesterday
          if (now < todayReset) {
            todayReset.setDate(todayReset.getDate() - 1)
          }
          
          const lastReset = state.settings.lastDayReset 
            ? new Date(state.settings.lastDayReset) 
            : null
          
          // Check if we need to reset (haven't reset since the last reset time)
          const shouldReset = !lastReset || lastReset < todayReset
          
          if (!shouldReset) {
            return state // No reset needed
          }
          
          // Perform the reset
          const incompleteTasks = state.today
            .filter(task => !task.done)
            .map(task => ({
              id: task.id,
              title: task.title,
              category: task.category, // Preserve category
              urgent: task.urgent || false, // Preserve urgent
              isRecurring: false,
              createdAt: task.createdAt,
              addedToBacklogCount: 1,
              lastAddedToBacklog: new Date().toISOString()
            }))
          
          const completedTasks = state.today
            .filter(task => task.done)
            .map(task => ({
              id: task.id,
              title: task.title,
              category: task.category, // Preserve category
              completedAt: new Date().toISOString()
            }))
          
          return {
            today: [], // Clear today's list
            backlog: [...state.backlog, ...incompleteTasks], // Move incomplete to backlog
            done: [...state.done, ...completedTasks], // Archive completed
            settings: {
              ...state.settings,
              lastDayReset: now.toISOString()
            }
          }
        })
      },

      // Import data
      importData: (importedData) => {
        set({
          today: importedData.today || [],
          backlog: importedData.backlog || [],
          recurring: importedData.recurring || [],
          done: importedData.done || [],
          settings: {
            ...get().settings,
            ...importedData.settings,
            // Ensure categories exist
            categories: importedData.settings?.categories || DEFAULT_CATEGORIES
          }
        })
      },

      // Cloud sync actions
      syncToCloud: async () => {
        const state = get()
        const result = await saveToCloud(state)
        return result
      },

      loadFromCloudAndMerge: async () => {
        const result = await loadFromCloud()

        if (result.success && result.data) {
          set({
            today: result.data.today || [],
            backlog: result.data.backlog || [],
            recurring: result.data.recurring || [],
            done: result.data.done || [],
            settings: {
              ...get().settings,
              ...result.data.settings,
              categories: result.data.settings?.categories || DEFAULT_CATEGORIES
            }
          })
        }

        return result
      },
    }),
    {
      name: 'todays-todos-storage',
    }
  )
)

export default useStore
