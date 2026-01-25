import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

function AuthView() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleMagicLinkSignIn = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      if (error) throw error

      setMessage('Check your email for the magic link!')
      setEmail('')
    } catch (error) {
      console.error('Error signing in:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-calm-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-2">
            2do2day
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A minimal, calming daily to-do app
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-calm-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">
            Sign in to sync your tasks
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
            We'll send you a magic link to sign in
          </p>

          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#F0A500] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F0A500] text-white rounded-lg hover:bg-[#D89400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending magic link...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send magic link
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Your tasks will be securely stored and synced across all your devices
            </p>
          </div>
        </div>

        {/* Optional: Continue without signing in */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <button
              onClick={() => {
                // TODO: Implement "use without account" mode
                alert('Local-only mode coming soon! For now, please sign in to use the app.')
              }}
              className="text-[#F0A500] hover:text-[#D89400] font-medium"
            >
              continue without an account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthView
