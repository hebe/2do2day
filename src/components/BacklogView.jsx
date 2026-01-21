import React, { useState } from 'react'
import useStore from '../store/useStore'
import BacklogItem from './BacklogItem'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

function BacklogView() {
  const { backlog, recurring, done, addBacklogTask, reorderBacklogTasks, updateSettings, settings } = useStore()
  const [activeTab, setActiveTab] = useState('backlog')
  const [showAll, setShowAll] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [sortBy, setSortBy] = useState(settings.backlogSortBy || 'manual')

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }

    // Find indices in the full backlog array (not the sorted/visible subset)
    const oldIndex = backlog.findIndex((t) => t.id === active.id)
    const newIndex = backlog.findIndex((t) => t.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderBacklogTasks(oldIndex, newIndex)
    }
  }

  // Sort backlog based on current preference
  const getSortedBacklog = () => {
    // For manual sorting, return as-is (maintains user's order)
    if (sortBy === 'manual') {
      return backlog
    }

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
      case 'category':
        return sorted.sort((a, b) => {
          // Tasks without category go to the end
          if (!a.category && !b.category) return 0
          if (!a.category) return 1
          if (!b.category) return -1

          // Find category names for sorting
          const catA = settings.categories?.find(c => c.id === a.category)?.name || a.category
          const catB = settings.categories?.find(c => c.id === b.category)?.name || b.category

          return catA.localeCompare(catB)
        })
      default:
        return sorted
    }
  }

  const getVisibleItems = (items) => {
    if (showAll || items.length <= 6) return items
    return items.slice(0, 6)
  }

  const sortedBacklog = getSortedBacklog()
  const visibleBacklog = getVisibleItems(sortedBacklog)
  
  // Drag is only enabled in manual sort mode
  const isDragEnabled = sortBy === 'manual'

  const renderBacklogList = () => {
    if (backlog.length === 0) {
      return (
        <div className="p-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">Your backlog is empty.</p>
          <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
            Add tasks here that you want to do someday, but not necessarily today.
          </p>
        </div>
      )
    }

    return (
      <>
        {/* Sort dropdown */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-gray-600 dark:focus:border-gray-400 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="manual">Manual (drag to reorder)</option>
            <option value="recent">Recently added</option>
            <option value="postponed">Most postponed</option>
            <option value="oldest">Oldest first</option>
            <option value="category">Category</option>
          </select>
        </div>

        {/* Task list with optional drag context */}
        {isDragEnabled ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={visibleBacklog.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                {visibleBacklog.map((task) => (
                  <BacklogItem
                    key={task.id}
                    task={task}
                    type="backlog"
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
            {visibleBacklog.map((task) => (
              <BacklogItem
                key={task.id}
                task={task}
                type="backlog"
                isDragDisabled={true}
              />
            ))}
          </div>
        )}

        {/* Show all button */}
        {backlog.length > 6 && !showAll && (
          <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700/50">
            <button
              onClick={() => setShowAll(true)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors font-medium"
            >
              Show all ({backlog.length} tasks)
            </button>
          </div>
        )}
      </>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'backlog':
        return renderBacklogList()

      case 'recurring':
        return (
          <div>
            {recurring.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                <p className="text-sm">No recurring tasks yet.</p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                  Mark tasks as recurring from your backlog.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                {recurring.map((task) => (
                  <BacklogItem key={task.id} task={task} type="recurring" />
                ))}
              </div>
            )}
          </div>
        )

      case 'done':
        // Sort by completion date (most recent first), using lastCompletedAt for recurring tasks
        const sortedDone = [...done].sort((a, b) => {
          const dateA = new Date(a.lastCompletedAt || a.completedAt)
          const dateB = new Date(b.lastCompletedAt || b.completedAt)
          return dateB - dateA // Most recent first
        })
        const recentDone = sortedDone.slice(0, 20)

        return (
          <div>
            {done.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                <p className="text-sm">No completed tasks yet.</p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                  Keep going! Your completed tasks will appear here. 🎉
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-calm-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700/50 text-center">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    🎉 <strong>{done.length}</strong> {done.length === 1 ? 'task' : 'tasks'} completed!
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
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
          <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">Backlog</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
            className="flex-1 px-4 py-3 text-sm border border-calm-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:border-[#F0A500] transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#F0A500] text-gray-800 text-sm rounded-lg hover:bg-[#D89400] transition-colors font-semibold shadow-sm"
          >
            Add
          </button>
        </form>

        {/* Subtabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('backlog')
              setShowAll(false)
            }}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'backlog'
                ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }`}
          >
            Backlog {backlog.length > 0 && `(${backlog.length})`}
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recurring'
                ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }`}
          >
            Recurring {recurring.length > 0 && `(${recurring.length})`}
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'done'
                ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }`}
          >
            Done! {done.length > 0 && `(${done.length})`}
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-600 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default BacklogView
