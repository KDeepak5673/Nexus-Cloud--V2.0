import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

function LoginPage() {
  const { loginWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      window.appState.setPage('home')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      window.appState.setPage('home')
    } catch (err) {
      setError(err.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulate sending reset link
    setTimeout(() => {
      setLoading(false)
      setIsForgotPassword(false)
      alert('Password reset link has been sent to your email!')
    }, 1500)
  }

  return (
    <div className="auth-page-centered">
      <div className="auth-bg-pattern"></div>
      <div className="auth-center-container">
        <div className="auth-form-card-centered">
          <div className="auth-logo-centered">
            <img src="/logo.png" alt="Nexus Cloud" className="auth-logo-image" />
          </div>
          <div className="auth-form-header">
            <h2>{isForgotPassword ? 'Reset Password' : 'Login to your account'}</h2>
            <p>{isForgotPassword ? 'Enter your email to receive a reset link' : 'Enter your email below to login to your account'}</p>
          </div>

          {error && (
            <div className="error-message-wide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={isForgotPassword ? handleForgotPasswordSubmit : handleSubmit} className="auth-form-wide">
            {isForgotPassword ? (
              <>
                <div className="form-group-wide">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                    className="form-input-wide"
                    disabled={loading}
                  />
                </div>

                <div className="form-actions-row">
                  <button
                    type="button"
                    className="auth-back-btn"
                    onClick={() => setIsForgotPassword(false)}
                    disabled={loading}
                  >
                    Back to login
                  </button>
                  <button
                    className="auth-submit-wide"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-group-wide">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                    className="form-input-wide"
                    disabled={loading}
                  />
                </div>

                <div className="form-group-wide">
                  <div className="form-label-row">
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="forgot-password-link"
                      disabled={loading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="form-input-wide"
                    disabled={loading}
                  />
                </div>

                <button
                  className="auth-submit-wide"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>

                <button
                  className="btn-google-wide"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  type="button"
                >
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Login with Google
                </button>

                <div className="auth-footer-wide">
                  <p>
                    Don't have an account?{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        window.appState.setPage('signup')
                      }}
                      className="auth-link-wide"
                    >
                      Sign up
                    </a>
                  </p>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage