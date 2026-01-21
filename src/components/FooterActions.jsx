import React from 'react'

function FooterActions({ inputValue, setInputValue, handleAddTask, handleAddFromBacklog }) {
  return (
    <div className="space-y-3">
      {/* Quick add input */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add another task..."
          className="flex-1 px-4 py-3 text-sm border border-calm-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:border-[#F0A500] transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-[#F0A500] text-gray-800 text-sm rounded-lg hover:bg-[#D89400] transition-colors font-semibold shadow-sm"
        >
          Add
        </button>
      </form>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleAddFromBacklog}
          className="text-sm text-calm-600 hover:text-calm-700 transition-colors flex items-center gap-1"
        >
          <span>📋</span>
          <span>Add from backlog</span>
        </button>
      </div>
    </div>
  )
}

export default FooterActions
