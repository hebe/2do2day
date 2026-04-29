import React, { useState } from 'react'
import useStore from '../store/useStore'
import BacklogItem from './BacklogItem'
import { sortBacklog, BACKLOG_SORT_OPTIONS } from '../utils/backlogSort'

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
  const { backlog, recurring, done, today, addBacklogTask, reorderBacklogTasks, updateSettings, settings } = useStore()
  const [activeTab, setActiveTab] = useState('backlog')
  const [showAll, setShowAll] = useState(false)
  const [showAllDone, setShowAllDone] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [sortBy, setSortBy] = useState(settings.backlogSortBy || 'manual')
  const [doneSortBy, setDoneSortBy] = useState(settings.doneSortBy || 'recent')

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

  const handleDoneSortChange = (newSort) => {
    setDoneSortBy(newSort)
    updateSettings({ doneSortBy: newSort })
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

  const getVisibleItems = (items) => {
    if (showAll || items.length <= 50) return items
    return items.slice(0, 50)
  }

  const sortedBacklog = sortBacklog(backlog, sortBy, settings.categories || [])
  const visibleBacklog = getVisibleItems(sortedBacklog)
  
  // Drag is only enabled in manual sort mode
  const isDragEnabled = sortBy === 'manual'

  const renderBacklogList = () => {
    if (backlog.length === 0) {
      return (
        <div className="p-8 text-center text-ink-muted">
          <p className="text-sm">Your backlog is empty.</p>
          <p className="text-xs mt-2 text-ink-muted">
            Add tasks here that you want to do someday, but not necessarily today.
          </p>
        </div>
      )
    }

    return (
      <>
        {/* Sort dropdown */}
        <div className="p-4 border-b border-edge flex items-center justify-between">
          <span className="text-xs text-ink-muted">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-xs px-3 py-1 border border-edge-strong rounded focus:outline-none focus:border-edge-strong transition-colors bg-card text-ink"
          >
            {BACKLOG_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
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
              <div className="divide-y divide-edge">
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
          <div className="divide-y divide-edge">
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
        {backlog.length > 50 && !showAll && (
          <div className="p-4 text-center border-t border-edge">
            <button
              onClick={() => setShowAll(true)}
              className="text-sm text-ink-muted hover:text-ink transition-colors font-medium"
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
              <div className="p-8 text-center text-ink-muted">
                <p className="text-sm">No recurring tasks yet.</p>
                <p className="text-xs mt-2 text-ink-muted">
                  Mark tasks as recurring from your backlog.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-edge">
                {recurring.map((task) => (
                  <BacklogItem key={task.id} task={task} type="recurring" />
                ))}
              </div>
            )}
          </div>
        )

      case 'done':
        // Merge archived done tasks with tasks ticked done in Today (not yet day-reset)
        const todayDone = today.filter(t => t.done).map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          completedAt: new Date().toISOString(),
        }))
        const allDone = [...todayDone, ...done]

        // Sort done tasks based on preference
        const getSortedDone = () => {
          const sorted = [...allDone]

          switch (doneSortBy) {
            case 'recent':
              return sorted.sort((a, b) => {
                const dateA = new Date(a.lastCompletedAt || a.completedAt)
                const dateB = new Date(b.lastCompletedAt || b.completedAt)
                return dateB - dateA // Most recent first
              })
            case 'oldest':
              return sorted.sort((a, b) => {
                const dateA = new Date(a.lastCompletedAt || a.completedAt)
                const dateB = new Date(b.lastCompletedAt || b.completedAt)
                return dateA - dateB // Oldest first
              })
            case 'category':
              return sorted.sort((a, b) => {
                if (!a.category && !b.category) return 0
                if (!a.category) return 1
                if (!b.category) return -1
                const catA = settings.categories?.find(c => c.id === a.category)?.name || a.category
                const catB = settings.categories?.find(c => c.id === b.category)?.name || b.category
                return catA.localeCompare(catB)
              })
            case 'completionCount':
              return sorted.sort((a, b) => (b.completionCount || 1) - (a.completionCount || 1))
            default:
              return sorted
          }
        }

        const sortedDone = getSortedDone()
        const visibleDone = showAllDone || allDone.length <= 10 ? sortedDone : sortedDone.slice(0, 10)

        return (
          <div>
            {allDone.length === 0 ? (
              <div className="p-8 text-center text-ink-muted">
                <p className="text-sm">No completed tasks yet.</p>
                <p className="text-xs mt-2 text-ink-muted">
                  Keep going! Your completed tasks will appear here. 🎉
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-hover border-b border-edge flex items-center justify-between">
                  <p className="text-sm text-ink">
                    🎉 <strong>{allDone.length}</strong> {allDone.length === 1 ? 'task' : 'tasks'} completed!
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-muted">Sort:</span>
                    <select
                      value={doneSortBy}
                      onChange={(e) => handleDoneSortChange(e.target.value)}
                      className="text-xs px-2 py-1 border border-edge-strong rounded focus:outline-none focus:border-edge-strong transition-colors bg-card text-ink"
                    >
                      <option value="recent">Recent first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="category">Category</option>
                      <option value="completionCount">Most completed</option>
                    </select>
                  </div>
                </div>
                <div className="divide-y divide-edge">
                  {visibleDone.map((task) => (
                    <BacklogItem key={task.id} task={task} type="done" />
                  ))}
                </div>
                {allDone.length > 10 && !showAllDone && (
                  <div className="p-4 text-center border-t border-edge">
                    <button
                      onClick={() => setShowAllDone(true)}
                      className="text-sm text-ink-muted hover:text-ink transition-colors font-medium"
                    >
                      Show all ({allDone.length} tasks)
                    </button>
                  </div>
                )}
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
          <h1 className="font-display text-3xl font-normal text-ink">Backlog</h1>
          <p className="text-sm text-ink-muted mt-1">
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
            className="flex-1 px-4 py-3 text-sm border border-edge bg-card text-ink rounded-lg focus:outline-none focus:border-brand transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand text-brand-on text-sm rounded-lg hover:bg-brand-dark transition-colors font-semibold shadow-sm"
          >
            Add
          </button>
        </form>

        {/* Subtabs */}
        <div className="flex gap-4 border-b border-edge">
          <button
            onClick={() => {
              setActiveTab('backlog')
              setShowAll(false)
              setShowAllDone(false)
            }}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'backlog'
                ? 'border-ink dark:border-ink text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-muted'
            }`}
          >
            Backlog {backlog.length > 0 && `(${backlog.length})`}
          </button>
          <button
            onClick={() => {
              setActiveTab('recurring')
              setShowAll(false)
              setShowAllDone(false)
            }}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recurring'
                ? 'border-ink dark:border-ink text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-muted'
            }`}
          >
            Recurring {recurring.length > 0 && `(${recurring.length})`}
          </button>
          <button
            onClick={() => {
              setActiveTab('done')
              setShowAll(false)
              setShowAllDone(false)
            }}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'done'
                ? 'border-ink dark:border-ink text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-muted'
            }`}
          >
            Done! {(done.length + today.filter(t => t.done).length) > 0 && `(${done.length + today.filter(t => t.done).length})`}
          </button>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-sm border border-edge overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default BacklogView
