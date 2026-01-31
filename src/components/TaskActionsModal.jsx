import React from 'react'
import useStore from '../store/useStore'
import { getCategoryOKLab } from '../utils/colorUtils'

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
    settings
  } = useStore()

  const isToday = type === 'today'
  const isBacklog = type === 'backlog'
  const isRecurring = type === 'recurring'

  const categories = settings.categories || []

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
                <span className="text-sm font-medium">{task.urgent ? 'Urgent' : 'Not urgent'}</span>
              </button>
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

                {/* Category chips - using dynamic colors */}
                {categories.map((category) => {
                  const categoryOKLab = getCategoryOKLab(category.color)
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      style={{
                        '--accent': categoryOKLab
                      }}
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
