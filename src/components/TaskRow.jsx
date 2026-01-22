import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import RecurringIntervalModal from './RecurringIntervalModal'
import TaskActionsModal from './TaskActionsModal'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getCategoryOKLab } from '../utils/colorUtils'

function TaskRow({ task, onDelete, onEdit }) {
  const { toggleDone, toggleUrgent, moveToBacklog, moveTodayToRecurring, settings } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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

  const handleRecurringConfirm = (interval, recurrenceDays = []) => {
    moveTodayToRecurring(task.id, interval, recurrenceDays)
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
  const categoryOKLab = category ? getCategoryOKLab(category.color) : null

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
      <div
        ref={setNodeRef}
        style={{
          ...style,
          ...(categoryOKLab && { '--accent': categoryOKLab })
        }}
        className={`relative flex items-center gap-3 p-4 transition-colors group ${
          isDragging ? 'opacity-50 shadow-lg z-10' : ''
        } ${
          categoryOKLab
            ? 'cat-row'
            : 'bg-white dark:bg-gray-800 hover:bg-calm-50 dark:hover:bg-gray-700'
        }`}
      >
        {/* Drag handle - using activator pattern for touch-friendly dragging */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-6 h-6 -ml-1 rounded hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition touch-none flex items-center justify-center cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-gray-400">
            <path
              fill="currentColor"
              d="M7 4h2v2H7V4zm4 0h2v2h-2V4zM7 9h2v2H7V9zm4 0h2v2h-2V9zM7 14h2v2H7v-2zm4 0h2v2h-2v-2z"
            />
          </svg>
        </button>

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

        {/* Task title with indicators */}
        <div
          className="flex-1 flex items-center gap-2 pr-4 cursor-pointer"
          onClick={() => setShowMenu(true)}
        >
          {/* Status indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Recurring star emoji */}
            {task.fromRecurring && (
              <span className="text-lg" title="From recurring task">
                💫
              </span>
            )}

            {/* Urgent fire emoji */}
            {task.urgent && (
              <span className="text-lg" title="Urgent">
                🔥
              </span>
            )}
          </div>

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
