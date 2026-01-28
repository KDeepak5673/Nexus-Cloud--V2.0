import React from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { COLORS } from '../constants/design'

function AuthButtons() {
  const { user, signInWithGoogle, logout, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full animate-spin" style={{ borderColor: COLORS.ACCENT, borderTopColor: 'transparent', borderWidth: '2px' }}></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 rounded-md text-accent border border-accent hover:bg-elevated transition-colors"
          onClick={() => window.appState.setPage('login')}
        >
          Login
        </button>
        <button
          className="px-4 py-2 rounded-md text-off-white font-medium transition-all"
          style={{ background: COLORS.ACCENT }}
          onMouseEnter={(e) => e.target.style.background = COLORS.ACCENT}
          onMouseLeave={(e) => e.target.style.background = COLORS.ACCENT}
          onClick={() => window.appState.setPage('signup')}
        >
          Sign Up
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {user.photoURL && (
        <button
          className="w-8 h-8 rounded-full border-2 hover:opacity-80 transition-opacity overflow-hidden"
          style={{ borderColor: COLORS.ACCENT, background: COLORS.BEIGE }}
          onClick={() => window.appState.setPage('profile')}
        >
          <img
            src={user.photoURL}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </button>
      )}
      <button
        className="text-sm text-secondary hover:text-primary transition-colors hidden sm:block"
        onClick={(e) => {
          e.preventDefault()
          window.appState.setPage('profile')
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {user.displayName || user.email}
      </button>
      <button
        className="px-3 py-1.5 rounded-md text-sm border transition-colors"
        style={{
          borderColor: COLORS.ACCENT,
          color: COLORS.ACCENT,
        }}
        onMouseEnter={(e) => e.target.style.background = COLORS.BEIGE_LIGHT}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
        onClick={logout}
      >
        Logout
      </button>
    </div>
  )
}

export default AuthButtons