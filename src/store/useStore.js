import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORY_COLOR_PALETTE } from '../utils/colorUtils'
import { loadFromCloud } from '../lib/cloudSync'

const DEFAULT_CATEGORIES = [
  { id: 'personal', name: 'Personal', color: CATEGORY_COLOR_PALETTE[1] }, // Mint Green
  { id: 'work', name: 'Work', color: CATEGORY_COLOR_PALETTE[0] },      // Sky Blue
  { id: 'hobby', name: 'Hobby', color: CATEGORY_COLOR_PALETTE[3] },    // Violet
  { id: 'health', name: 'Health', color: CATEGORY_COLOR_PALETTE[2] },  // Amber
]

const TOMBSTONE_LIMIT = 200
const nowIso = () => new Date().toISOString()

// Returns the most recent activity timestamp for a task (used for cross-device merge).
const activityTs = (item) =>
  item?.lastCompletedAt || item?.completedAt || item?.updatedAt || item?.createdAt || ''

const addTombstone = (state, id) => {
  const existing = (state._tombstones || []).filter((t) => t.id !== id)
  const next = [...existing, { id, deletedAt: nowIso() }]
  return next.slice(-TOMBSTONE_LIMIT)
}

// Smart merge: combine local and cloud state by picking the most recent
// version of each task (across lists) and respecting tombstones for deletes.
// Preserves local list order so drag-reorder isn't lost on refresh.
function mergeStates(local, cloud) {
  const lists = ['today', 'backlog', 'recurring', 'done']

  // Merge tombstones (latest deletedAt wins per id)
  const tombMap = new Map()
  for (const t of [...(cloud._tombstones || []), ...(local._tombstones || [])]) {
    if (!t || !t.id) continue
    const existing = tombMap.get(t.id)
    if (!existing || (t.deletedAt || '') > (existing.deletedAt || '')) {
      tombMap.set(t.id, t)
    }
  }

  // For each task id, find the most recent version across all lists in both sides.
  const winnerByItemId = new Map()
  const consider = (item, list) => {
    if (!item || !item.id) return
    const ts = activityTs(item)
    const existing = winnerByItemId.get(item.id)
    if (!existing || ts > activityTs(existing.item)) {
      winnerByItemId.set(item.id, { item, list })
    }
  }
  for (const list of lists) {
    for (const item of cloud[list] || []) consider(item, list)
    for (const item of local[list] || []) consider(item, list)
  }

  // Drop ids whose tombstone is at-or-after their latest activity.
  for (const [id, { item }] of winnerByItemId) {
    const tomb = tombMap.get(id)
    if (tomb && (tomb.deletedAt || '') >= activityTs(item)) {
      winnerByItemId.delete(id)
    }
  }

  // Build each output list while preserving local order. For ids new from
  // cloud (not in local), append in cloud order at the end.
  const merged = { today: [], backlog: [], recurring: [], done: [] }
  const placed = new Set()
  for (const list of lists) {
    for (const item of local[list] || []) {
      const winner = winnerByItemId.get(item.id)
      if (!winner || placed.has(item.id) || winner.list !== list) continue
      merged[list].push(winner.item)
      placed.add(item.id)
    }
  }
  for (const list of lists) {
    for (const item of cloud[list] || []) {
      const winner = winnerByItemId.get(item.id)
      if (!winner || placed.has(item.id) || winner.list !== list) continue
      merged[list].push(winner.item)
      placed.add(item.id)
    }
  }

  const sortedTombs = Array.from(tombMap.values())
    .sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''))
    .slice(0, TOMBSTONE_LIMIT)

  return { ...merged, _tombstones: sortedTombs }
}

