import React from 'react'

function TopPrompt({ inputValue, setInputValue, handleAddTask, handleAddFromBacklog, handleAddFromRecurring, recurringCount, inputRef }) {
  return (
    <div className="text-center space-y-8 py-12">
      {/* Input form */}
      <form onSubmit={handleAddTask} className="max-w-md mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a task..."
          className="w-full px-4 py-4 text-lg border-2 border-edge rounded-lg bg-card text-ink focus:outline-none focus:border-brand transition-colors"
        />
      </form>

      {/* Subtle action buttons */}
      <div className="flex items-center justify-center gap-3 text-sm">
        <button
          onClick={handleAddFromBacklog}
          className="text-ink-muted hover:text-ink-muted transition-colors underline underline-offset-2"
        >
          Add from backlog
        </button>

        {recurringCount > 0 && (
          <>
            <span className="text-ink-faint">•</span>
            <button
              onClick={handleAddFromRecurring}
              className="text-ink-muted hover:text-ink-muted transition-colors underline underline-offset-2 flex items-center gap-1"
            >
              <span>💫</span>
              <span>{recurringCount} {recurringCount === 1 ? 'recurring task ready' : 'recurring tasks ready'}</span>
            </button>
          </>
        )}
      </div>

      {/* Placeholder for recurring task indicator */}
      {/* Will be implemented later:
      <div className="text-xs text-ink-muted">
        💫 You have recurring tasks waiting — want to review them?
      </div>
      */}
    </div>
  )
}

export default TopPrompt
