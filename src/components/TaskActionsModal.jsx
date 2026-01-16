import React from 'react'

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
  const isToday = type === 'today'
  const isBacklog = type === 'backlog'
  const isRecurring = type === 'recurring'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl border-t border-calm-200 dark:border-gray-700 w-full max-w-2xl animate-slideUp overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-calm-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-calm-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {isToday && 'Task Options'}
                  {isBacklog && 'Backlog Task'}
                  {isRecurring && 'Recurring Task'}
                </p>
                <h2 className="text-base font-medium text-calm-700 dark:text-gray-100 line-clamp-2">
                  {task.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-calm-400 dark:text-gray-500 hover:text-calm-600 dark:hover:text-gray-300 transition-colors -mt-1"
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
              className="w-full flex items-center gap-4 px-5 py-4 text-left text-calm-700 dark:text-gray-200 hover:bg-calm-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span className="text-2xl">✏️</span>
              <span className="text-base font-medium">Edit</span>
            </button>

            {isToday && onMakeRecurring && (
              <button
                onClick={onMakeRecurring}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-calm-700 dark:text-gray-200 hover:bg-calm-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">↻</span>
                <span className="text-base font-medium">Make recurring</span>
              </button>
            )}

            {isBacklog && onMakeRecurring && (
              <button
                onClick={onMakeRecurring}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-calm-700 dark:text-gray-200 hover:bg-calm-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">↻</span>
                <span className="text-base font-medium">Mark as recurring</span>
              </button>
            )}

            {isRecurring && onMakeRecurring && (
              <button
                onClick={onMakeRecurring}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-calm-700 dark:text-gray-200 hover:bg-calm-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">🔄</span>
                <span className="text-base font-medium">Change interval</span>
              </button>
            )}

            {isToday && onMoveToBacklog && (
              <button
                onClick={onMoveToBacklog}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-calm-700 dark:text-gray-200 hover:bg-calm-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">📦</span>
                <span className="text-base font-medium">Move to backlog</span>
              </button>
            )}

            {(isBacklog || isRecurring) && onMoveToToday && (
              <button
                onClick={onMoveToToday}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-calm-700 dark:text-gray-200 hover:bg-calm-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <span className="text-2xl">→</span>
                <span className="text-base font-medium">Add to Today</span>
              </button>
            )}

            {/* Category section - placeholder for future */}
            <div className="pt-3 border-t border-calm-100 dark:border-gray-700">
              <p className="text-xs text-calm-500 dark:text-gray-400 uppercase tracking-wide px-5 py-2">
                Category (coming soon)
              </p>
              <div className="flex gap-2 px-5 py-2">
                <button className="flex-1 px-3 py-2 rounded-lg border-2 border-calm-200 dark:border-gray-600 text-xs text-calm-400 dark:text-gray-500">
                  Work
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg border-2 border-calm-200 dark:border-gray-600 text-xs text-calm-400 dark:text-gray-500">
                  Personal
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg border-2 border-calm-200 dark:border-gray-600 text-xs text-calm-400 dark:text-gray-500">
                  Urgent
                </button>
              </div>
            </div>

            {/* Delete button - separated */}
            <div className="pt-3">
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-4 px-5 py-4 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
      `}</style>
    </>
  )
}

export default TaskActionsModal
