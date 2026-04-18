import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORY_COLOR_PALETTE } from '../utils/colorUtils'

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
        colorMode: 'dark', // 'light', 'dark' (riso navy), 'dark-2' (classic gray), or 'auto'
        categories: DEFAULT_CATEGORIES,
        todaySortBy: 'manual', // 'manual' or 'priority'
      },

      // Cloud sync state - prevents syncing before cloud data is loaded
      _cloudSyncReady: false,

      // Today actions
      addTodayTask: (title, category = null, urgent = false) => {
        const newTask = {
          id: Date.now().toString(),
          title,
          done: false,
          prio: false,
          note: '',
          snoozeUntil: null,
          category,
          urgent,
          important: false,
          priorityScore: null,
          matrixPos: null,
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

      toggleBacklogUrgent: (id) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent } : task
          )
        }))
      },

      toggleRecurringUrgent: (id) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent } : task
          )
        }))
      },

      setTaskQuadrant: (id, important, urgent, priorityScore, matrixPos = null) => {
        set((state) => ({
          today: state.today.map((t) =>
            t.id === id ? { ...t, important, urgent, priorityScore, matrixPos } : t
          ),
          backlog: state.backlog.map((t) =>
            t.id === id ? { ...t, important, urgent, priorityScore, matrixPos } : t
          ),
          recurring: state.recurring.map((t) =>
            t.id === id ? { ...t, important, urgent, priorityScore, matrixPos } : t
          ),
        }))
      },

      sortTodayByPriority: () => {
        set((state) => {
          const withPrio = state.today.filter((t) => t.priorityScore !== null)
          const withoutPrio = state.today.filter((t) => t.priorityScore === null)
          withPrio.sort((a, b) => b.priorityScore - a.priorityScore)
          return { today: [...withPrio, ...withoutPrio] }
        })
      },

      sortTodayByCompletion: () => {
        set((state) => {
          const undone = state.today.filter(t => !t.done)
          const done = state.today.filter(t => t.done)
          return { today: [...undone, ...done] }
        })
      },

      updateTaskCategory: (id, category) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, category } : task
          )
        }))
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

          const existingBacklogTask = state.backlog.find((t) => t.id === task.id)

          if (existingBacklogTask) {
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
            return {
              today: state.today.filter((t) => t.id !== id),
              backlog: [...state.backlog, {
                id: task.id,
                title: task.title,
                category: task.category,
                urgent: task.urgent || false,
                important: task.important || false,
                priorityScore: task.priorityScore ?? null,
                matrixPos: task.matrixPos ?? null,
                isRecurring: false,
                createdAt: task.createdAt || new Date().toISOString(),
                addedToBacklogCount: 1,
                lastAddedToBacklog: new Date().toISOString()
              }]
            }
          }
        })
      },

      addBacklogTask: (title, category = null, urgent = false) => {
        const newTask = {
          id: Date.now().toString(),
          title,
          category,
          urgent,
          important: false,
          priorityScore: null,
          matrixPos: null,
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
            category: backlogTask.category,
            done: false,
            prio: false,
            note: '',
            urgent: backlogTask.urgent || false,
            important: backlogTask.important || false,
            priorityScore: backlogTask.priorityScore ?? null,
            matrixPos: backlogTask.matrixPos ?? null,
            snoozeUntil: null,
            createdAt: new Date().toISOString(),
            originalBacklogId: backlogTask.id
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

      markBacklogAsDone: (id) => {
        set((state) => {
          const task = state.backlog.find((t) => t.id === id)
          if (!task) return state

          return {
            backlog: state.backlog.filter((t) => t.id !== id),
            done: [...state.done, {
              id: task.id,
              title: task.title,
              category: task.category,
              completedAt: new Date().toISOString()
            }]
          }
        })
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
              important: task.important || false,
              priorityScore: task.priorityScore ?? null,
              matrixPos: task.matrixPos ?? null,
              note: '',
              recurrencePattern,
              recurrenceDays,
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
              important: task.important || false,
              priorityScore: task.priorityScore ?? null,
              matrixPos: task.matrixPos ?? null,
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
            important: recurringTask.important || false,
            priorityScore: recurringTask.priorityScore ?? null,
            matrixPos: recurringTask.matrixPos ?? null,
            snoozeUntil: null,
            fromRecurring: true,
            recurringId: recurringTask.id,
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

      archiveTask: (id) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id && t.done)
          if (!task) return state

          if (task.recurringId) {
            const existingDoneEntry = state.done.find((d) => d.recurringId === task.recurringId)

            if (existingDoneEntry) {
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

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      checkAndResetDay: () => {
        set((state) => {
          const now = new Date()
          const [hours, minutes] = state.settings.dayStart.split(':').map(Number)

          const todayReset = new Date(now)
          todayReset.setHours(hours, minutes, 0, 0)

          if (now < todayReset) {
            todayReset.setDate(todayReset.getDate() - 1)
          }

          const lastReset = state.settings.lastDayReset
            ? new Date(state.settings.lastDayReset)
            : null

          const shouldReset = !lastReset || lastReset < todayReset

          if (!shouldReset) {
            return state
          }

          const incompleteTasks = state.today
            .filter(task => !task.done)
            .map(task => ({
              id: task.id,
              title: task.title,
              category: task.category,
              urgent: task.urgent || false,
              important: task.important || false,
              priorityScore: task.priorityScore ?? null,
              matrixPos: task.matrixPos ?? null,
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
              category: task.category,
              completedAt: new Date().toISOString()
            }))

          return {
            today: [],
            backlog: [...state.backlog, ...incompleteTasks],
            done: [...state.done, ...completedTasks],
            settings: {
              ...state.settings,
              lastDayReset: now.toISOString()
            }
          }
        })
      },

      importData: (importedData) => {
        set({
          today: importedData.today || [],
          backlog: importedData.backlog || [],
          recurring: importedData.recurring || [],
          done: importedData.done || [],
          settings: {
            ...get().settings,
            ...importedData.settings,
            categories: importedData.settings?.categories || DEFAULT_CATEGORIES
          }
        })
      },

      setCloudSyncReady: (ready) => {
        set({ _cloudSyncReady: ready })
      },
    }),
    {
      name: 'todays-todos-storage',
      partialize: (state) => ({
        today: state.today,
        backlog: state.backlog,
        recurring: state.recurring,
        done: state.done,
        settings: state.settings,
      }),
    }
  )
)

export default useStore
