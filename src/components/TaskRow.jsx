import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import RecurringIntervalModal from './RecurringIntervalModal'
import TaskActionsModal from './TaskActionsModal'
import useSwipeGesture from '../hooks/useSwipeGesture'

// Map category IDs to CSS class names
const getCategoryRowClass = (categoryId) => {
  const classMap = {
    'work': 'cat-row-work',
    'personal': 'cat-row-personal',
    'health': 'cat-row-health',
    'hobby': 'cat-row-hobby',
  }
  return classMap[categoryId] || ''
}

function TaskRow({ task, onDelete, onEdit, index, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const { toggleDone, toggleUrgent, updateTaskCategory, moveToBacklog, moveTodayToRecurring, settings } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef(null)

  // Swipe gestures
  const { handlers: swipeHandlers, swipeOffset } = useSwipeGesture({
    onSwipeRight: () => {
      moveToBacklog(task.id)
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

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleDelete = () => {
    onDelete(task.id)
    setShowMenu(false)
  }

  const handleMoveToBacklog = () => {
    moveToBacklog(task.id)
    setShowMenu(false)
  }

  const handleMakeRecurring = () => {
    setShowRecurringModal(true)
    setShowMenu(false)
  }

  const handleRecurringConfirm = (interval) => {
    moveTodayToRecurring(task.id, interval)
    setShowRecurringModal(false)
  }

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== task.title) {
      onEdit(task.id, editValue.trim())
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

  const getCategory = (categoryId) => {
    if (!categoryId) return null
    return settings.categories?.find(c => c.id === categoryId) || null
  }

  const category = getCategory(task.category)
  const categoryClass = getCategoryRowClass(task.category)

  // Editing mode
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-calm-50 dark:bg-gray-700">
        <div className="flex-shrink-0 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 px-3 py-1 text-base border border-calm-300 dark:border-gray-600 rounded focus:outline-none focus:border-calm-600 dark:focus:border-gray-400 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSaveEdit}
          className="px-3 py-1 text-xs bg-calm-700 dark:bg-gray-600 text-white rounded hover:bg-calm-600 dark:hover:bg-gray-500 transition-colors font-medium"
        >
          Save
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancelEdit}
          className="px-3 py-1 text-xs text-calm-600 dark:text-gray-400 hover:text-calm-700 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Swipe reveal background - shows on swipe */}
      <div className="relative bg-gray-300 dark:bg-gray-600">
        <div
          {...swipeHandlers}
          draggable={!isEditing}
          onDragStart={(e) => {
            setIsDragging(true)
            onDragStart(e, index)
          }}
          onDragEnd={(e) => {
            setIsDragging(false)
            onDragEnd(e)
          }}
          onDragOver={(e) => onDragOver(e, index)}
          onDrop={(e) => onDrop(e, index)}
          style={{
            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
            transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none',
          }}
          className={`relative flex items-center gap-3 p-4 transition-colors group ${
            isDragging ? 'opacity-50' : ''
          } cursor-grab active:cursor-grabbing ${
            categoryClass 
              ? categoryClass 
              : 'bg-white dark:bg-gray-800 hover:bg-calm-50 dark:hover:bg-gray-700'
          }`}
        >
          {/* Checkbox */}
          <button
            onClick={() => toggleDone(task.id)}
            className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-500 hover:border-gray-600 dark:hover:border-gray-300 transition-colors flex items-center justify-center bg-white/50 dark:bg-gray-800/50"
            aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.done && (
              <svg
                className="w-3 h-3 text-gray-600 dark:text-gray-300"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Task title with urgent indicator */}
          <div className="flex-1 flex items-center gap-2 pr-4">
            {/* Urgent fire emoji */}
            {task.urgent && (
              <span className="text-lg flex-shrink-0" title="Urgent">
                🔥
              </span>
            )}
            
            <span
              className={`flex-1 text-base ${
                task.done 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-gray-100'
              } transition-all`}
            >
              {task.title}
            </span>
          </div>

          {/* Quick action buttons - visible on hover (desktop) */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Urgent button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleUrgent(task.id)
              }}
              className={`p-1.5 rounded transition-colors ${
                task.urgent
                  ? 'bg-orange-200 dark:bg-orange-900/50'
                  : 'hover:bg-white/50 dark:hover:bg-gray-900/50'
              }`}
              title={task.urgent ? "Remove urgent" : "Mark as urgent"}
            >
              {task.urgent ? '🔥' : (
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop menu button - hidden on mobile */}
          <div className="hidden md:block flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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

      {/* Mobile modal - always render when showMenu is true */}
      {showMenu && (
        <TaskActionsModal
          task={task}
          onEdit={handleEdit}
          onMakeRecurring={handleMakeRecurring}
          onMoveToBacklog={handleMoveToBacklog}
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

export default TaskRow
