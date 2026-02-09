import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import ImageUpload from '../components/ImageUpload.jsx'

function SignupPage() {
  const { signupWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      // Pass display name and photo URL to signup
      await signupWithEmail(
        email,
        password,
        displayName.trim() || null,
        photoURL.trim() || null
      )
      window.appState.setPage('home')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      window.appState.setPage('home')
    } catch (err) {
      setError(err.message || 'Google signup failed')
    } finally {
      setLoading(false)
    }
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
              <h2>Create Account</h2>
              <p>Sign up to start deploying your projects</p>
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

            <form onSubmit={handleSubmit} className="auth-form-wide">
              <div className="form-group-wide">
                <label htmlFor="displayName">Full Name (Optional)</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="form-input-wide"
                />
              </div>

              <div className="form-group-wide">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
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
                  placeholder="Create a password (min. 6 characters)"
                  required
                  className="form-input-wide"
                />
              </div>

              <div className="form-group-wide">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="form-input-wide"
                />
              </div>

              <button
                className="auth-submit-wide"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <button
                className="btn-google-wide"
                onClick={handleGoogleSignup}
                disabled={loading}
                type="button"
              >
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </button>

              <div className="auth-footer-wide">
                <p>
                  Already have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      window.appState.setPage('login')
                    }}
                    className="auth-link-wide"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </form>
          </div>
      </div>
    </div>
  )
}

export default SignupPage