import React from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

function AuthButtons() {
  const { user, signInWithGoogle, logout, loading } = useAuth()

  if (loading) {
    return <div className="auth-buttons"><span>...</span></div>
  }

  if (!user) {
    return (
      <div className="auth-buttons">
        <button className="btn btn-outline" onClick={() => window.appState.setPage('login')}>Login</button>
        <button className="btn btn-primary" onClick={() => window.appState.setPage('signup')}>Sign Up</button>
      </div>
    )
  }

  return (
    <div className="auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt="avatar"
          style={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => window.appState.setPage('profile')}
        />
      )}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          window.appState.setPage('profile')
        }}
        style={{
          fontSize: 14,
          color: '#FFFFFF',
          textDecoration: 'none',
          transition: 'opacity 0.2s',
          fontWeight: 500
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
      >
        {user.displayName || user.email}
      </a>
      <button className="btn btn-outline" onClick={logout}>Logout</button>
    </div>
  )
}

export default AuthButtons