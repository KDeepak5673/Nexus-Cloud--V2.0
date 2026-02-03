import React from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

// Simple guard component: shows children only if logged in
function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="container" style={{ padding: 32 }}>Loading...</div>
  if (!user) return (
    <div className="container" style={{ padding: 32 }}>
      <h3>Please sign in</h3>
      <p>You need to login with Google to access this section.</p>
    </div>
  )

  return <>{children}</>
}

export default RequireAuth