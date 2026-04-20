// Shared backlog sorting logic — used by BacklogView and BacklogQuickPicker.

export const BACKLOG_SORT_OPTIONS = [
  { value: 'manual', label: 'Manual (drag to reorder)' },
  { value: 'recent', label: 'Recently added' },
  { value: 'postponed', label: 'Most postponed' },
  { value: 'priority', label: 'Eisenhower prio' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'category', label: 'Category' },
]

export function sortBacklog(backlog, sortBy, categories = []) {
  // Manual preserves the user's stored order
  if (sortBy === 'manual') return backlog

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
    case 'priority':
      return sorted.sort((a, b) => {
        if (a.priorityScore === null && b.priorityScore === null) return 0
        if (a.priorityScore === null) return 1
        if (b.priorityScore === null) return -1
        return b.priorityScore - a.priorityScore
      })
    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      )
    case 'category':
      return sorted.sort((a, b) => {
        if (!a.category && !b.category) return 0
        if (!a.category) return 1
        if (!b.category) return -1
        const catA = categories.find(c => c.id === a.category)?.name || a.category
        const catB = categories.find(c => c.id === b.category)?.name || b.category
        return catA.localeCompare(catB)
      })
    default:
      return sorted
  }
}
