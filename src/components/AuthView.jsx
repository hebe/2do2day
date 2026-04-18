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
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-extrabold text-ink mb-2 flex items-center justify-center gap-3">
            <svg
              className="logo-mark h-10 w-16"
              viewBox="0 0 32 20"
              aria-hidden="true"
            >
              <circle className="logo-accent" cx="10" cy="10" r="10" />
              <circle className="logo-mono"   cx="22" cy="10" r="10" />
            </svg>
            2do2day
          </h1>
          <p className="text-ink-muted">
            A minimal, calming daily to-do app
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-card rounded-lg shadow-sm border border-edge p-8">
          <h2 className="text-xl font-medium text-ink mb-2 text-center">
            {mode === 'reset' ? 'Reset your password' : mode === 'signup' ? 'Create an account' : 'Sign in to sync your tasks'}
          </h2>
          <p className="text-sm text-ink-muted mb-6 text-center">
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
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
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
                className="w-full px-4 py-3 border border-edge-strong rounded-lg focus:outline-none focus:border-brand transition-colors bg-input text-ink disabled:opacity-50"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
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
                  className="w-full px-4 py-3 border border-edge-strong rounded-lg focus:outline-none focus:border-brand transition-colors bg-input text-ink disabled:opacity-50"
                />
                {mode === 'signup' && (
                  <p className="text-xs text-ink-muted mt-1">
                    Minimum 6 characters
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || (mode !== 'reset' && !password)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                  className="text-sm text-ink-muted hover:text-brand dark:hover:text-brand"
                >
                  Forgot password?
                </button>
                <div className="text-sm text-ink-muted">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup')
                      setPassword('')
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-brand hover:text-brand-dark font-medium"
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
                className="text-sm text-ink-muted hover:text-brand dark:hover:text-brand"
              >
                Back to sign in
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-edge">
            <p className="text-xs text-ink-muted text-center">
              Your tasks will be securely stored and synced across all your devices
            </p>
          </div>
        </div>

        {/* Credit / contact */}
        <div className="mt-8 text-center">
          <p className="text-xs text-ink-faint">
            An app by{' '}
            <a
              href="https://github.com/hebe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted hover:text-ink underline underline-offset-2"
            >
              Hebe
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthView
