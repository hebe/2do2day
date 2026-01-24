import React, { useState } from 'react'
import useStore from '../store/useStore'
import { CATEGORY_COLOR_PALETTE } from '../utils/colorUtils'

function SettingsView() {
  // Get settings and actions from store - this will re-render when settings change
  const settings = useStore((state) => state.settings)
  const updateSettings = useStore((state) => state.updateSettings)
  const addCategory = useStore((state) => state.addCategory)
  const updateCategory = useStore((state) => state.updateCategory)
  const deleteCategory = useStore((state) => state.deleteCategory)
  const done = useStore((state) => state.done)
  const backlog = useStore((state) => state.backlog)
  const recurring = useStore((state) => state.recurring)
  const today = useStore((state) => state.today)
  const importData = useStore((state) => state.importData)

  const [dayStart, setDayStart] = useState(settings.dayStart)
  const [colorMode, setColorMode] = useState(settings.colorMode || 'auto')
  const [isSaved, setIsSaved] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLOR_PALETTE[0])
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  const [timeSettingExpanded, setTimeSettingExpanded] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)

  // Get categories directly from settings (reactive)
  const categories = settings.categories || []

  const handleSave = () => {
    updateSettings({ dayStart })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleColorModeChange = (newMode) => {
    setColorMode(newMode)
    updateSettings({ colorMode: newMode })
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim(), newCategoryColor)
      setNewCategoryName('')
      setNewCategoryColor(CATEGORY_COLOR_PALETTE[0])
      setShowAddCategory(false)
    }
  }

  const handleUpdateCategory = (id) => {
    if (editingCategory && editingCategory.name.trim()) {
      updateCategory(id, editingCategory.name.trim(), editingCategory.color)
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = (id) => {
    if (confirm('Delete this category? It will be removed from all tasks.')) {
      deleteCategory(id)
    }
  }

  const handleExportData = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        today,
        backlog,
        recurring,
        done,
        settings
      }
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `todays-todos-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError('')
    setImportSuccess(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result
        const parsed = JSON.parse(content)

        // Validate the structure
        if (!parsed.data) {
          setImportError('Invalid backup file: missing data')
          return
        }

        // Check if it's our format (should have version and data fields)
        if (!parsed.version) {
          setImportError('Invalid backup file: missing version')
          return
        }

        // Confirm with user before importing
        const confirmMsg = `This will replace all your current data with the backup from ${
          parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : 'unknown date'
        }. Are you sure?`

        if (confirm(confirmMsg)) {
          importData(parsed.data)
          setImportSuccess(true)
          setTimeout(() => setImportSuccess(false), 3000)
        }
      } catch (error) {
        setImportError(`Failed to import: ${error.message}`)
      }
    }

    reader.onerror = () => {
      setImportError('Failed to read file')
    }

    reader.readAsText(file)
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  const timeOptions = [
    { value: '00:00', label: 'Midnight (00:00)' },
    { value: '01:00', label: '1:00 AM' },
    { value: '02:00', label: '2:00 AM' },
    { value: '03:00', label: '3:00 AM' },
    { value: '04:00', label: '4:00 AM' },
    { value: '05:00', label: '5:00 AM' },
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
  ]

  const colorModeOptions = [
    { value: 'light', label: 'Light', icon: '☀️', description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: '🌙', description: 'Always use dark mode' },
    { value: 'auto', label: 'Auto', icon: '⚙️', description: 'Match system preference' },
  ]

  // Use the palette from colorUtils
  const colorPresets = CATEGORY_COLOR_PALETTE

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize how Today's ToDos works for you.
          </p>
        </div>


        {/* Color Mode Setting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Appearance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose how Today's ToDos looks.
              </p>
            </div>

            <div className="space-y-2">
              {colorModeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleColorModeChange(option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    colorMode === option.value
                      ? 'border-[#F0A500] bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    {colorMode === option.value && (
                      <svg
                        className="w-5 h-5 text-[#F0A500]"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* Categories Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Categories</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Organize your tasks with custom categories
                </p>
              </div>
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                aria-label={categoriesExpanded ? "Collapse categories" : "Expand categories"}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {categoriesExpanded && (
              <>
                {/* Categories List */}
                <div className="space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No categories yet. Add one to get started!
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        {editingCategory?.id === category.id ? (
                          // Edit mode
                          <>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#F0A500] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCategory(category.id)
                                  if (e.key === 'Escape') setEditingCategory(null)
                                }}
                                autoFocus
                              />
                              <div className="flex gap-1 flex-wrap">
                                {colorPresets.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => setEditingCategory({ ...editingCategory, color })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                      editingCategory.color === color
                                        ? 'border-[#F0A500] scale-110'
                                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateCategory(category.id)}
                                className="px-3 py-1.5 text-xs bg-[#F0A500] text-gray-800 rounded-lg hover:bg-[#D89400] transition-colors font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          // View mode
                          <>
                            <div
                              className="w-8 h-8 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {category.name}
                            </span>
                            <button
                              onClick={() => setEditingCategory({ id: category.id, name: category.name, color: category.color })}
                              className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Category Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="w-full px-3 py-2 text-sm bg-[#F0A500] text-gray-800 rounded-lg hover:bg-[#D89400] transition-colors font-semibold"
                  >
                    + Add Category
                  </button>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#F0A500] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory()
                      }}
                      autoFocus
                    />

                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Choose color:</p>
                      <div className="flex gap-2 flex-wrap">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              newCategoryColor === color
                                ? 'border-[#F0A500] scale-110'
                                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 text-sm bg-[#F0A500] text-gray-800 rounded-lg hover:bg-[#D89400] transition-colors font-semibold"
                      >
                        Add Category
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCategory(false)
                          setNewCategoryName('')
                          setNewCategoryColor(CATEGORY_COLOR_PALETTE[0])
                        }}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Day Start Setting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">When does your day start?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {timeSettingExpanded
                    ? "At this time each day, your Today list will reset. Unfinished tasks move to the backlog, and completed tasks are archived."
                    : `Currently: ${timeOptions.find(opt => opt.value === dayStart)?.label || dayStart}`
                  }
                </p>
              </div>
              <button
                onClick={() => setTimeSettingExpanded(!timeSettingExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                aria-label={timeSettingExpanded ? "Collapse time setting" : "Expand time setting"}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${timeSettingExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {timeSettingExpanded && (
              <>
                <div className="space-y-2">
                  {timeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDayStart(option.value)}
                      className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        dayStart === option.value
                          ? 'border-[#F0A500] bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </span>
                        {dayStart === option.value && (
                          <svg
                            className="w-5 h-5 text-[#F0A500]"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      isSaved
                        ? 'bg-green-600 text-white'
                        : 'bg-[#F0A500] text-gray-800 hover:bg-[#D89400] shadow-sm'
                    }`}
                  >
                    {isSaved ? '✓ Saved!' : 'Set time'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">How it works</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Every day at your chosen time, the app automatically starts fresh. 
                Tasks you didn't complete move to your backlog so you can pick them up later. 
                Completed tasks are saved to your "Done!" archive so you can celebrate your wins.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {done.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {backlog.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">In Backlog</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {recurring.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Recurring Tasks</div>
            </div>
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Export & Backup</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Download all your data as a JSON file for backup, or restore from a previous backup.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportData}
                className="px-6 py-2 bg-[#F0A500] text-gray-800 rounded-lg hover:bg-[#D89400] transition-colors font-semibold shadow-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Backup
              </button>

              <label className="px-6 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors font-semibold shadow-sm flex items-center gap-2 cursor-pointer">
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
                </svg>
                Restore Backup
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>

            {/* Import Success Message */}
            {importSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-800 dark:text-green-200">Data imported successfully!</span>
              </div>
            )}

            {/* Import Error Message */}
            {importError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800 dark:text-red-200">{importError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsView
