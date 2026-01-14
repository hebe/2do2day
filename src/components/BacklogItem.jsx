import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import RecurringIntervalModal from './RecurringIntervalModal'
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
      // Swipe right = add to today
      if (type === 'backlog') {
        addFromBacklog(task.id)
      } else if (type === 'recurring') {
        addFromRecurring(task.id)
      }
    },
    onSwipeLeft: () => {
      // Swipe left = show menu
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
      // Note: recurring task editing can be added similarly if needed
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
        <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-calm-300 flex items-center justify-center bg-calm-100">
          <svg
            className="w-3 h-3 text-calm-600"
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
          <span className="text-sm text-calm-700">{task.title}</span>
          {task.completedAt && (
            <p className="text-xs text-calm-500 mt-1">
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
      <div className="flex items-center gap-3 p-4 bg-calm-50">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 px-3 py-1 text-sm border border-calm-300 rounded focus:outline-none focus:border-calm-600 transition-colors"
        />
        <button
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
          onClick={handleSaveEdit}
          className="px-3 py-1 text-xs bg-calm-700 text-white rounded hover:bg-calm-600 transition-colors"
        >
          Save
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
          onClick={handleCancelEdit}
          className="px-3 py-1 text-xs text-calm-600 hover:text-calm-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
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
      className={`relative flex items-center gap-3 p-4 hover:bg-calm-50 transition-colors group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Swipe indicator */}
      {type !== 'done' && swipeOffset > 50 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-calm-500 text-sm">
          → Today
        </div>
      )}
      {type !== 'done' && swipeOffset < -50 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-calm-500 text-sm">
          Menu ←
        </div>
      )}

      {/* Task title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-calm-700 block">
            {task.title}
            {type === 'recurring' && task.interval && (
              <span className="ml-2 text-xs text-calm-500">
                ↻ {task.interval === 'daily' && 'Daily'}
                {task.interval === 'weekdays' && 'Weekdays'}
                {task.interval === 'weekly' && 'Weekly'}
                {task.interval === 'biweekly' && 'Biweekly'}
                {task.interval === 'monthly' && 'Monthly'}
                {task.interval === 'manual' && 'Manual'}
              </span>
            )}
            {type === 'recurring' && !task.interval && (
              <span className="ml-2 text-xs text-calm-500">↻</span>
            )}
          </span>
          {type === 'backlog' && task.addedToBacklogCount && task.addedToBacklogCount >= 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Postponed {task.addedToBacklogCount}x
            </span>
          )}
        </div>
        {type === 'backlog' && task.addedToBacklogCount && task.addedToBacklogCount < 3 && task.addedToBacklogCount > 1 && (
          <p className="text-xs text-calm-500 mt-1">
            Postponed {task.addedToBacklogCount} times
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Add to Today button - compact on mobile */}
        <button
          onClick={handleAddToToday}
          className="px-2 py-1 text-xs text-calm-700 bg-calm-100 hover:bg-calm-200 rounded transition-colors font-medium whitespace-nowrap"
        >
          ← Today
        </button>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-calm-400 hover:text-calm-600 transition-colors"
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

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-calm-200 py-1 z-20">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                >
                  ✏️ Edit
                </button>
                {type === 'backlog' && (
                  <button
                    onClick={handleMarkRecurring}
                    className="w-full px-4 py-2 text-left text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                  >
                    ↻ Mark as recurring
                  </button>
                )}
                {type === 'recurring' && (
                  <button
                    onClick={handleMarkRecurring}
                    className="w-full px-4 py-2 text-left text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                  >
                    🔄 Change interval
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recurring Interval Modal */}
      {showRecurringModal && (
        <RecurringIntervalModal
          task={task}
          onConfirm={handleRecurringConfirm}
          onCancel={() => setShowRecurringModal(false)}
        />
      )}
    </div>
  )
}

export default BacklogItem
