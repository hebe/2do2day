import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import RecurringIntervalModal from './RecurringIntervalModal'
import TaskActionsModal from './TaskActionsModal'
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

  // Editing mode
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-calm-50">
        <div className="flex-shrink-0 w-5 h-5" />
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSaveEdit}
          className="px-3 py-1 text-xs bg-calm-700 text-white rounded hover:bg-calm-600 transition-colors font-medium"
        >
          Save
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
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
      <div className="relative" style={{ backgroundColor: '#DFD8C7' }}>
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
          } cursor-grab active:cursor-grabbing`}
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
            className={`flex-1 text-base pr-4 ${
              task.done ? 'line-through text-calm-400' : 'text-calm-700'
            } transition-all`}
          >
            {task.title}
          </span>
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
