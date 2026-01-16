import React, { useState } from 'react'
import useStore from '../store/useStore'

function SettingsView() {
  const { settings, updateSettings } = useStore()
  const [dayStart, setDayStart] = useState(settings.dayStart)
  const [colorMode, setColorMode] = useState(settings.colorMode || 'auto')
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    updateSettings({ dayStart, colorMode })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const timeOptions = [
    { value: '00:00', label: 'Midnight (00:00)' },
    { value: '01:00', label: '1:00 AM' },
    { value: '02:00', label: '2:00 AM' },
    { value: '03:00', label: '3:00 AM' },
    { value: '04:00', label: '4:00 AM' },
    { value: '05:00', label: '5:00 AM' },
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-calm-700">Settings</h1>
          <p className="text-sm text-calm-600 mt-1">
            Customize how Today's ToDos works for you.
          </p>
        </div>

        {/* Day Start Setting */}
        <div className="bg-white rounded-lg shadow-sm border border-calm-200 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-calm-700">When does your day start?</h2>
              <p className="text-sm text-calm-600 mt-1">
                At this time each day, your Today list will reset. Unfinished tasks move to the backlog, 
                and completed tasks are archived.
              </p>
            </div>

            <div className="space-y-2">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDayStart(option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    dayStart === option.value
                      ? 'border-calm-600 bg-calm-50'
                      : 'border-calm-200 hover:border-calm-300 hover:bg-calm-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-calm-700">
                      {option.label}
                    </span>
                    {dayStart === option.value && (
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

            <div className="pt-4">
              <button
                onClick={handleSave}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isSaved
                    ? 'bg-green-600 text-white'
                    : 'bg-[#F0A500] text-white hover:bg-[#D89400] shadow-sm'
                }`}
              >
                {isSaved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">How it works</h3>
              <p className="text-sm text-blue-800 mt-1">
                Every day at your chosen time, the app automatically starts fresh. 
                Tasks you didn't complete move to your backlog so you can pick them up later. 
                Completed tasks are saved to your "Done!" archive so you can celebrate your wins.
              </p>
            </div>
          </div>
        </div>

        {/* Stats (placeholder for future) */}
        <div className="bg-white rounded-lg shadow-sm border border-calm-200 p-6">
          <h2 className="text-lg font-medium text-calm-700 mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-calm-700">
                {useStore.getState().done.length}
              </div>
              <div className="text-xs text-calm-600 mt-1">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-calm-700">
                {useStore.getState().backlog.length}
              </div>
              <div className="text-xs text-calm-600 mt-1">In Backlog</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-calm-700">
                {useStore.getState().recurring.length}
              </div>
              <div className="text-xs text-calm-600 mt-1">Recurring Tasks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsView
