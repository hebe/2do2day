import React from 'react'
import useStore from '../store/useStore'
import { getCategoryOKLab } from '../utils/colorUtils'

function TaskActionsModal({ 
  task, 
  onEdit, 
  onMakeRecurring, 
  onMoveToBacklog, 
  onMoveToToday,
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
            <button
              onClick={onEdit}
              className="w-full flex items-center gap-4 px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span className="text-2xl">✏️</span>
              <span className="text-base font-medium">Edit</span>
            </button>

            {/* Category inline picker - horizontal scrollable chips */}
            <div className="px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl">🏷️</span>
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">Category</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 pt-2 -mx-1 px-1 scrollbar-hide">
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

            {/* Urgent toggle - available for all task types */}
            <button
              onClick={handleToggleUrgent}
              className="w-full flex items-center justify-between px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">🔥</span>
                <span className="text-base font-medium">Mark as urgent</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                task.urgent ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
                  task.urgent ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </div>
            </button>

            {isToday && onMakeRecurring && (
              <button
                onClick={onMakeRecurring}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">↻</span>
                <span className="text-base font-medium">Make recurring</span>
              </button>
            )}

            {isBacklog && onMakeRecurring && (
              <button
                onClick={onMakeRecurring}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">↻</span>
                <span className="text-base font-medium">Mark as recurring</span>
              </button>
            )}

            {isRecurring && onMakeRecurring && (
              <button
                onClick={onMakeRecurring}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">🔄</span>
                <span className="text-base font-medium">Change interval</span>
              </button>
            )}

            {isToday && onMoveToBacklog && (
              <button
                onClick={onMoveToBacklog}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">📦</span>
                <span className="text-base font-medium">Move to backlog</span>
              </button>
            )}

            {(isBacklog || isRecurring) && onMoveToToday && (
              <button
                onClick={onMoveToToday}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">→</span>
                <span className="text-base font-medium">Add to Today</span>
              </button>
            )}

            {/* Delete button - separated */}
            <div className="pt-3">
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <span className="text-2xl">🗑️</span>
                <span className="text-base font-medium">Delete</span>
              </button>
            </div>
          </div>

          {/* Bottom padding for safe area */}
          <div className="h-8"></div>
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
