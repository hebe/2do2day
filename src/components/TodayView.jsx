import React, { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import TopPrompt from './TopPrompt'
import TaskRow from './TaskRow'
import FooterActions from './FooterActions'
import BacklogQuickPicker from './BacklogQuickPicker'
import RecurringQuickPicker from './RecurringQuickPicker'
import { getReadyRecurringTasks } from '../utils/recurringUtils'
import { getTodaySubtitle, getListState } from '../utils/todaySubtitle'

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
const { today, recurring, addTodayTask, deleteTask, editTask, reorderTodayTasks, sortTodayByCompletion, sortTodayByPriority, settings, updateSettings, loadFromCloudAndMerge } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [showList, setShowList] = useState(false)
  const [todayPrompt, setTodayPrompt] = useState(
    () => getTodaySubtitle({ today, dayStart: settings.dayStart })
  )
  const [showBacklogPicker, setShowBacklogPicker] = useState(false)
  const [showRecurringPicker, setShowRecurringPicker] = useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const hideFinished = settings.hideFinishedToday ?? false
  const inputRef = useRef(null)
  const prevListStateRef = useRef(getListState(today))
  const pullStartY = useRef(0)
  const pullCurrentY = useRef(0)
  const isPulling = useRef(false)

  const doneCount = today.filter(t => t.done).length
  const undoneCount = today.filter(t => !t.done).length
  const showCounter = today.length > 5
  const hasPrioritized = today.some(t => t.priorityScore !== null)
  const listState = getListState(today)
  // Offer collapsing finished tasks once there are enough of them to feel noisy
  const showHideFinishedToggle = doneCount > 0 && (doneCount >= 5 || today.length > 10)
  const visibleToday = hideFinished ? today.filter(t => !t.done) : today

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

  // Mirror list view to task presence — empty list returns to TopPrompt
  useEffect(() => {
    setShowList(today.length > 0)
  }, [today.length])

  // Re-pick subtitle when the list's state changes (empty ↔ pending ↔ all_done)
  useEffect(() => {
    const nextState = getListState(today)
    if (nextState !== prevListStateRef.current) {
      setTodayPrompt(getTodaySubtitle({ today, dayStart: settings.dayStart }))
      prevListStateRef.current = nextState
    }
  }, [today, settings.dayStart])

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
    <div className="max-w-2xl mx-auto px-4 py-8">
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

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-normal text-ink">Today</h1>
        <p className={`text-ink-muted italic ${listState === 'empty' ? 'text-3xl mt-4 leading-snug' : 'text-sm mt-1'}`}>{todayPrompt}</p>
      </div>

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
              <div className="flex items-center gap-4 text-sm text-ink-muted">
                <span>
                  <strong className="text-ink">{undoneCount}</strong> to do
                </span>
                <span className="text-ink-faint">•</span>
                <span>
                  <strong className="text-ink">{doneCount}</strong> done
                </span>
              </div>
              {hasPrioritized && (
                <button
                  onClick={sortTodayByPriority}
                  className="text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Sort by priority
                </button>
              )}
              {doneCount > 0 && undoneCount > 0 && (
                <button
                  onClick={sortTodayByCompletion}
                  className="text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1"
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
          <div className="bg-card rounded-lg shadow-sm border border-edge overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={visibleToday.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-edge">
                  {visibleToday.map((task) => (
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

          {/* Show/hide finished tasks toggle */}
          {showHideFinishedToggle && (
            <div className="flex justify-center -mt-2">
              <button
                onClick={() => updateSettings({ hideFinishedToday: !hideFinished })}
                className="text-xs text-ink-muted hover:text-ink transition-colors underline underline-offset-2"
              >
                {hideFinished
                  ? `Show ${doneCount} finished ${doneCount === 1 ? 'task' : 'tasks'}`
                  : `Hide ${doneCount} finished ${doneCount === 1 ? 'task' : 'tasks'}`}
              </button>
            </div>
          )}

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

      <style>{`
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
