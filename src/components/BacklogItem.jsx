import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import RecurringIntervalModal from './RecurringIntervalModal'
import TaskActionsModal from './TaskActionsModal'
import useSwipeGesture from '../hooks/useSwipeGesture'

function BacklogItem({ task, type, index, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const { 
    addFromBacklog, 
    deleteBacklogTask, 
    editBacklogTask,
    moveBacklogToRecurring,
    updateRecurringInterval,
    addFromRecurring,
    deleteRecurringTask
  } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef(null)

  // Swipe gestures for backlog items
  const { handlers: swipeHandlers, swipeOffset } = useSwipeGesture({
    onSwipeRight: () => {
      if (type === 'backlog') {
        addFromBacklog(task.id)
      } else if (type === 'recurring') {
        addFromRecurring(task.id)
      }
    },
    onSwipeLeft: () => {
      setShowMenu(true)
    },
    threshold: 80
  })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleAddToToday = () => {
    if (type === 'backlog') {
      addFromBacklog(task.id)
    } else if (type === 'recurring') {
      addFromRecurring(task.id)
    }
  }

  const handleMarkRecurring = () => {
    setShowRecurringModal(true)
    setShowMenu(false)
  }

  const handleRecurringConfirm = (interval) => {
    if (type === 'backlog') {
      moveBacklogToRecurring(task.id, interval)
    } else if (type === 'recurring') {
      updateRecurringInterval(task.id, interval)
    }
    setShowRecurringModal(false)
  }

  const handleDelete = () => {
    if (type === 'backlog') {
      deleteBacklogTask(task.id)
    } else if (type === 'recurring') {
      deleteRecurringTask(task.id)
    }
    setShowMenu(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== task.title) {
      if (type === 'backlog') {
        editBacklogTask(task.id, editValue.trim())
      }
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditValue(task.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  // Done tasks are read-only
  if (type === 'done') {
    return (
      <div className="flex items-center gap-3 p-4">
        <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <svg
            className="w-3 h-3 text-gray-600 dark:text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-sm text-gray-900 dark:text-gray-100">{task.title}</span>
          {task.completedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Completed {formatDate(task.completedAt)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-calm-50 dark:bg-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-gray-600 dark:focus:border-gray-400 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSaveEdit}
          className="px-3 py-1 text-xs bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
        >
          Save
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancelEdit}
          className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="relative bg-gray-300 dark:bg-gray-600">
        <div
          {...(type !== 'done' ? swipeHandlers : {})}
          draggable={!isEditing && type === 'backlog'}
          onDragStart={(e) => {
            if (type === 'backlog' && onDragStart) {
              setIsDragging(true)
              onDragStart(e, index)
            }
          }}
          onDragEnd={(e) => {
            if (type === 'backlog' && onDragEnd) {
              setIsDragging(false)
              onDragEnd(e)
            }
          }}
          onDragOver={(e) => type === 'backlog' && onDragOver && onDragOver(e, index)}
          onDrop={(e) => type === 'backlog' && onDrop && onDrop(e, index)}
          style={{
            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
            transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none'
          }}
          className={`relative flex items-center gap-3 p-4 bg-white dark:bg-gray-800 hover:bg-calm-50 dark:hover:bg-gray-700 transition-colors group ${
            isDragging ? 'opacity-50' : ''
          } ${type === 'backlog' && !isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          {/* Task title */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 dark:text-gray-100 block">
                {task.title}
                {type === 'recurring' && task.interval && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    ↻ {task.interval === 'daily' && 'Daily'}
                    {task.interval === 'weekdays' && 'Weekdays'}
                    {task.interval === 'weekly' && 'Weekly'}
                    {task.interval === 'biweekly' && 'Biweekly'}
                    {task.interval === 'monthly' && 'Monthly'}
                    {task.interval === 'manual' && 'Manual'}
                  </span>
                )}
                {type === 'recurring' && !task.interval && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">↻</span>
                )}
              </span>
              {type === 'backlog' && task.addedToBacklogCount && task.addedToBacklogCount >= 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                  Postponed {task.addedToBacklogCount}x
                </span>
              )}
            </div>
            {type === 'backlog' && task.addedToBacklogCount && task.addedToBacklogCount < 3 && task.addedToBacklogCount > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Postponed {task.addedToBacklogCount} times
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAddToToday}
              className="px-2 py-1 text-xs text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors font-medium whitespace-nowrap"
            >
              ← Today
            </button>

            {/* Desktop menu button - hidden on mobile */}
            <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                aria-label="More options"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Modal */}
      {showMenu && (
        <TaskActionsModal
          task={task}
          type={type}
          onEdit={handleEdit}
          onMakeRecurring={handleMarkRecurring}
          onMoveToToday={handleAddToToday}
          onDelete={handleDelete}
          onClose={() => setShowMenu(false)}
        />
      )}

      {/* Recurring Interval Modal */}
      {showRecurringModal && (
        <RecurringIntervalModal
          task={task}
          onConfirm={handleRecurringConfirm}
          onCancel={() => setShowRecurringModal(false)}
        />
      )}
    </>
  )
}

export default BacklogItem
