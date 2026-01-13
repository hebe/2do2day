import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
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
      },

      // Today actions
      addTodayTask: (title) => {
        const newTask = {
          id: Date.now().toString(),
          title,
          done: false,
          prio: false,
          note: '',
          snoozeUntil: null,
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
      addBacklogTask: (title) => {
        const newTask = {
          id: Date.now().toString(),
          title,
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
            done: false,
            prio: false,
            note: '',
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

      toggleRecurring: (id) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, isRecurring: !task.isRecurring } : task
          )
        }))
      },

      moveBacklogToRecurring: (id, interval) => {
        set((state) => {
          const task = state.backlog.find((t) => t.id === id)
          if (!task) return state

          return {
            backlog: state.backlog.filter((t) => t.id !== id),
            recurring: [...state.recurring, {
              id: task.id,
              title: task.title,
              rule: interval ? 'interval' : 'manual',
              interval: interval || null,
              createdAt: task.createdAt
            }]
          }
        })
      },

      moveTodayToRecurring: (id, interval) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id)
          if (!task) return state

          return {
            today: state.today.filter((t) => t.id !== id),
            recurring: [...state.recurring, {
              id: task.id,
              title: task.title,
              rule: 'interval',
              interval: interval,
              createdAt: task.createdAt || new Date().toISOString()
            }]
          }
        })
      },

      updateRecurringInterval: (id, interval) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, interval, rule: 'interval' } : task
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
            done: false,
            prio: false,
            note: '',
            snoozeUntil: null,
            createdAt: new Date().toISOString()
          }

          return {
            today: [...state.today, newTodayTask]
          }
        })
      },

      deleteRecurringTask: (id) => {
        set((state) => ({
          recurring: state.recurring.filter((task) => task.id !== id)
        }))
      },

      // Archive completed task
      archiveTask: (id) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id && t.done)
          if (!task) return state

          return {
            today: state.today.filter((t) => t.id !== id),
            done: [...state.done, {
              id: task.id,
              title: task.title,
              completedAt: new Date().toISOString()
            }]
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
              isRecurring: false,
              createdAt: task.createdAt
            }))
          
          const completedTasks = state.today
            .filter(task => task.done)
            .map(task => ({
              id: task.id,
              title: task.title,
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
    }),
    {
      name: 'todays-todos-storage',
    }
  )
)

export default useStore
