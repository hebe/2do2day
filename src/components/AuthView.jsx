import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

function AuthView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'reset'

  const handlePasswordAuth = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        })
        if (error) throw error

        // Check if email confirmation is required
        if (data?.user && !data?.session) {
          setMessage('Please check your email to confirm your account before signing in.')
        } else {
          setMessage('Account created! You can now sign in.')
        }
        setMode('signin')
        setPassword('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Session will be handled by App.jsx's auth listener
      }
    } catch (error) {
      console.error('Error with auth:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const redirectUrl = import.meta.env.VITE_SITE_URL ||
                         (window.location.hostname === 'localhost'
                           ? window.location.origin
                           : `https://${window.location.hostname}`)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) throw error

      setMessage('Check your email for the password reset link!')
      setEmail('')
      setMode('signin')
    } catch (error) {
      console.error('Error resetting password:', error)
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
            {mode === 'reset' ? 'Reset your password' : mode === 'signup' ? 'Create an account' : 'Sign in to sync your tasks'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
            {mode === 'reset'
              ? "We'll send you a password reset link"
              : mode === 'signup'
              ? 'Your tasks will be synced across all your devices'
              : 'Welcome back!'}
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

          <form onSubmit={mode === 'reset' ? handlePasswordReset : handlePasswordAuth} className="space-y-4">
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

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#F0A500] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum 6 characters
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || (mode !== 'reset' && !password)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F0A500] text-white rounded-lg hover:bg-[#D89400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'reset' ? 'Sending reset link...' : mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {mode === 'reset' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}
                </>
              )}
            </button>
          </form>

          {/* Mode switching */}
          <div className="mt-4 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => {
                    setMode('reset')
                    setPassword('')
                    setError(null)
                    setMessage(null)
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#F0A500] dark:hover:text-[#F0A500]"
                >
                  Forgot password?
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup')
                      setPassword('')
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-[#F0A500] hover:text-[#D89400] font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <button
                onClick={() => {
                  setMode('signin')
                  setPassword('')
                  setError(null)
                  setMessage(null)
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#F0A500] dark:hover:text-[#F0A500]"
              >
                Back to sign in
              </button>
            )}
          </div>

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
