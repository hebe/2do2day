import React, { useState, useRef, useCallback, useEffect } from 'react'
import useStore from '../store/useStore'
import TaskActionsModal from './TaskActionsModal'
import RecurringIntervalModal from './RecurringIntervalModal'
import { getCategoryOKLab } from '../utils/colorUtils'

function chipLabel(title) {
  if (title.length <= 12) return title
  return title.slice(0, 12) + '…'
}

function calcPriorityScore(urgent, important, localX, localY) {
  const baseScore = urgent && important ? 75 :
                    !urgent && important ? 50 :
                    urgent && !important ? 25 : 0
  const withinScore = Math.floor((localX + (1 - localY)) * 12)
  return Math.min(baseScore + withinScore, 99)
}

const QUADRANTS = [
  { id: 'Q2', urgent: false, important: true,  label: 'Schedule',  sublabel: 'Important, not urgent'  },
  { id: 'Q1', urgent: true,  important: true,  label: 'Do First',  sublabel: 'Urgent + Important'      },
  { id: 'Q4', urgent: false, important: false, label: 'Eliminate', sublabel: 'Not urgent or important' },
  { id: 'Q3', urgent: true,  important: false, label: 'Delegate',  sublabel: 'Urgent, not important'   },
]

const QUADRANT_STYLES = {
  Q1: { bg: 'bg-amber-950/40',   border: 'border-amber-700/50',   labelColor: 'text-amber-200',   chipBg: 'bg-amber-600 hover:bg-amber-500',   chipText: 'text-amber-50'  },
  Q2: { bg: 'bg-blue-950/40',    border: 'border-blue-700/50',    labelColor: 'text-blue-200',    chipBg: 'bg-blue-600 hover:bg-blue-500',     chipText: 'text-blue-50'   },
  Q3: { bg: 'bg-orange-950/40',  border: 'border-orange-700/50',  labelColor: 'text-orange-200',  chipBg: 'bg-orange-600 hover:bg-orange-500', chipText: 'text-orange-50' },
  Q4: { bg: 'bg-gray-900/60',    border: 'border-gray-700/50',    labelColor: 'text-gray-400',    chipBg: 'bg-gray-600 hover:bg-gray-500',     chipText: 'text-gray-100'  },
}

function getQuadrantId(urgent, important) {
  if (urgent && important) return 'Q1'
  if (!urgent && important) return 'Q2'
  if (urgent && !important) return 'Q3'
  return 'Q4'
}

function TaskChip({ task, quadrantId, isPlaced, gridIndex, onOpenModal, onDragStart, settings }) {
  const style = QUADRANT_STYLES[quadrantId]

  const category = settings.categories?.find(c => c.id === task.category)
  const categoryOKLab = category ? getCategoryOKLab(category.color) : null

  const baseClasses = `px-2 py-1 rounded-md text-xs font-semibold cursor-grab active:cursor-grabbing select-none transition-all hover:scale-110 hover:shadow-lg whitespace-nowrap`
  const colorClasses = categoryOKLab
    ? `cat-chip`
    : `${style.chipBg} ${style.chipText}`

  if (isPlaced) {
    const pos = task.matrixPos
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onClick={(e) => { e.stopPropagation(); onOpenModal(task) }}
        title={task.title}
        style={{
          position: 'absolute',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          ...(categoryOKLab && { '--accent': categoryOKLab }),
        }}
        className={`${baseClasses} ${colorClasses} z-0 hover:z-10`}
      >
        {chipLabel(task.title)}
      </div>
    )
  }

  // Unplaced — grid staging area in bottom-right
  const col = gridIndex % 4
  const row = Math.floor(gridIndex / 4)
  const CHIP_W = 56
  const CHIP_H = 26
  const GAP = 4
  const RIGHT_PAD = 8
  const BOTTOM_PAD = 8

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={(e) => { e.stopPropagation(); onOpenModal(task) }}
      title={task.title}
      style={{
        position: 'absolute',
        right: RIGHT_PAD + col * (CHIP_W + GAP),
        bottom: BOTTOM_PAD + row * (CHIP_H + GAP),
        ...(categoryOKLab && { '--accent': categoryOKLab }),
      }}
      className={`${baseClasses} ${colorClasses} opacity-60 border border-dashed`}
    >
      {chipLabel(task.title)}
    </div>
  )
}

