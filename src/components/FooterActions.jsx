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
          className="flex-1 px-4 py-2 text-sm border border-calm-200 rounded-lg focus:outline-none focus:border-calm-600 transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-calm-700 text-white text-sm rounded-lg hover:bg-calm-600 transition-colors font-medium"
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
