import React from 'react'
import useStore from '../store/useStore'
import { getRecurrenceDescription } from '../utils/recurringUtils'

function RecurringQuickPicker({ readyTasks, onClose }) {
  const { addFromRecurring } = useStore()

  const handleSelect = (id) => {
    addFromRecurring(id)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl border border-edge w-full max-w-md max-h-[80vh] flex flex-col animate-slideUp">
          {/* Header */}
          <div className="px-6 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink flex items-center gap-2">
              <span>💫</span>
              <span>Recurring Tasks Ready</span>
            </h2>
            <button
              onClick={onClose}
              className="text-ink-faint hover:text-ink-muted transition-colors"
              aria-label="Close"
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
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {readyTasks.length === 0 ? (
              <div className="p-8 text-center text-ink-muted">
                <p className="text-sm">No recurring tasks ready right now.</p>
                <p className="text-xs mt-2 text-ink-muted">
                  Check back later or view all in the Backlog tab.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-edge">
                {readyTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(task.id)}
                    className="w-full px-6 py-3 text-left hover:bg-hover transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm text-ink font-medium">
                          {task.title}
                        </div>
                        <div className="text-xs text-ink-muted mt-1">
                          {getRecurrenceDescription(task)}
                        </div>
                      </div>
                      <span className="text-xs text-ink-faint group-hover:text-ink-muted dark:group-hover:text-ink-faint transition-colors whitespace-nowrap">
                        Add →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-edge bg-hover">
            <button
              onClick={onClose}
              className="text-sm text-ink-muted hover:text-ink transition-colors"
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
            transform: translateY(20px);
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

export default RecurringQuickPicker
