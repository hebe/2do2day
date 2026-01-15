import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import RecurringIntervalModal from './RecurringIntervalModal'
import useSwipeGesture from '../hooks/useSwipeGesture'

function TaskRow({ task, onDelete, onEdit, index, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const { toggleDone, moveToBacklog, moveTodayToRecurring } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef(null)

  // Swipe gestures
  const { handlers: swipeHandlers, swipeOffset } = useSwipeGesture({
    onSwipeRight: () => {
      // Swipe right = move to backlog
      moveToBacklog(task.id)
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

  // Editing mode
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-calm-50">
        <div className="flex-shrink-0 w-5 h-5" /> {/* Spacer for checkbox */}
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 px-3 py-1 text-base border border-calm-300 rounded focus:outline-none focus:border-calm-600 transition-colors"
        />
        <button
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
          onClick={handleSaveEdit}
          className="px-3 py-1 text-xs bg-calm-700 text-white rounded hover:bg-calm-600 transition-colors font-medium"
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
    <>
      <div className="relative overflow-hidden" style={{ backgroundColor: '#DFD8C7' }}>
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
            transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none'
          }}
          className={`relative flex items-center gap-3 p-4 bg-white hover:bg-calm-50 transition-colors group ${
            isDragging ? 'opacity-50' : ''
          }`}
        >
        {/* Checkbox */}
        <button
          onClick={() => toggleDone(task.id)}
          className="flex-shrink-0 w-5 h-5 rounded border-2 border-calm-300 hover:border-calm-600 transition-colors flex items-center justify-center"
          aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.done && (
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
          )}
        </button>

        {/* Task title */}
        <span
          className={`flex-1 text-base ${
            task.done
              ? 'line-through text-calm-400'
              : 'text-calm-700'
          } transition-all`}
        >
          {task.title}
        </span>

        {/* Actions menu */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative">
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
                <button
                  onClick={handleMakeRecurring}
                  className="w-full px-4 py-2 text-left text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                >
                  ↻ Make recurring
                </button>
                <button
                  onClick={handleMoveToBacklog}
                  className="w-full px-4 py-2 text-left text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                >
                  📦 Move to backlog
                </button>
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
      </div>

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
