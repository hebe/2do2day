import React, { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import TopPrompt from './TopPrompt'
import TaskRow from './TaskRow'
import BacklogQuickPicker from './BacklogQuickPicker'
import RecurringQuickPicker from './RecurringQuickPicker'
import { getReadyRecurringTasks } from '../utils/recurringUtils'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

function TodayView() {
  const { today, recurring, backlog, addTodayTask, deleteTask, editTask, reorderTodayTasks, settings, loadFromCloudAndMerge } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [showBacklogPicker, setShowBacklogPicker] = useState(false)
  const [showRecurringPicker, setShowRecurringPicker] = useState(false)
  const [showResetMessage, setShowResetMessage] = useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const inputRef = useRef(null)
  const lastResetRef = useRef(settings.lastDayReset)
  const pullStartY = useRef(0)
  const pullCurrentY = useRef(0)
  const isPulling = useRef(false)

  const doneCount = today.filter(t => t.done).length
  const totalCount = today.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // Get ready recurring tasks
  const readyRecurringTasks = getReadyRecurringTasks(recurring, settings.dayStart)

  // dnd-kit sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Check if day was just reset
  useEffect(() => {
    if (settings.lastDayReset && settings.lastDayReset !== lastResetRef.current) {
      const resetTime = new Date(settings.lastDayReset)
      const now = new Date()
      const timeSinceReset = now - resetTime

      if (timeSinceReset < 5 * 60 * 1000) {
        setShowResetMessage(true)
        setTimeout(() => setShowResetMessage(false), 8000)
      }

      lastResetRef.current = settings.lastDayReset
    }
  }, [settings.lastDayReset])

  // Auto-focus input when shown
  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAddInput])

  // Pull-to-refresh
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e) => {
      if (!isPulling.current || isPullRefreshing) return

      pullCurrentY.current = e.touches[0].clientY
      const pullDistance = pullCurrentY.current - pullStartY.current

      if (pullDistance > 0 && window.scrollY === 0) {
        if (pullDistance > 10) {
          e.preventDefault()
        }
      } else {
        isPulling.current = false
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current || isPullRefreshing) {
        isPulling.current = false
        return
      }

      const pullDistance = pullCurrentY.current - pullStartY.current
      const threshold = 80

      if (pullDistance > threshold) {
        setIsPullRefreshing(true)
        try {
          await loadFromCloudAndMerge()
        } catch (error) {
          console.error('[PullRefresh] Error:', error)
        } finally {
          setTimeout(() => setIsPullRefreshing(false), 500)
        }
      }

      isPulling.current = false
      pullStartY.current = 0
      pullCurrentY.current = 0
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPullRefreshing, loadFromCloudAndMerge])

  const handleAddTask = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      addTodayTask(inputValue.trim())
      setInputValue('')
      setShowAddInput(false)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = today.findIndex((t) => t.id === active.id)
    const newIndex = today.findIndex((t) => t.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTodayTasks(oldIndex, newIndex)
    }
  }

  // Get motivational message based on progress
  const getMessage = () => {
    if (totalCount === 0) return "What's on your plate today?"
    if (progressPercent === 0) return "Let's get started!"
    if (progressPercent < 25) return "Good start! Keep going"
    if (progressPercent < 50) return "Making progress!"
    if (progressPercent < 75) return "You're doing great!"
    if (progressPercent < 100) return "Almost there!"
    return "All done! Amazing!"
  }

  // Empty state - no tasks at all
  if (today.length === 0 && !showAddInput) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <TopPrompt
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleAddTask={handleAddTask}
          handleAddFromBacklog={() => setShowBacklogPicker(true)}
          handleAddFromRecurring={() => setShowRecurringPicker(true)}
          recurringCount={readyRecurringTasks.length}
          inputRef={inputRef}
        />

        {showBacklogPicker && (
          <BacklogQuickPicker onClose={() => setShowBacklogPicker(false)} />
        )}

        {showRecurringPicker && readyRecurringTasks.length > 0 && (
          <RecurringQuickPicker
            readyTasks={readyRecurringTasks}
            onClose={() => setShowRecurringPicker(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Pull-to-refresh indicator */}
      {isPullRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-teal-500 text-white py-2 px-4 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
          </div>
        </div>
      )}

      {/* Day Reset Message */}
      {showResetMessage && (
        <div className="bg-teal-500 text-white px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="text-sm">Good morning! Yesterday's tasks moved to backlog.</span>
            <button onClick={() => setShowResetMessage(false)} className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-teal-400 dark:bg-teal-600 px-6 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-teal-900 dark:text-teal-100 text-lg mb-4">
            {getMessage()}
          </p>

          <div className="flex items-end justify-between mb-3">
            <div className="flex-1">
              {/* Progress bar */}
              <div className="h-2 bg-teal-600/30 dark:bg-teal-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-700 dark:bg-teal-300 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-4xl font-light text-teal-900 dark:text-teal-100 ml-6 tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-teal-300/50 dark:bg-teal-700/50 px-6 py-3 border-b border-teal-400/30 dark:border-teal-600/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowBacklogPicker(true)}
            className="text-sm text-teal-800 dark:text-teal-200 hover:text-teal-900 dark:hover:text-teal-100 font-medium flex items-center gap-2"
          >
            Add from backlog
            {backlog.length > 0 && (
              <span className="bg-teal-600/20 dark:bg-teal-400/20 px-1.5 py-0.5 rounded text-xs">
                {backlog.length}
              </span>
            )}
          </button>

          {readyRecurringTasks.length > 0 && (
            <button
              onClick={() => setShowRecurringPicker(true)}
              className="text-sm text-teal-800 dark:text-teal-200 hover:text-teal-900 dark:hover:text-teal-100 font-medium flex items-center gap-1"
            >
              <span>💫</span>
              {readyRecurringTasks.length} recurring
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800">
        <div className="max-w-2xl mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={today.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {today.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDelete={deleteTask}
                    onEdit={editTask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Add Task Section */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/50">
        <div className="max-w-2xl mx-auto">
          {showAddInput ? (
            <form onSubmit={handleAddTask} className="p-4">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400"
                  onBlur={() => {
                    if (!inputValue.trim()) {
                      setShowAddInput(false)
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddInput(true)}
              className="w-full p-4 text-left text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3"
            >
              <span className="w-6 h-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              Add a task...
            </button>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 bg-gray-100 dark:bg-gray-900" />

      {/* Modals */}
      {showBacklogPicker && (
        <BacklogQuickPicker onClose={() => setShowBacklogPicker(false)} />
      )}

      {showRecurringPicker && readyRecurringTasks.length > 0 && (
        <RecurringQuickPicker
          readyTasks={readyRecurringTasks}
          onClose={() => setShowRecurringPicker(false)}
        />
      )}
    </div>
  )
}

export default TodayView
