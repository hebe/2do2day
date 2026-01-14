import React, { useState } from 'react'
import useStore from '../store/useStore'
import BacklogItem from './BacklogItem'

function BacklogView() {
  const { backlog, recurring, done, addBacklogTask, reorderBacklogTasks, updateSettings, settings } = useStore()
  const [activeTab, setActiveTab] = useState('backlog')
  const [showAll, setShowAll] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [sortBy, setSortBy] = useState(settings.backlogSortBy || 'recent')

  const handleAddTask = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      addBacklogTask(inputValue.trim())
      setInputValue('')
    }
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    updateSettings({ backlogSortBy: newSort })
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
      reorderBacklogTasks(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  // Sort backlog based on current preference
  const getSortedBacklog = () => {
    const sorted = [...backlog]
    
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => 
          new Date(b.lastAddedToBacklog || b.createdAt) - new Date(a.lastAddedToBacklog || a.createdAt)
        )
      case 'postponed':
        return sorted.sort((a, b) => 
          (b.addedToBacklogCount || 0) - (a.addedToBacklogCount || 0)
        )
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        )
      default:
        return sorted
    }
  }

  const getVisibleItems = (items) => {
    if (showAll || items.length <= 6) return items
    return items.slice(0, 6)
  }

  const sortedBacklog = getSortedBacklog()

  const renderContent = () => {
    switch (activeTab) {
      case 'backlog':
        const visibleBacklog = getVisibleItems(sortedBacklog)
        return (
          <div>
            {backlog.length === 0 ? (
              <div className="p-8 text-center text-calm-600">
                <p className="text-sm">Your backlog is empty.</p>
                <p className="text-xs mt-2 text-calm-500">
                  Add tasks here that you want to do someday, but not necessarily today.
                </p>
              </div>
            ) : (
              <>
                {/* Sort dropdown */}
                <div className="p-4 border-b border-calm-100 flex items-center justify-between">
                  <span className="text-xs text-calm-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="text-xs px-3 py-1 border border-calm-200 rounded focus:outline-none focus:border-calm-600 transition-colors"
                  >
                    <option value="recent">Recently added</option>
                    <option value="postponed">Most postponed</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>

                <div className="divide-y divide-calm-100">
                  {visibleBacklog.map((task, index) => (
                    <BacklogItem 
                      key={task.id} 
                      task={task} 
                      type="backlog"
                      index={index}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
                {backlog.length > 6 && !showAll && (
                  <div className="p-4 text-center border-t border-calm-100">
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-sm text-calm-600 hover:text-calm-700 transition-colors font-medium"
                    >
                      Show all ({backlog.length} tasks)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 'recurring':
        return (
          <div>
            {recurring.length === 0 ? (
              <div className="p-8 text-center text-calm-600">
                <p className="text-sm">No recurring tasks yet.</p>
                <p className="text-xs mt-2 text-calm-500">
                  Mark tasks as recurring from your backlog.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-calm-100">
                {recurring.map((task) => (
                  <BacklogItem key={task.id} task={task} type="recurring" />
                ))}
              </div>
            )}
          </div>
        )

      case 'done':
        const recentDone = done.slice(-20).reverse()
        return (
          <div>
            {done.length === 0 ? (
              <div className="p-8 text-center text-calm-600">
                <p className="text-sm">No completed tasks yet.</p>
                <p className="text-xs mt-2 text-calm-500">
                  Keep going! Your completed tasks will appear here. 🎉
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-calm-50 border-b border-calm-200 text-center">
                  <p className="text-sm text-calm-700">
                    🎉 <strong>{done.length}</strong> {done.length === 1 ? 'task' : 'tasks'} completed!
                  </p>
                </div>
                <div className="divide-y divide-calm-100">
                  {recentDone.map((task) => (
                    <BacklogItem key={task.id} task={task} type="done" />
                  ))}
                </div>
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-calm-700">Backlog</h1>
          <p className="text-sm text-calm-600 mt-1">
            Tasks you'll get to someday, recurring tasks, and your wins.
          </p>
        </div>

        {/* Add new backlog task */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add to backlog..."
            className="flex-1 px-4 py-3 text-sm border border-calm-200 rounded-lg focus:outline-none focus:border-[#F0A500] transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#F0A500] text-white text-sm rounded-lg hover:bg-[#D89400] transition-colors font-medium shadow-sm"
          >
            Add
          </button>
        </form>

        {/* Subtabs */}
        <div className="flex gap-4 border-b border-calm-200">
          <button
            onClick={() => {
              setActiveTab('backlog')
              setShowAll(false)
            }}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'backlog'
                ? 'border-calm-700 text-calm-700'
                : 'border-transparent text-calm-600 hover:text-calm-700'
            }`}
          >
            Backlog {backlog.length > 0 && `(${backlog.length})`}
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recurring'
                ? 'border-calm-700 text-calm-700'
                : 'border-transparent text-calm-600 hover:text-calm-700'
            }`}
          >
            Recurring {recurring.length > 0 && `(${recurring.length})`}
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'done'
                ? 'border-calm-700 text-calm-700'
                : 'border-transparent text-calm-600 hover:text-calm-700'
            }`}
          >
            Done! {done.length > 0 && `(${done.length})`}
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-calm-200">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default BacklogView
