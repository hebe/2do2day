import React, { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import TopPrompt from './TopPrompt'
import TaskRow from './TaskRow'
import FooterActions from './FooterActions'
import BacklogQuickPicker from './BacklogQuickPicker'

function TodayView() {
  const { today, addTodayTask, deleteTask, editTask, reorderTodayTasks, sortTodayByCompletion, settings } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [showList, setShowList] = useState(false)
  const [showBacklogPicker, setShowBacklogPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showResetMessage, setShowResetMessage] = useState(false)
  const inputRef = useRef(null)
  const lastResetRef = useRef(settings.lastDayReset)

  const doneCount = today.filter(t => t.done).length
  const undoneCount = today.filter(t => !t.done).length
  const showCounter = today.length > 5

  // Show list if there are any tasks
  useEffect(() => {
    if (today.length > 0) {
      setShowList(true)
    }
  }, [today.length])

  // Check if day was just reset
  useEffect(() => {
    if (settings.lastDayReset && settings.lastDayReset !== lastResetRef.current) {
      const resetTime = new Date(settings.lastDayReset)
      const now = new Date()
      const timeSinceReset = now - resetTime
      
      // Show message if reset happened in the last 5 minutes
      if (timeSinceReset < 5 * 60 * 1000) {
        setShowResetMessage(true)
        setTimeout(() => setShowResetMessage(false), 8000)
      }
      
      lastResetRef.current = settings.lastDayReset
    }
  }, [settings.lastDayReset])

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current && !showList) {
      inputRef.current.focus()
    }
  }, [showList])

  const handleAddTask = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      addTodayTask(inputValue.trim())
      setInputValue('')
      setShowList(true)
    }
  }

  const handleAddFromBacklog = () => {
    setShowBacklogPicker(true)
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderTodayTasks(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
      {/* Day Reset Message */}
      {showResetMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-slideDown">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">Good morning! Your day has reset.</h3>
              <p className="text-sm text-green-800 mt-1">
                Yesterday's incomplete tasks have been moved to your backlog, and completed tasks are archived in Done!
              </p>
            </div>
            <button
              onClick={() => setShowResetMessage(false)}
              className="flex-shrink-0 text-green-600 hover:text-green-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Blank state */}
      {!showList && (
        <TopPrompt 
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleAddTask={handleAddTask}
          handleAddFromBacklog={handleAddFromBacklog}
          inputRef={inputRef}
        />
      )}

      {/* Task list state */}
      {showList && (
        <div className="space-y-6">
          {/* Counter and Sort Button */}
          {showCounter && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-calm-600">
                <span>
                  <strong className="text-calm-700">{undoneCount}</strong> to do
                </span>
                <span className="text-calm-300">•</span>
                <span>
                  <strong className="text-calm-700">{doneCount}</strong> done
                </span>
              </div>
              {doneCount > 0 && undoneCount > 0 && (
                <button
                  onClick={sortTodayByCompletion}
                  className="text-xs text-calm-600 hover:text-calm-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Sort by status
                </button>
              )}
            </div>
          )}

          {/* Task list */}
          <div className="bg-white rounded-lg shadow-sm border border-calm-200">
            {today.length === 0 ? (
              <div className="p-8 text-center text-calm-600">
                <p className="text-sm">Your list is empty. Add your first task below.</p>
              </div>
            ) : (
              <div className="divide-y divide-calm-100">
                {today.map((task, index) => (
                  <TaskRow 
                    key={task.id} 
                    task={task}
                    index={index}
                    onDelete={deleteTask}
                    onEdit={editTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <FooterActions 
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleAddTask={handleAddTask}
            handleAddFromBacklog={handleAddFromBacklog}
          />
        </div>
      )}

      {/* Backlog Quick Picker Modal */}
      {showBacklogPicker && (
        <BacklogQuickPicker onClose={() => setShowBacklogPicker(false)} />
      )}

      {/* Animation for reset message */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        /* Custom accent color */
        :root {
          --accent-color: #F0A500;
          --accent-hover: #D89400;
        }
      `}</style>
    </div>
  )
}

export default TodayView
