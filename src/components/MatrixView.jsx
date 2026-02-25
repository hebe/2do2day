import React, { useState, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import TaskActionsModal from './TaskActionsModal'
import RecurringIntervalModal from './RecurringIntervalModal'

// Truncate to ~6 chars
function chipLabel(title) {
  if (title.length <= 6) return title
  return title.slice(0, 6) + '…'
}

// Calculate priorityScore from normalized x, y position within the full matrix
// x: 0 = left (not urgent), 1 = right (urgent)
// y: 0 = top (important), 1 = bottom (not important)
function calcPriorityScore(x, y, urgent, important) {
  const baseScore = urgent && important ? 75 :
                    !urgent && important ? 50 :
                    urgent && !important ? 25 : 0
  // Position within quadrant adds 0-24
  const localX = urgent ? x * 2 - 1 : x * 2        // 0-1 within quadrant
  const localY = important ? y * 2 : y * 2 - 1      // 0-1 within quadrant (inverted: top = important)
  const withinScore = Math.floor((localX + (1 - localY)) * 12)
  return Math.min(baseScore + withinScore, 99)
}

const QUADRANT_STYLES = {
  Q1: { bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800',   label: 'Do First',  sublabel: 'Urgent + Important' },
  Q2: { bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800',     label: 'Schedule',  sublabel: 'Important, not urgent' },
  Q3: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', label: 'Delegate',  sublabel: 'Urgent, not important' },
  Q4: { bg: 'bg-gray-50 dark:bg-gray-800',        border: 'border-gray-200 dark:border-gray-700',     label: 'Eliminate', sublabel: 'Not urgent or important' },
}

const CHIP_COLORS = {
  Q1: 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700',
  Q2: 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700',
  Q3: 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700',
  Q4: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
}

function getQuadrant(urgent, important) {
  if (urgent && important) return 'Q1'
  if (!urgent && important) return 'Q2'
  if (urgent && !important) return 'Q3'
  return 'Q4'
}

function TaskChip({ task, onOpenModal, onDragStart }) {
  const quadrant = task.priorityScore !== null ? getQuadrant(task.urgent, task.important) : null
  const chipColor = quadrant ? CHIP_COLORS[quadrant] : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onOpenModal(task)}
      title={task.title}
      className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium cursor-grab active:cursor-grabbing select-none transition-all hover:scale-105 hover:shadow-md ${chipColor}`}
    >
      {chipLabel(task.title)}
    </div>
  )
}

function MatrixQuadrant({ quadrantId, tasks, onDrop, onDragOver, onOpenModal, onDragStart }) {
  const style = QUADRANT_STYLES[quadrantId]

  return (
    <div
      onDrop={(e) => onDrop(e, quadrantId)}
      onDragOver={onDragOver}
      className={`relative rounded-xl border-2 ${style.bg} ${style.border} p-3 min-h-[180px] flex flex-col gap-2`}
    >
      {/* Quadrant label */}
      <div className="mb-1">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{style.label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{style.sublabel}</p>
      </div>

      {/* Task chips */}
      <div className="flex flex-wrap gap-1.5">
        {tasks.map(task => (
          <TaskChip
            key={task.id}
            task={task}
            onOpenModal={onOpenModal}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      {/* Empty hint */}
      {tasks.length === 0 && (
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-auto">Drop tasks here</p>
      )}
    </div>
  )
}

function MatrixView() {
  const { today, backlog, setTaskQuadrant, moveToBacklog, moveTodayToRecurring, deleteTask, deleteBacklogTask, editTask, editBacklogTask, settings } = useStore()
  const [source, setSource] = useState('today') // 'today' or 'backlog'
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTaskType, setSelectedTaskType] = useState('today')
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const dragTaskId = useRef(null)

  const tasks = source === 'today' ? today : backlog

  // Split into quadrants + unprioritized
  const q1 = tasks.filter(t => t.priorityScore !== null && t.urgent && t.important)
  const q2 = tasks.filter(t => t.priorityScore !== null && !t.urgent && t.important)
  const q3 = tasks.filter(t => t.priorityScore !== null && t.urgent && !t.important)
  const q4 = tasks.filter(t => t.priorityScore !== null && !t.urgent && !t.important)
  const unprioritized = tasks.filter(t => t.priorityScore === null)

  const handleDragStart = useCallback((e, taskId) => {
    dragTaskId.current = taskId
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e, quadrantId) => {
    e.preventDefault()
    const taskId = dragTaskId.current
    if (!taskId) return

    const urgent = quadrantId === 'Q1' || quadrantId === 'Q3'
    const important = quadrantId === 'Q1' || quadrantId === 'Q2'
    const score = calcPriorityScore(0.5, 0.5, urgent, important) // center of quadrant

    setTaskQuadrant(taskId, important, urgent, score)
    dragTaskId.current = null
  }, [setTaskQuadrant])

  const handleOpenModal = useCallback((task) => {
    setSelectedTask(task)
    setSelectedTaskType(source)
  }, [source])

  const handleCloseModal = () => {
    setSelectedTask(null)
  }

  // Modal action handlers - mirroring what BacklogItem/TaskRow do
  const handleDelete = () => {
    if (selectedTaskType === 'today') {
      deleteTask(selectedTask.id)
    } else {
      deleteBacklogTask(selectedTask.id)
    }
    setSelectedTask(null)
  }

  const handleEdit = () => {
    const newTitle = prompt('Edit task:', selectedTask.title)
    if (newTitle && newTitle.trim()) {
      if (selectedTaskType === 'today') {
        editTask(selectedTask.id, newTitle.trim())
      } else {
        editBacklogTask(selectedTask.id, newTitle.trim())
      }
    }
    setSelectedTask(null)
  }

  const handleMoveToBacklog = () => {
    moveToBacklog(selectedTask.id)
    setSelectedTask(null)
  }

  const handleMakeRecurring = () => {
    setShowRecurringModal(true)
    setSelectedTask(null)
  }

  const handleRecurringConfirm = (interval, recurrenceDays = []) => {
    if (selectedTask) {
      moveTodayToRecurring(selectedTask.id, interval, recurrenceDays)
    }
    setShowRecurringModal(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Priority Matrix</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Drag tasks into quadrants to prioritize</p>
        </div>

        {/* Today / Backlog toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          <button
            onClick={() => setSource('today')}
            className={`px-4 py-2 font-medium transition-colors ${
              source === 'today'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSource('backlog')}
            className={`px-4 py-2 font-medium transition-colors ${
              source === 'backlog'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Backlog
          </button>
        </div>
      </div>

      {/* Axis labels */}
      <div className="relative mb-1">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
          <span>← Not urgent</span>
          <span>Urgent →</span>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="flex gap-1 mb-1">
        <div className="flex flex-col justify-between text-xs text-gray-400 dark:text-gray-500 py-2 w-16 flex-shrink-0 text-right pr-2">
          <span>Important ↑</span>
          <span>↓ Not important</span>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          {/* Top row: Important */}
          <MatrixQuadrant quadrantId="Q2" tasks={q2} onDrop={handleDrop} onDragOver={handleDragOver} onOpenModal={handleOpenModal} onDragStart={handleDragStart} />
          <MatrixQuadrant quadrantId="Q1" tasks={q1} onDrop={handleDrop} onDragOver={handleDragOver} onOpenModal={handleOpenModal} onDragStart={handleDragStart} />
          {/* Bottom row: Not important */}
          <MatrixQuadrant quadrantId="Q4" tasks={q4} onDrop={handleDrop} onDragOver={handleDragOver} onOpenModal={handleOpenModal} onDragStart={handleDragStart} />
          <MatrixQuadrant quadrantId="Q3" tasks={q3} onDrop={handleDrop} onDragOver={handleDragOver} onOpenModal={handleOpenModal} onDragStart={handleDragStart} />
        </div>
      </div>

      {/* Unprioritized tasks */}
      {unprioritized.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Unprioritized — drag into a quadrant
          </p>
          <div
            onDrop={(e) => {
              // Allow dropping back to unprioritized (clears priority)
              e.preventDefault()
              const taskId = dragTaskId.current
              if (taskId) {
                setTaskQuadrant(taskId, false, false, null)
                dragTaskId.current = null
              }
            }}
            onDragOver={handleDragOver}
            className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-[48px]"
          >
            {unprioritized.map(task => (
              <TaskChip
                key={task.id}
                task={task}
                onOpenModal={handleOpenModal}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Task count summary */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-right">
        {tasks.length - unprioritized.length} of {tasks.length} tasks prioritized
      </p>

      {/* Task actions modal */}
      {selectedTask && (
        <TaskActionsModal
          task={selectedTask}
          type={selectedTaskType}
          onEdit={handleEdit}
          onMakeRecurring={selectedTaskType === 'today' ? handleMakeRecurring : undefined}
          onMoveToBacklog={selectedTaskType === 'today' ? handleMoveToBacklog : undefined}
          onDelete={handleDelete}
          onClose={handleCloseModal}
        />
      )}

      {/* Recurring modal */}
      {showRecurringModal && selectedTask && (
        <RecurringIntervalModal
          task={selectedTask}
          onConfirm={handleRecurringConfirm}
          onCancel={() => setShowRecurringModal(false)}
        />
      )}
    </div>
  )
}

export default MatrixView
