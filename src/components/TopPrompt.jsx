import React from 'react'

function TopPrompt({ inputValue, setInputValue, handleAddTask, handleAddFromBacklog, inputRef }) {
  return (
    <div className="text-center space-y-8 py-20">
      {/* Main prompt */}
      <h1 className="text-3xl md:text-4xl text-calm-700 font-light">
        What should we get done today?
      </h1>

      {/* Input form */}
      <form onSubmit={handleAddTask} className="max-w-md mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a task..."
          className="w-full px-4 py-4 text-lg border-2 border-calm-200 rounded-lg focus:outline-none focus:border-[#F0A500] transition-colors"
        />
      </form>

      {/* Subtle backlog button */}
      <button
        onClick={handleAddFromBacklog}
        className="text-sm text-calm-600 hover:text-calm-700 transition-colors underline underline-offset-2"
      >
        Add from backlog
      </button>

      {/* Placeholder for recurring task indicator */}
      {/* Will be implemented later:
      <div className="text-xs text-calm-500">
        💫 You have recurring tasks waiting — want to review them?
      </div>
      */}
    </div>
  )
}

export default TopPrompt
