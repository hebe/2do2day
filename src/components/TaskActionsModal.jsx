import React, { useState } from 'react'
import useStore from '../store/useStore'
import { getCategoryOKLab } from '../utils/colorUtils'

// P1: Urgent + Important (do first)
// P2: Not Urgent + Important (schedule)
// P3: Urgent + Not Important (delegate)
// P4: Not Urgent + Not Important (eliminate)
const QUADRANTS = [
  { id: 'P2', label: 'Schedule',  desc: 'Important, not urgent', urgent: false, important: true,  baseScore: 50, emoji: '📅' },
  { id: 'P1', label: 'Do First',  desc: 'Urgent & important',    urgent: true,  important: true,  baseScore: 75, emoji: '🚨' },
  { id: 'P4', label: 'Someday Funday', desc: 'Not urgent or important', urgent: false, important: false, baseScore: 0,  emoji: '☀️' },
  { id: 'P3', label: 'Delegate',  desc: 'Urgent, not important', urgent: true,  important: false, baseScore: 25, emoji: '👋' },
]

function getActiveQuadrant(task) {
  if (task.priorityScore === null && !task.important) return null
  if (task.urgent && task.important) return 'P1'
  if (!task.urgent && task.important) return 'P2'
  if (task.urgent && !task.important) return 'P3'
  if (!task.urgent && !task.important) return 'P4'
  return null
}

function TaskActionsModal({
  task,
  onEdit,
  onMakeRecurring,
  onMoveToBacklog,
  onMoveToToday,
  onMarkAsDone,
  onDelete,
  onClose,
  type = 'today'
}) {
  const {
    toggleUrgent,
    toggleBacklogUrgent,
    toggleRecurringUrgent,
    updateTaskCategory,
    updateBacklogCategory,
    updateRecurringCategory,
    setTaskQuadrant,
    settings
  } = useStore()

  const isToday = type === 'today'
  const isBacklog = type === 'backlog'
  const isRecurring = type === 'recurring'

  const categories = settings.categories || []
  const activeQuadrant = getActiveQuadrant(task)
  const [showQuadrant, setShowQuadrant] = useState(false)

  const handleToggleUrgent = () => {
    if (isToday) {
      toggleUrgent(task.id)
    } else if (isBacklog) {
      toggleBacklogUrgent(task.id)
    } else if (isRecurring) {
      toggleRecurringUrgent(task.id)
    }
    onClose()
  }

  const handleCategorySelect = (categoryId) => {
    if (isToday) {
      updateTaskCategory(task.id, categoryId)
    } else if (isBacklog) {
      updateBacklogCategory(task.id, categoryId)
    } else if (isRecurring) {
      updateRecurringCategory(task.id, categoryId)
    }
  }

  const handleQuadrantSelect = (quadrant) => {
    if (activeQuadrant === quadrant.id) {
      // Deselect — clear priority
      setTaskQuadrant(task.id, false, false, null)
    } else {
      setTaskQuadrant(task.id, quadrant.important, quadrant.urgent, quadrant.baseScore)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl border-t border-gray-200 dark:border-gray-700 w-full max-w-2xl animate-slideUp overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {isToday && 'Task Options'}
                  {isBacklog && 'Backlog Task'}
                  {isRecurring && 'Recurring Task'}
                </p>
                <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {task.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors -mt-1"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 space-y-3">
            {/* Edit and Urgent toggle - side by side */}
            <div className="flex gap-3">
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
              >
                <span className="text-xl">✏️</span>
                <span className="text-sm font-medium">Edit</span>
              </button>

              <button
                onClick={handleToggleUrgent}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors border ${
                  task.urgent
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">🔥</span>
                <span className="text-sm font-medium">{task.urgent ? 'Urgent' : 'Make urgent'}</span>
              </button>
            </div>

            {/* Eisenhower quadrant picker - collapsible */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => setShowQuadrant(!showQuadrant)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">⊞</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Priority
                  </span>
                  {activeQuadrant && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {activeQuadrant === 'P1' ? '🎯 Do First' :
                      activeQuadrant === 'P2' ? '📅 Schedule' :
                      activeQuadrant === 'P3' ? '👋 Delegate' :
                      '☀️ Someday Funday'}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showQuadrant ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showQuadrant && (
                <div className="px-4 pb-3">
                  {activeQuadrant && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 block mb-2">tap to deselect</span>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 grid grid-cols-2 px-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">not urgent</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">urgent</span>
                    </div>
                    {QUADRANTS.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleQuadrantSelect(q)}
                        className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl text-sm transition-all border ${
                          activeQuadrant === q.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300 dark:ring-indigo-600'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-lg">{q.emoji}</span>
                        <span className="font-medium text-xs">{q.label}</span>
                        <span className="text-xs opacity-60 text-center leading-tight">{q.desc}</span>
                      </button>
                    ))}
                    <div className="col-span-2 grid grid-cols-2 px-1 mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">important</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">not important</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category inline picker - horizontal scrollable chips */}
            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">🏷️</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Category</span>
              </div>
              <div className="flex gap-2 overflow-x-auto py-1 -mx-1 px-1 scrollbar-hide">
                {/* No category option */}
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    !task.category
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 ring-2 ring-gray-400 dark:ring-gray-500'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  None
                </button>

                {/* Category chips */}
                {categories.map((category) => {
                  const categoryOKLab = getCategoryOKLab(category.color)
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      style={{ '--accent': categoryOKLab }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all cat-chip ${
                        task.category === category.id
                          ? 'ring-2 ring-gray-500 dark:ring-gray-400'
                          : 'hover:opacity-80'
                      }`}
                    >
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Primary actions row - Today/Recurring buttons */}
            {(isBacklog || isRecurring) && (
              <div className="flex gap-3">
                {onMoveToToday && (
                  <button
                    onClick={onMoveToToday}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors font-medium"
                  >
                    <span className="text-xl">←</span>
                    <span className="text-sm">Add to Today</span>
                  </button>
                )}

                {onMakeRecurring && (
                  <button
                    onClick={onMakeRecurring}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xl">{isRecurring ? '🔄' : '↻'}</span>
                    <span className="text-sm font-medium">{isRecurring ? 'Change interval' : 'Make recurring'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Today view actions */}
            {isToday && (
              <div className="flex gap-3">
                {onMoveToBacklog && (
                  <button
                    onClick={onMoveToBacklog}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xl">📦</span>
                    <span className="text-sm font-medium">Move to backlog</span>
                  </button>
                )}

                {onMakeRecurring && (
                  <button
                    onClick={onMakeRecurring}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xl">↻</span>
                    <span className="text-sm font-medium">Make recurring</span>
                  </button>
                )}
              </div>
            )}

            {/* Bottom actions row - Done/Delete */}
            <div className="flex gap-3 pt-2">
              {isBacklog && onMarkAsDone && (
                <button
                  onClick={onMarkAsDone}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors border border-green-200 dark:border-green-800"
                >
                  <span className="text-xl">✓</span>
                  <span className="text-sm font-medium">Mark as done</span>
                </button>
              )}

              <button
                onClick={onDelete}
                className={`${isBacklog && onMarkAsDone ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-red-200 dark:border-red-800`}
              >
                <span className="text-xl">🗑️</span>
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>

          {/* Bottom padding for safe area */}
          <div className="h-6"></div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}

export default TaskActionsModal
