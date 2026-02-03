import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

function LoginPage() {
  const { loginWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
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

  return (
    <div className="auth-page-wide">
      <div className="auth-bg-pattern"></div>
      <div className="auth-content-wrapper">
        <div className="auth-left-section">
          <div className="auth-brand-showcase">
            <div className="showcase-logo">
              <img src="/logo.png" alt="Nexus Cloud" className="showcase-logo-icon" />
              <span className="showcase-logo-text">Nexus Cloud</span>
            </div>
            <h1>Deploy in one click</h1>
            <p>Connect your GitHub repository and deploy to production in seconds. Experience enterprise-grade deployment infrastructure with real-time monitoring and comprehensive analytics.</p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <div className="feature-content">
                  <strong>Instant Deployments</strong>
                  <span>Deploy from Git in under 30 seconds with zero configuration</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div className="feature-content">
                  <strong>Real-time Analytics</strong>
                  <span>Monitor performance, traffic, and user behavior with live dashboards</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-content">
                  <strong>Auto-scaling</strong>
                  <span>Handle traffic spikes automatically with intelligent scaling</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-wide">
              <div className="form-group-wide">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="form-input-wide"
                />
              </div>

              <div className="form-group-wide">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="form-input-wide"
                />
              </div>

              {error && (
                <div className="error-message-wide">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button
                className="auth-submit-wide"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="auth-divider-wide">
              <span>or</span>
            </div>

            <button
              className="btn-google-wide"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
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
                  Sign up for free
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage