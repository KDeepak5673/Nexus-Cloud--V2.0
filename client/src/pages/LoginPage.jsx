import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { COLORS } from '../constants/design'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const { loginWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div style={{ minHeight: '100vh', background: COLORS.LIGHT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: COLORS.ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: COLORS.DARK_PRIMARY, fontWeight: 'bold', fontSize: '1rem' }}>N</span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: '600', color: COLORS.DARK_PRIMARY }}>Nexus Cloud</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: COLORS.DARK_PRIMARY, margin: '0 0 0.5rem 0' }}>Welcome back</h1>
          <p style={{ color: COLORS.TEXT_MUTED_LIGHT, margin: 0, fontSize: '0.9rem' }}>Sign in to your account to continue</p>
        </div>

        {/* Form Card */}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: COLORS.DARK_PRIMARY }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: `1px solid ${COLORS.MUTED}33`, fontSize: '0.95rem', boxSizing: 'border-box', transition: 'all 0.2s', outline: 'none', color: COLORS.DARK_PRIMARY }}
                onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
                onBlur={(e) => e.target.style.borderColor = COLORS.MUTED + '33'}
              />
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: COLORS.DARK_PRIMARY }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', paddingRight: '2.5rem', borderRadius: '0.5rem', border: `1px solid ${COLORS.MUTED}33`, fontSize: '0.95rem', boxSizing: 'border-box', transition: 'all 0.2s', outline: 'none', color: COLORS.DARK_PRIMARY }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
                  onBlur={(e) => e.target.style.borderColor = COLORS.MUTED + '33'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.MUTED, display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#FEE2E2', border: `1px solid #FECACA`, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircle size={18} color="#991B1B" style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                <span style={{ color: '#991B1B', fontSize: '0.875rem' }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: COLORS.ACCENT, color: COLORS.DARK_PRIMARY, fontWeight: '600', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: COLORS.MUTED }}>
            <div style={{ flex: 1, height: '1px', background: COLORS.MUTED + '33' }}></div>
            <span style={{ fontSize: '0.875rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: COLORS.MUTED + '33' }}></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: `1px solid ${COLORS.MUTED}33`, background: 'white', color: COLORS.DARK_PRIMARY, fontWeight: '600', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: loading ? 0.7 : 1 }}
            onMouseEnter={(e) => !loading && (e.target.style.background = COLORS.LIGHT_BG)}
            onMouseLeave={(e) => !loading && (e.target.style.background = 'white')}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: COLORS.TEXT_SECONDARY_LIGHT }}>
          <span>Don't have an account? </span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.appState.setPage('signup')
            }}
            style={{ color: COLORS.ACCENT, textDecoration: 'none', fontWeight: '600', cursor: 'pointer' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Sign up for free
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
