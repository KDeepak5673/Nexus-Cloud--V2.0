import React, { useState, useEffect } from 'react'
import AuthButtons from './AuthButtons.jsx'
import { COLORS } from '../constants/design'

function Navigation({ currentPage }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className="sticky top-0 z-50 transition-all duration-200"
      style={{
        backgroundColor: isScrolled ? 'var(--bg-elevated, rgba(78,65,59,0.9))' : 'var(--bg-surface, rgba(226,222,211,0.7))',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        boxShadow: isScrolled ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <button
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={() => window.appState.setPage('home')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-primary, #FF6D24)' }}>
            <span style={{ color: 'var(--text-primary, #1F1B18)', fontWeight: 'bold', fontSize: '0.875rem' }}>N</span>
          </div>
          <span className="text-lg font-semibold hidden sm:inline" style={{ color: 'var(--text-primary, #1F1B18)' }}>Nexus Cloud</span>
        </button>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            className="transition-colors text-sm font-medium"
            onClick={() => window.appState.setPage('home')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: 0,
              color: currentPage === 'home' ? 'var(--accent-primary, #FF6D24)' : 'var(--text-secondary, rgba(79,72,70,0.8))'
            }}
          >
            Home
          </button>
          <button
            className="transition-colors text-sm font-medium"
            onClick={() => window.appState.setPage('dashboard')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: 0,
              color: currentPage === 'dashboard' ? COLORS.ACCENT : (isScrolled ? 'rgba(226,222,211,0.75)' : COLORS.TEXT_SECONDARY_LIGHT)
            }}
          >
            Dashboard
          </button>
          <button
            className="transition-colors text-sm font-medium"
            onClick={() => window.appState.setPage('docs')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: 0,
              color: currentPage === 'docs' ? COLORS.ACCENT : (isScrolled ? 'rgba(226,222,211,0.75)' : COLORS.TEXT_SECONDARY_LIGHT)
            }}
          >
            Docs
          </button>
        </nav>

        {/* Auth Section */}
        <div>
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}

export default Navigation