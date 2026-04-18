import React from 'react'

function FooterActions({ inputValue, setInputValue, handleAddTask, handleAddFromBacklog, handleAddFromRecurring, recurringCount }) {
  return (
    <div className="space-y-3">
      {/* Quick add input */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add another task..."
          className="flex-1 px-4 py-3 text-sm border border-edge bg-card text-ink rounded-lg focus:outline-none focus:border-brand transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-brand text-brand-on text-sm rounded-lg hover:bg-brand-dark transition-colors font-semibold shadow-sm"
        >
          Add
        </button>
      </form>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleAddFromBacklog}
          className="text-sm text-ink-muted hover:text-ink-muted transition-colors flex items-center gap-1"
        >
          <span>📋</span>
          <span>From backlog</span>
        </button>

        {recurringCount > 0 && (
          <button
            onClick={handleAddFromRecurring}
            className="text-sm text-ink-muted hover:text-ink-muted transition-colors flex items-center gap-1"
          >
            <span>💫</span>
            <span>{recurringCount} ready</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default FooterActions
