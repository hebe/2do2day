import React, { useState } from 'react'

function RecurringIntervalModal({ task, onConfirm, onCancel }) {
  const [selectedInterval, setSelectedInterval] = useState('daily')
  const [selectedDays, setSelectedDays] = useState([]) // For weekly/biweekly
  const [selectedDate, setSelectedDate] = useState(1) // For monthly/yearly (1-31)
  const [selectedMonth, setSelectedMonth] = useState(1) // For yearly (1-12)

  const intervals = [
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekdays', label: 'Weekdays (Mon-Fri)', icon: '🗓️' },
    { value: 'weekly', label: 'Weekly', icon: '📆' },
    { value: 'biweekly', label: 'Every 2 weeks', icon: '📊' },
    { value: 'monthly', label: 'Monthly', icon: '🗒️' },
    { value: 'yearly', label: 'Yearly', icon: '🎂' },
    { value: 'manual', label: "Manual (I'll add it when needed)", icon: '✋' },
  ]

  const weekdays = [
    { value: 1, label: 'Mo' },
    { value: 2, label: 'Tu' },
    { value: 3, label: 'We' },
    { value: 4, label: 'Th' },
    { value: 5, label: 'Fr' },
    { value: 6, label: 'Sa' },
    { value: 0, label: 'Su' },
  ]

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleConfirm = (e) => {
    e.preventDefault()
    e.stopPropagation()

    let recurrenceDays = []

    if (selectedInterval === 'weekly' || selectedInterval === 'biweekly') {
      recurrenceDays = selectedDays.length > 0 ? selectedDays : [new Date().getDay()]
    } else if (selectedInterval === 'monthly') {
      recurrenceDays = [selectedDate]
    } else if (selectedInterval === 'yearly') {
      // Store as MMDD format (e.g., 1225 for Dec 25)
      recurrenceDays = [selectedMonth * 100 + selectedDate]
    }

    onConfirm(selectedInterval, recurrenceDays)
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

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const needsDaySelection = selectedInterval === 'weekly' || selectedInterval === 'biweekly'
  const needsDateSelection = selectedInterval === 'monthly' || selectedInterval === 'yearly'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-calm-200 dark:border-gray-700 w-full max-w-md animate-slideUp">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Make Recurring</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                How often should &quot;{task.title}&quot; repeat?
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
            {/* Interval Selection */}
            {intervals.map((interval) => (
              <div key={interval.value}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedInterval(interval.value)
                  }}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    selectedInterval === interval.value
                      ? 'border-calm-600 bg-calm-50 dark:border-calm-500 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{interval.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {interval.label}
                      </div>
                    </div>
                    {selectedInterval === interval.value && (
                      <svg className="w-5 h-5 text-calm-600 dark:text-calm-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Day Selection for Weekly/Biweekly - shown right below the selected option */}
                {selectedInterval === interval.value && (interval.value === 'weekly' || interval.value === 'biweekly') && (
                  <div className="mt-2 ml-4 pb-2">
                    <div className="flex gap-1.5">
                      {weekdays.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-2.5 py-1.5 text-sm rounded-md border-2 transition-all ${
                            selectedDays.includes(day.value)
                              ? 'border-calm-600 bg-calm-50 text-calm-700 dark:border-calm-500 dark:bg-gray-700 dark:text-calm-400'
                              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    {selectedDays.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        No day selected. Will default to today's day of the week.
                      </p>
                    )}
                  </div>
                )}

                {/* Date Selection for Monthly - shown right below the selected option */}
                {selectedInterval === interval.value && interval.value === 'monthly' && (
                  <div className="mt-2 ml-4 pb-2">
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(parseInt(e.target.value))}
                      className="w-32 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date and Month Selection for Yearly - shown right below the selected option */}
                {selectedInterval === interval.value && interval.value === 'yearly' && (
                  <div className="mt-2 ml-4 pb-2 flex gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {months.map((month, index) => (
                        <option key={index + 1} value={index + 1}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(parseInt(e.target.value))}
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-sm bg-calm-700 dark:bg-calm-600 text-white rounded-lg hover:bg-calm-600 dark:hover:bg-calm-500 transition-colors font-medium"
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
