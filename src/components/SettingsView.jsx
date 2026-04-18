import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { CATEGORY_COLOR_PALETTE } from '../utils/colorUtils'
import { supabase } from '../lib/supabase'

function SettingsView({ onSignOut }) {
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

  // Get current user email
  const [userEmail, setUserEmail] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email)
    })
  }, [])

  // Admin-only: total user count
  const isAdmin = userEmail === 'hebedesign@gmail.com'
  const [userCount, setUserCount] = useState(null)
  useEffect(() => {
    if (!isAdmin) return
    supabase.rpc('user_count').then(({ data, error }) => {
      if (error) {
        console.warn('user_count rpc failed:', error.message)
        return
      }
      setUserCount(data)
    })
  }, [isAdmin])

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
  const [passwordExpanded, setPasswordExpanded] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

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

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match")
      return
    }

    try {
      setPasswordLoading(true)
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMessage('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setPasswordMessage(null)
        setPasswordExpanded(false)
      }, 2000)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setPasswordLoading(false)
    }
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
    { value: 'dark', label: 'Dark (riso navy)', icon: '🌙', description: 'New riso-inspired dark' },
    { value: 'dark-2', label: 'Dark (classic)', icon: '🌑', description: 'Original gray dark' },
    { value: 'auto', label: 'Auto', icon: '⚙️', description: 'Match system preference' },
  ]

  // Use the palette from colorUtils
  const colorPresets = CATEGORY_COLOR_PALETTE

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-normal text-ink">Settings</h1>
          <p className="text-sm text-ink-muted mt-1">
            Customize how Today's ToDos works for you.
          </p>
          {userEmail && (
            <p className="text-xs text-ink-muted mt-2">
              Logged in as <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="bg-card rounded-lg shadow-sm border border-edge p-6">
          <h2 className="text-lg font-medium text-ink mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-display text-4xl font-normal text-ink">
                {done.length}
              </div>
              <div className="text-xs text-ink-muted mt-1">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-normal text-ink">
                {backlog.length}
              </div>
              <div className="text-xs text-ink-muted mt-1">In Backlog</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-normal text-ink">
                {recurring.length}
              </div>
              <div className="text-xs text-ink-muted mt-1">Recurring Tasks</div>
            </div>
          </div>
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-edge text-center">
              <span className="text-xs text-ink-faint">
                Admin · {userCount ?? '—'} total {userCount === 1 ? 'user' : 'users'} on 2do2day
              </span>
            </div>
          )}
        </div>

        {/* Color Mode Setting */}
        <div className="bg-card rounded-lg shadow-sm border border-edge p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-ink">Appearance</h2>
              <p className="text-sm text-ink-muted mt-1">
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
                      ? 'border-brand bg-brand-subtle'
                      : 'border-edge hover:border-edge dark:hover:border-edge hover:bg-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-ink">
                          {option.label}
                        </div>
                        <div className="text-xs text-ink-muted mt-0.5">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    {colorMode === option.value && (
                      <svg
                        className="w-5 h-5 text-brand"
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
        <div className="bg-card rounded-lg shadow-sm border border-edge p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-ink">Categories</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Organize your tasks with custom categories
                </p>
              </div>
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="p-2 text-ink-muted hover:text-ink transition-colors"
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
                    <p className="text-sm text-ink-muted text-center py-4">
                      No categories yet. Add one to get started!
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-edge"
                      >
                        {editingCategory?.id === category.id ? (
                          // Edit mode
                          <>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-edge-strong rounded-lg focus:outline-none focus:border-brand bg-card text-ink"
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
                                        ? 'border-brand scale-110'
                                        : 'border-edge-strong hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateCategory(category.id)}
                                className="px-3 py-1.5 text-xs bg-brand text-brand-on rounded-lg hover:bg-brand-dark transition-colors font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
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
                            <span className="flex-1 text-sm font-medium text-ink">
                              {category.name}
                            </span>
                            <button
                              onClick={() => setEditingCategory({ id: category.id, name: category.name, color: category.color })}
                              className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors whitespace-nowrap"
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
                    className="w-full px-3 py-2 text-sm bg-brand text-brand-on rounded-lg hover:bg-brand-dark transition-colors font-semibold"
                  >
                    + Add Category
                  </button>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                  <div className="p-4 bg-hover rounded-lg space-y-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      className="w-full px-3 py-2 text-sm border border-edge-strong rounded-lg focus:outline-none focus:border-brand bg-card text-ink"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory()
                      }}
                      autoFocus
                    />

                    <div>
                      <p className="text-xs text-ink-muted mb-2">Choose color:</p>
                      <div className="flex gap-2 flex-wrap">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              newCategoryColor === color
                                ? 'border-brand scale-110'
                                : 'border-edge-strong hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 text-sm bg-brand text-brand-on rounded-lg hover:bg-brand-dark transition-colors font-semibold"
                      >
                        Add Category
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCategory(false)
                          setNewCategoryName('')
                          setNewCategoryColor(CATEGORY_COLOR_PALETTE[0])
                        }}
                        className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
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
        <div className="bg-card rounded-lg shadow-sm border border-edge p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-ink">When does your day start?</h2>
                <p className="text-sm text-ink-muted mt-1">
                  {timeSettingExpanded
                    ? "At this time each day, your Today list will reset. Unfinished tasks move to the backlog, and completed tasks are archived."
                    : `Currently: ${timeOptions.find(opt => opt.value === dayStart)?.label || dayStart}`
                  }
                </p>
              </div>
              <button
                onClick={() => setTimeSettingExpanded(!timeSettingExpanded)}
                className="p-2 text-ink-muted hover:text-ink transition-colors"
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
                          ? 'border-brand bg-brand-subtle'
                          : 'border-edge hover:border-edge dark:hover:border-edge hover:bg-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {option.label}
                        </span>
                        {dayStart === option.value && (
                          <svg
                            className="w-5 h-5 text-brand"
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
                        : 'bg-brand text-brand-on hover:bg-brand-dark shadow-sm'
                    }`}
                  >
                    {isSaved ? '✓ Saved!' : 'Set time'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-card rounded-lg shadow-sm border border-edge p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-ink">Export & Backup</h2>
              <p className="text-sm text-ink-muted mt-1">
                Download all your data as a JSON file for backup, or restore from a previous backup.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportData}
                className="px-6 py-2 bg-brand text-brand-on rounded-lg hover:bg-brand-dark transition-colors font-semibold shadow-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Backup
              </button>

              <label className="px-6 py-2 border border-edge-strong text-ink rounded-lg hover:bg-hover transition-colors font-semibold flex items-center gap-2 cursor-pointer">
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
        {/* Account — password + sign out */}
        <div className="bg-card rounded-lg shadow-sm border border-edge p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-ink">Change password</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Update your account password
                </p>
              </div>
              <button
                onClick={() => {
                  setPasswordExpanded(!passwordExpanded)
                  setPasswordError(null)
                  setPasswordMessage(null)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="p-2 text-ink-muted hover:text-ink transition-colors"
                aria-label={passwordExpanded ? "Collapse" : "Expand"}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${passwordExpanded ? 'rotate-180' : ''}`}
                  fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {passwordExpanded && (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {passwordMessage && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">{passwordMessage}</p>
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{passwordError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 border border-edge-strong rounded-lg focus:outline-none focus:border-brand transition-colors bg-input text-ink disabled:opacity-50"
                  />
                  <p className="text-xs text-ink-muted mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 border border-edge-strong rounded-lg focus:outline-none focus:border-brand transition-colors bg-input text-ink disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="px-6 py-2 bg-brand text-brand-on rounded-lg hover:bg-brand-dark transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {passwordLoading && (
                    <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  )}
                  {passwordLoading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            )}

            {onSignOut && (
              <div className="pt-4 border-t border-edge flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-ink">Sign out</h2>
                  <p className="text-sm text-ink-muted mt-1">
                    Sign out of this device. Your data stays synced.
                  </p>
                </div>
                <button
                  onClick={onSignOut}
                  className="px-4 py-2 text-sm rounded-lg border border-edge-strong text-ink hover:bg-hover transition-colors font-medium whitespace-nowrap"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default SettingsView
