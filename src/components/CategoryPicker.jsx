import React from 'react'
import useStore from '../store/useStore'

function CategoryPicker({ selectedCategory, onSelect, onClose }) {
  const { settings } = useStore()
  const categories = settings.categories || []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div className="bg-card rounded-t-3xl md:rounded-lg shadow-xl border-t md:border border-edge w-full max-w-md animate-slideUp">
          {/* Header */}
          <div className="px-6 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">
              Choose Category
            </h2>
            <button
              onClick={onClose}
              className="text-ink-faint hover:text-ink-muted transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Categories */}
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {/* None option */}
            <button
              onClick={() => {
                onSelect(null)
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedCategory === null
                  ? 'bg-hover'
                  : 'hover:bg-hover'
              }`}
            >
              <div className="w-6 h-6 rounded-full border-2 border-edge-strong flex items-center justify-center">
                {selectedCategory === null && (
                  <div className="w-3 h-3 rounded-full bg-edge-strong dark:bg-hover0" />
                )}
              </div>
              <span className="text-sm font-medium text-ink dark:text-ink">
                No category
              </span>
            </button>

            {/* Category options */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onSelect(category.id)
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-hover'
                    : 'hover:bg-hover'
                }`}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  {selectedCategory === category.id && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-ink dark:text-ink">
                  {category.name}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-edge bg-hover">
            <p className="text-xs text-ink-muted text-center">
              Manage categories in Settings
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default CategoryPicker
