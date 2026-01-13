import React from 'react'
import useStore from '../store/useStore'

function BacklogQuickPicker({ onClose }) {
  const { backlog, addFromBacklog } = useStore()

  const handleSelect = (id) => {
    addFromBacklog(id)
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
        <div className="bg-white rounded-lg shadow-xl border border-calm-200 w-full max-w-md max-h-[80vh] flex flex-col animate-slideUp">
          {/* Header */}
          <div className="px-6 py-4 border-b border-calm-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-calm-700">Add from Backlog</h2>
            <button
              onClick={onClose}
              className="text-calm-400 hover:text-calm-600 transition-colors"
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
              <div className="p-8 text-center text-calm-600">
                <p className="text-sm">Your backlog is empty.</p>
                <p className="text-xs mt-2 text-calm-500">
                  Go to the Backlog tab to add tasks for later.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-calm-100">
                {backlog.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(task.id)}
                    className="w-full px-6 py-3 text-left hover:bg-calm-50 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm text-calm-700">{task.title}</span>
                    <span className="text-xs text-calm-400 group-hover:text-calm-600 transition-colors">
                      Add →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-calm-200 bg-calm-50">
            <button
              onClick={onClose}
              className="text-sm text-calm-600 hover:text-calm-700 transition-colors"
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
