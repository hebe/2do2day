import React, { useState, useEffect } from 'react'

const EMPTY_STATE_MESSAGES = [
  "What's one thing you'd like to accomplish today?",
  "Ready for a fresh start?",
  "What matters most to you today?",
  "Start simple. What's your first step?",
  "What would make today feel complete?",
  "Begin with what feels right.",
  "Today is yours. Where should we start?",
  "What's calling for your attention?",
  "Keep it light. What's on your mind?",
  "Pick one thing. Just one.",
  "What deserves your energy today?",
  "A blank slate. What will you create?",
  "Small steps add up. What's yours?",
  "No pressure. What feels important?",
  "What would feel good to finish today?",
  "Trust yourself. What needs doing?",
  "Start anywhere. Where feels right?",
  "What's worth your time today?",
  "One task at a time. Which one first?",
  "Let's keep it simple today.",
  "What would make you proud today?",
  "Choose one thing to focus on.",
  "What's been on your mind lately?",
  "No rush. What feels urgent to you?",
  "Take a breath. What's next?",
]

function TopPrompt({ inputValue, setInputValue, handleAddTask, handleAddFromBacklog, inputRef }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Pick a random message on mount
    const randomMessage = EMPTY_STATE_MESSAGES[Math.floor(Math.random() * EMPTY_STATE_MESSAGES.length)]
    setMessage(randomMessage)
  }, [])

  return (
    <div className="text-center space-y-8 py-20">
      {/* Main prompt */}
      <h1 className="text-3xl md:text-4xl text-calm-700 dark:text-gray-300 font-light">
        {message}
      </h1>

      {/* Input form */}
      <form onSubmit={handleAddTask} className="max-w-md mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a task..."
          className="w-full px-4 py-4 text-lg border-2 border-calm-200 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#F0A500] transition-colors"
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
