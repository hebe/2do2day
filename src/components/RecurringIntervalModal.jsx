import React, { useState } from 'react'

function RecurringIntervalModal({ task, onConfirm, onCancel }) {
  const [selectedInterval, setSelectedInterval] = useState('daily')

  const intervals = [
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekdays', label: 'Weekdays (Mon-Fri)', icon: '🗓️' },
    { value: 'weekly', label: 'Weekly', icon: '📆' },
    { value: 'biweekly', label: 'Every 2 weeks', icon: '📊' },
    { value: 'monthly', label: 'Monthly', icon: '🗒️' },
    { value: 'manual', label: "Manual (I'll add it when needed)", icon: '✋' },
  ]

  const handleConfirm = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onConfirm(selectedInterval)
  }

  const handleCancel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onCancel()
  }

  const handleBackdropClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onCancel()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl border border-calm-200 w-full max-w-md animate-slideUp">
          {/* Header */}
          <div className="px-6 py-4 border-b border-calm-200">
            <h2 className="text-lg font-medium text-calm-700">Make Recurring</h2>
            <p className="text-sm text-calm-600 mt-1">
              How often should &quot;{task.title}&quot; repeat?
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
            {intervals.map((interval) => (
              <button
                key={interval.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedInterval(interval.value)
                }}
                className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                  selectedInterval === interval.value
                    ? 'border-calm-600 bg-calm-50'
                    : 'border-calm-200 hover:border-calm-300 hover:bg-calm-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{interval.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-calm-700">
                      {interval.label}
                    </div>
                  </div>
                  {selectedInterval === interval.value && (
                    <svg
                      className="w-5 h-5 text-calm-600"
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
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-calm-200 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-calm-600 hover:text-calm-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-sm bg-calm-700 text-white rounded-lg hover:bg-calm-600 transition-colors font-medium"
            >
              Set Recurring
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

export default RecurringIntervalModal
