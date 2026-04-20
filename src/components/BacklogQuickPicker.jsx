import React from 'react'
import useStore from '../store/useStore'
import { sortBacklog, BACKLOG_SORT_OPTIONS } from '../utils/backlogSort'

function BacklogQuickPicker({ onClose }) {
  const { backlog, addFromBacklog, settings, updateSettings } = useStore()
  const sortBy = settings.backlogSortBy || 'manual'

  const handleSelect = (id) => {
    addFromBacklog(id)
    onClose()
  }

  const handleSortChange = (newSort) => {
    updateSettings({ backlogSortBy: newSort })
  }

  const sortedBacklog = sortBacklog(backlog, sortBy, settings.categories || [])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
        <div className="bg-card rounded-lg shadow-xl border border-edge w-full max-w-md max-h-[80vh] flex flex-col animate-slideUp">
          {/* Header — sort control replaces the title */}
          <div className="px-6 py-4 border-b border-edge flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-ink-muted shrink-0">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs px-3 py-1 border border-edge-strong rounded focus:outline-none focus:border-edge-strong transition-colors bg-card text-ink"
              >
                {BACKLOG_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              className="text-ink-faint hover:text-ink-muted transition-colors shrink-0"
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
            {backlog.length === 0 ? (
              <div className="p-8 text-center text-ink-muted">
                <p className="text-sm">Your backlog is empty.</p>
                <p className="text-xs mt-2 text-ink-muted">
                  Go to the Backlog tab to add tasks for later.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-edge">
                {sortedBacklog.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(task.id)}
                    className="w-full px-6 py-3 text-left hover:bg-hover transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm text-ink">{task.title}</span>
                    <span className="text-xs text-ink-faint group-hover:text-ink-muted dark:group-hover:text-ink-faint transition-colors">
                      Add →
                    </span>
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

export default BacklogQuickPicker