const useStore = create(
  persist(
    (set, get) => ({
      // State
      today: [],
      backlog: [],
      recurring: [],
      done: [],
      _tombstones: [],
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
        const ts = nowIso()
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
          createdAt: ts,
          updatedAt: ts
        }
        set((state) => ({
          today: [...state.today, newTask]
        }))
      },

      toggleDone: (id) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, done: !task.done, updatedAt: nowIso() } : task
          )
        }))
      },

      toggleUrgent: (id) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent, updatedAt: nowIso() } : task
          )
        }))
      },

      toggleBacklogUrgent: (id) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent, updatedAt: nowIso() } : task
          )
        }))
      },

      toggleRecurringUrgent: (id) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, urgent: !task.urgent, updatedAt: nowIso() } : task
          )
        }))
      },

      setTaskQuadrant: (id, important, urgent, priorityScore, matrixPos = null) => {
        const ts = nowIso()
        set((state) => ({
          today: state.today.map((t) =>
            t.id === id ? { ...t, important, urgent, priorityScore, matrixPos, updatedAt: ts } : t
          ),
          backlog: state.backlog.map((t) =>
            t.id === id ? { ...t, important, urgent, priorityScore, matrixPos, updatedAt: ts } : t
          ),
          recurring: state.recurring.map((t) =>
            t.id === id ? { ...t, important, urgent, priorityScore, matrixPos, updatedAt: ts } : t
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
            task.id === id ? { ...task, category, updatedAt: nowIso() } : task
          )
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          today: state.today.filter((task) => task.id !== id),
          _tombstones: addTombstone(state, id)
        }))
      },

      editTask: (id, newTitle) => {
        set((state) => ({
          today: state.today.map((task) =>
            task.id === id ? { ...task, title: newTitle, updatedAt: nowIso() } : task
          )
        }))
      },

      moveToBacklog: (id) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id)
          if (!task) return state

          const ts = nowIso()
          const existingBacklogTask = state.backlog.find((t) => t.id === task.id)

          if (existingBacklogTask) {
            return {
              today: state.today.filter((t) => t.id !== id),
              backlog: state.backlog.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      addedToBacklogCount: (t.addedToBacklogCount || 0) + 1,
                      lastAddedToBacklog: ts,
                      updatedAt: ts
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
                createdAt: task.createdAt || ts,
                updatedAt: ts,
                addedToBacklogCount: 1,
                lastAddedToBacklog: ts
              }]
            }
          }
        })
      },

      addBacklogTask: (title, category = null, urgent = false) => {
        const ts = nowIso()
        const newTask = {
          id: Date.now().toString(),
          title,
          category,
          urgent,
          important: false,
          priorityScore: null,
          matrixPos: null,
          isRecurring: false,
          createdAt: ts,
          updatedAt: ts,
          addedToBacklogCount: 1,
          lastAddedToBacklog: ts
        }
        set((state) => ({
          backlog: [...state.backlog, newTask]
        }))
      },

      addFromBacklog: (id) => {
        set((state) => {
          const backlogTask = state.backlog.find((t) => t.id === id)
          if (!backlogTask) return state

          const ts = nowIso()
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
            createdAt: ts,
            updatedAt: ts,
            originalBacklogId: backlogTask.id
          }

          return {
            today: [...state.today, newTodayTask],
            backlog: state.backlog.filter((t) => t.id !== id),
            // The backlog id no longer exists locally — tombstone it so a
            // stale cloud copy can't resurrect it back into the backlog.
            _tombstones: addTombstone(state, backlogTask.id)
          }
        })
      },

      deleteBacklogTask: (id) => {
        set((state) => ({
          backlog: state.backlog.filter((task) => task.id !== id),
          _tombstones: addTombstone(state, id)
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
              completedAt: nowIso()
            }]
          }
        })
      },

      editBacklogTask: (id, newTitle) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, title: newTitle, updatedAt: nowIso() } : task
          )
        }))
      },

      updateBacklogCategory: (id, category) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, category, updatedAt: nowIso() } : task
          )
        }))
      },

      updateRecurringCategory: (id, category) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, category, updatedAt: nowIso() } : task
          )
        }))
      },

      toggleRecurring: (id) => {
        set((state) => ({
          backlog: state.backlog.map((task) =>
            task.id === id ? { ...task, isRecurring: !task.isRecurring, updatedAt: nowIso() } : task
          )
        }))
      },

      moveBacklogToRecurring: (id, recurrencePattern, recurrenceDays = []) => {
        set((state) => {
          const task = state.backlog.find((t) => t.id === id)
          if (!task) return state

          const ts = nowIso()
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
              createdAt: task.createdAt,
              updatedAt: ts
            }]
          }
        })
      },

      moveTodayToRecurring: (id, recurrencePattern, recurrenceDays = []) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id)
          if (!task) return state

          const ts = nowIso()
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
              createdAt: task.createdAt || ts,
              updatedAt: ts
            }]
          }
        })
      },

      updateRecurringPattern: (id, recurrencePattern, recurrenceDays) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, recurrencePattern, recurrenceDays, updatedAt: nowIso() } : task
          )
        }))
      },

      addFromRecurring: (id) => {
        set((state) => {
          const recurringTask = state.recurring.find((t) => t.id === id)
          if (!recurringTask) return state

          const ts = nowIso()
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
            createdAt: ts,
            updatedAt: ts
          }

          return {
            today: [...state.today, newTodayTask],
            recurring: state.recurring.map((t) =>
              t.id === id ? { ...t, lastAddedToToday: ts, updatedAt: ts } : t
            )
          }
        })
      },

      deleteRecurringTask: (id) => {
        set((state) => ({
          recurring: state.recurring.filter((task) => task.id !== id),
          _tombstones: addTombstone(state, id)
        }))
      },

      editRecurringTask: (id, newTitle) => {
        set((state) => ({
          recurring: state.recurring.map((task) =>
            task.id === id ? { ...task, title: newTitle, updatedAt: nowIso() } : task
          )
        }))
      },

      archiveTask: (id) => {
        set((state) => {
          const task = state.today.find((t) => t.id === id && t.done)
          if (!task) return state

          const ts = nowIso()

          if (task.recurringId) {
            // Recurring archives use a derived done id, so the today task id
            // disappears entirely — tombstone it so cloud can't resurrect it.
            const existingDoneEntry = state.done.find((d) => d.recurringId === task.recurringId)

            if (existingDoneEntry) {
              return {
                today: state.today.filter((t) => t.id !== id),
                done: state.done.map((d) =>
                  d.recurringId === task.recurringId
                    ? {
                        ...d,
                        completionCount: (d.completionCount || 1) + 1,
                        lastCompletedAt: ts
                      }
                    : d
                ),
                _tombstones: addTombstone(state, id)
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
                  lastCompletedAt: ts,
                  firstCompletedAt: ts,
                  isRecurringCompletion: true
                }],
                _tombstones: addTombstone(state, id)
              }
            }
          } else {
            return {
              today: state.today.filter((t) => t.id !== id),
              done: [...state.done, {
                id: task.id,
                title: task.title,
                category: task.category,
                completedAt: ts
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
        const ts = nowIso()
        set((state) => ({
          settings: {
            ...state.settings,
            categories: state.settings.categories.filter((cat) => cat.id !== id)
          },
          today: state.today.map((task) =>
            task.category === id ? { ...task, category: null, updatedAt: ts } : task
          ),
          backlog: state.backlog.map((task) =>
            task.category === id ? { ...task, category: null, updatedAt: ts } : task
          ),
          recurring: state.recurring.map((task) =>
            task.category === id ? { ...task, category: null, updatedAt: ts } : task
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

          const ts = now.toISOString()

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
              updatedAt: ts,
              addedToBacklogCount: 1,
              lastAddedToBacklog: ts
            }))

          const completedTasks = state.today
            .filter(task => task.done)
            .map(task => ({
              id: task.id,
              title: task.title,
              category: task.category,
              completedAt: ts
            }))

          return {
            today: [],
            backlog: [...state.backlog, ...incompleteTasks],
            done: [...state.done, ...completedTasks],
            settings: {
              ...state.settings,
              lastDayReset: ts
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
          // Reset tombstones — current ones could otherwise suppress imported
          // items whose ids match historical local deletions.
          _tombstones: importedData._tombstones || [],
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

      // Pull cloud state and merge with local. Used by app-focus refresh and
      // pull-to-refresh. Unlike the initial load, this does NOT clobber local
      // edits — items, completions, and deletes are reconciled by timestamp.
      loadFromCloudAndMerge: async () => {
        const result = await loadFromCloud()
        if (!result.success) {
          return { success: false, error: result.error }
        }
        if (!result.data) {
          return { success: true, skipped: true }
        }

        set((state) => {
          const merged = mergeStates(state, result.data)
          return {
            today: merged.today,
            backlog: merged.backlog,
            recurring: merged.recurring,
            done: merged.done,
            _tombstones: merged._tombstones
          }
        })

        return { success: true }
      },
    }),
    {
      name: 'todays-todos-storage',
      partialize: (state) => ({
        today: state.today,
        backlog: state.backlog,
        recurring: state.recurring,
        done: state.done,
        _tombstones: state._tombstones,
        settings: state.settings,
      }),
    }
  )
)

export default useStore
