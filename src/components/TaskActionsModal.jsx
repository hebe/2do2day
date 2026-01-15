import React from 'react'

function TaskActionsModal({ task, onEdit, onMakeRecurring, onMoveToBacklog, onDelete, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl border-t md:border border-calm-200 w-full md:max-w-md animate-slideUp">
          {/* Header */}
          <div className="px-6 py-4 border-b border-calm-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-calm-500 uppercase tracking-wide mb-1">Task Options</p>
                <h2 className="text-base font-medium text-calm-700 truncate">
                  {task.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-calm-400 hover:text-calm-600 transition-colors"
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
          <div className="p-4 space-y-2">
            <button
              onClick={onEdit}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-calm-700 hover:bg-calm-50 rounded-lg transition-colors"
            >
              <span className="text-xl">✏️</span>
              <span className="text-base font-medium">Edit</span>
            </button>

            <button
              onClick={onMakeRecurring}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-calm-700 hover:bg-calm-50 rounded-lg transition-colors"
            >
              <span className="text-xl">↻</span>
              <span className="text-base font-medium">Make recurring</span>
            </button>

            <button
              onClick={onMoveToBacklog}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-calm-700 hover:bg-calm-50 rounded-lg transition-colors"
            >
              <span className="text-xl">📦</span>
              <span className="text-base font-medium">Move to backlog</span>
            </button>

            {/* Category section - placeholder for future */}
            <div className="pt-2 border-t border-calm-100">
              <p className="text-xs text-calm-500 uppercase tracking-wide px-4 py-2">
                Category (coming soon)
              </p>
              <div className="flex gap-2 px-4 py-2">
                <button className="flex-1 px-3 py-2 rounded-lg border-2 border-calm-200 text-xs text-calm-400">
                  Work
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg border-2 border-calm-200 text-xs text-calm-400">
                  Personal
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg border-2 border-calm-200 text-xs text-calm-400">
                  Urgent
                </button>
              </div>
            </div>

            {/* Delete button - separated */}
            <div className="pt-2">
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <span className="text-xl">🗑️</span>
                <span className="text-base font-medium">Delete</span>
              </button>
            </div>
          </div>

          {/* Cancel button for mobile */}
          <div className="p-4 pt-0 md:hidden">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-center text-calm-600 font-medium"
            >
              Cancel
            </button>
          </div>
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
