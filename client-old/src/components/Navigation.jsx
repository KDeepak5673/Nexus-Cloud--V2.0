import React from 'react'
import AuthButtons from './AuthButtons.jsx'

function Navigation({ currentPage }) {
  return (
    <header className="nav-header">
      <div className="nav-background"></div>
      <div className="container">
        <nav className="nav-content">
          <div className="logo-section">
            <a href="#" className="logo-link" onClick={() => window.appState.setPage('home')}>
              <div className="logo">
                <img src="/logo.png" alt="Nexus Cloud" className="logo-icon" />
                <span className="logo-text">Nexus Cloud</span>
              </div>
            </a>
          </div>
          <ul className="nav-menu">
            <li><a href="#" className={currentPage === 'home' ? 'active' : ''} onClick={() => window.appState.setPage('home')}>Home</a></li>
            <li><a href="#" className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => window.appState.setPage('dashboard')}>Dashboard</a></li>
            {/* <li><a href="#" className={currentPage === 'analytics' ? 'active' : ''} onClick={() => window.appState.setPage('analytics')}>Analytics</a></li> */}
            <li><a href="#" className={currentPage === 'docs' ? 'active' : ''} onClick={() => window.appState.setPage('docs')}>Docs</a></li>
          </ul>
          <div className="auth-section">
            <AuthButtons />
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navigation