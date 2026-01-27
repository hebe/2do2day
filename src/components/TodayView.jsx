import React, { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import TopPrompt from './TopPrompt'
import TaskRow from './TaskRow'
import FooterActions from './FooterActions'
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
  const { today, recurring, addTodayTask, deleteTask, editTask, reorderTodayTasks, sortTodayByCompletion, settings, loadFromCloudAndMerge } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [showList, setShowList] = useState(false)
  const [showBacklogPicker, setShowBacklogPicker] = useState(false)
  const [showRecurringPicker, setShowRecurringPicker] = useState(false)
  const [showResetMessage, setShowResetMessage] = useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const inputRef = useRef(null)
  const lastResetRef = useRef(settings.lastDayReset)
  const pullStartY = useRef(0)
  const pullCurrentY = useRef(0)
  const isPulling = useRef(false)

  const doneCount = today.filter(t => t.done).length
  const undoneCount = today.filter(t => !t.done).length
  const showCounter = today.length > 5

  // Get ready recurring tasks
  const readyRecurringTasks = getReadyRecurringTasks(recurring, settings.dayStart)

  // dnd-kit sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts on touch
        tolerance: 8, // Allow 8px movement during the delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Show list if there are any tasks
  useEffect(() => {
    if (today.length > 0) {
      setShowList(true)
    }
  }, [today.length])

  // Check if day was just reset
  useEffect(() => {
    if (settings.lastDayReset && settings.lastDayReset !== lastResetRef.current) {
      const resetTime = new Date(settings.lastDayReset)
      const now = new Date()
      const timeSinceReset = now - resetTime
      
      // Show message if reset happened in the last 5 minutes
      if (timeSinceReset < 5 * 60 * 1000) {
        setShowResetMessage(true)
        setTimeout(() => setShowResetMessage(false), 8000)
      }
      
      lastResetRef.current = settings.lastDayReset
    }
  }, [settings.lastDayReset])

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current && !showList) {
      inputRef.current.focus()
    }
  }, [showList])

  // Pull-to-refresh with native event listeners (to avoid passive event warnings)
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only enable pull-to-refresh when scrolled to the top
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e) => {
      if (!isPulling.current || isPullRefreshing) return

      pullCurrentY.current = e.touches[0].clientY
      const pullDistance = pullCurrentY.current - pullStartY.current

      // Only allow pulling down (positive distance) and when at top of page
      if (pullDistance > 0 && window.scrollY === 0) {
        // Prevent default scrolling while pulling
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
      const threshold = 80 // Minimum pull distance to trigger refresh

      if (pullDistance > threshold) {
        setIsPullRefreshing(true)
        console.log('[PullRefresh] Triggering manual refresh...')

        try {
          await loadFromCloudAndMerge()
          console.log('[PullRefresh] Refresh completed')
        } catch (error) {
          console.error('[PullRefresh] Error during refresh:', error)
        } finally {
          // Keep the indicator visible for a moment so user sees it completed
          setTimeout(() => {
            setIsPullRefreshing(false)
          }, 500)
        }
      }

      isPulling.current = false
      pullStartY.current = 0
      pullCurrentY.current = 0
    }

    // Add native event listeners with { passive: false } to allow preventDefault
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
      setShowList(true)
    }
  }

  const handleAddFromBacklog = () => {
    setShowBacklogPicker(true)
  }

  const handleAddFromRecurring = () => {
    setShowRecurringPicker(true)
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
      {/* Pull-to-refresh indicator */}
      {isPullRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing with cloud...
          </div>
        </div>
      )}

      {/* Day Reset Message */}
      {showResetMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-slideDown">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-100">Good morning! Your day has reset.</h3>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                Yesterday's incomplete tasks have been moved to your backlog, and completed tasks are archived in Done!
              </p>
            </div>
            <button
              onClick={() => setShowResetMessage(false)}
              className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Blank state */}
      {!showList && (
        <TopPrompt
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleAddTask={handleAddTask}
          handleAddFromBacklog={handleAddFromBacklog}
          handleAddFromRecurring={handleAddFromRecurring}
          recurringCount={readyRecurringTasks.length}
          inputRef={inputRef}
        />
      )}

      {/* Task list state */}
      {showList && (
        <div className="space-y-6">
          {/* Counter and Sort Button */}
          {showCounter && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">{undoneCount}</strong> to do
                </span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">{doneCount}</strong> done
                </span>
              </div>
              {doneCount > 0 && undoneCount > 0 && (
                <button
                  onClick={sortTodayByCompletion}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Sort by status
                </button>
              )}
            </div>
          )}

          {/* Task list */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 overflow-hidden">
            {today.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                <p className="text-sm">Your list is empty. Add your first task below.</p>
              </div>
            ) : (
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
                  <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
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
            )}
          </div>

          {/* Footer actions */}
          <FooterActions
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleAddTask={handleAddTask}
            handleAddFromBacklog={handleAddFromBacklog}
            handleAddFromRecurring={handleAddFromRecurring}
            recurringCount={readyRecurringTasks.length}
          />
        </div>
      )}

      {/* Backlog Quick Picker Modal */}
      {showBacklogPicker && (
        <BacklogQuickPicker onClose={() => setShowBacklogPicker(false)} />
      )}

      {/* Recurring Task Picker Modal */}
      {showRecurringPicker && readyRecurringTasks.length > 0 && (
        <RecurringQuickPicker
          readyTasks={readyRecurringTasks}
          onClose={() => setShowRecurringPicker(false)}
        />
      )}

      {/* Animation for reset message */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        /* Custom accent color */
        :root {
          --accent-color: #F0A500;
          --accent-hover: #D89400;
        }
      `}</style>
    </div>
  )
}

export default TodayView