function MatrixQuadrant({ quadrant, tasks, onDrop, onOpenModal, onDragStart, settings }) {
  const style = QUADRANT_STYLES[quadrant.id]
  const quadrantRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!quadrantRef.current) return
    const rect = quadrantRef.current.getBoundingClientRect()
    const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height))
    onDrop(e, quadrant.id, quadrant.urgent, quadrant.important, x, y)
  }

  return (
    <div
      ref={quadrantRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative rounded-xl border ${style.bg} ${style.border} overflow-hidden`}
    >
      {/* Quadrant label */}
      <div className="absolute top-3 left-4 pointer-events-none z-10">
        <p className={`text-sm font-semibold ${style.labelColor}`}>{quadrant.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-600">{quadrant.sublabel}</p>
      </div>

      {/* Task chips */}
      {tasks.map((task, i) => {
        const isPlaced = task.matrixPos != null && typeof task.matrixPos === 'object'
        const unplacedIndex = tasks.filter((t, j) => j < i && !(t.matrixPos != null && typeof t.matrixPos === 'object')).length
        return (
          <TaskChip
            key={task.id}
            task={task}
            quadrantId={quadrant.id}
            isPlaced={isPlaced}
            gridIndex={unplacedIndex}
            onOpenModal={onOpenModal}
            onDragStart={onDragStart}
            settings={settings}
          />
        )
      })}

      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-end p-4 pointer-events-none">
          <p className="text-xs text-gray-700 dark:text-gray-700">Drop tasks here</p>
        </div>
      )}
    </div>
  )
}

function MatrixView() {
  const {
    today, backlog,
    setTaskQuadrant,
    moveToBacklog, moveTodayToRecurring,
    deleteTask, deleteBacklogTask,
    editTask, editBacklogTask,
    settings,
  } = useStore()

  const [source, setSource] = useState('today')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const dragTaskId = useRef(null)

  const rawTasks = source === 'today' ? today : backlog

  // Keep selectedTask in sync with store so modal reflects live changes
  useEffect(() => {
    if (!selectedTask) return
    const updated = rawTasks.find(t => t.id === selectedTask.id)
    if (updated) setSelectedTask(updated)
  }, [rawTasks])

  const prioritized = rawTasks.filter(t => t.priorityScore !== null)
  const unprioritized = rawTasks.filter(t => t.priorityScore === null)
  const tasksInQuadrant = (qId) => prioritized.filter(t => getQuadrantId(t.urgent, t.important) === qId)

  const handleDragStart = useCallback((e, taskId) => {
    dragTaskId.current = taskId
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDrop = useCallback((e, quadrantId, urgent, important, x, y) => {
    const taskId = dragTaskId.current
    if (!taskId) return
    const score = calcPriorityScore(urgent, important, x, y)
    setTaskQuadrant(taskId, important, urgent, score, { x, y })
    dragTaskId.current = null
  }, [setTaskQuadrant])

  const handleDropUnprioritized = (e) => {
    e.preventDefault()
    const taskId = dragTaskId.current
    if (taskId) {
      setTaskQuadrant(taskId, false, false, null, null)
      dragTaskId.current = null
    }
  }

  const handleOpenModal = useCallback((task) => setSelectedTask(task), [])
  const handleCloseModal = () => setSelectedTask(null)

  const handleDelete = () => {
    source === 'today' ? deleteTask(selectedTask.id) : deleteBacklogTask(selectedTask.id)
    setSelectedTask(null)
  }

  const handleEdit = () => {
    const newTitle = prompt('Edit task:', selectedTask.title)
    if (newTitle?.trim()) {
      source === 'today'
        ? editTask(selectedTask.id, newTitle.trim())
        : editBacklogTask(selectedTask.id, newTitle.trim())
    }
    setSelectedTask(null)
  }

  const handleMoveToBacklog = () => {
    moveToBacklog(selectedTask.id)
    setSelectedTask(null)
  }

  const handleMakeRecurring = () => setShowRecurringModal(true)

  const handleRecurringConfirm = (interval, recurrenceDays = []) => {
    if (selectedTask) moveTodayToRecurring(selectedTask.id, interval, recurrenceDays)
    setShowRecurringModal(false)
    setSelectedTask(null)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Priority Matrix</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {rawTasks.length - unprioritized.length} of {rawTasks.length} tasks prioritized
          </p>
        </div>

        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {['today', 'backlog'].map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`px-4 py-1.5 font-medium capitalize transition-colors ${
                source === s
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix + axis labels */}
      <div className="flex flex-1 gap-2 px-6 pb-4 min-h-0">
        {/* Y axis label */}
        <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-600 w-6 flex-shrink-0 py-2">
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Important ↑</span>
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>↓ Not important</span>
        </div>

        <div className="flex flex-col flex-1 gap-2 min-h-0">
          {/* X axis label */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-600 px-1 flex-shrink-0">
            <span>← Not urgent</span>
            <span>Urgent →</span>
          </div>

          {/* 2x2 grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
            {QUADRANTS.map(q => (
              <MatrixQuadrant
                key={q.id}
                quadrant={q}
                tasks={tasksInQuadrant(q.id)}
                onDrop={handleDrop}
                onOpenModal={handleOpenModal}
                onDragStart={handleDragStart}
                settings={settings}
              />
            ))}
          </div>

          {/* Unprioritized tray */}
          {unprioritized.length > 0 && (
            <div
              onDrop={handleDropUnprioritized}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              className="flex-shrink-0 flex flex-wrap gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-gray-700 min-h-[44px] items-center"
            >
              <span className="text-xs text-gray-600 mr-1">Unprioritized:</span>
              {unprioritized.map(task => {
                const category = settings.categories?.find(c => c.id === task.category)
                const categoryOKLab = category ? getCategoryOKLab(category.color) : null
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleOpenModal(task)}
                    title={task.title}
                    style={categoryOKLab ? { '--accent': categoryOKLab } : undefined}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium cursor-grab select-none transition-all hover:scale-105 ${
                      categoryOKLab
                        ? 'cat-chip'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {chipLabel(task.title)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskActionsModal
          task={selectedTask}
          type={source}
          onEdit={handleEdit}
          onMakeRecurring={source === 'today' ? handleMakeRecurring : undefined}
          onMoveToBacklog={source === 'today' ? handleMoveToBacklog : undefined}
          onDelete={handleDelete}
          onClose={handleCloseModal}
        />
      )}

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
