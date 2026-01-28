import React from 'react'

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-links">
          <a href="#" onClick={() => window.appState.setPage('dashboard')}>Dashboard</a>
          <a href="#" onClick={() => window.appState.setPage('new-project')}>Deploy Project</a>
          {/* <a href="#" onClick={() => window.appState.setPage('analytics')}>Analytics</a> */}
          <a href="#" onClick={() => window.appState.setPage('docs')}>Documentation</a>
          <span className="footer-separator">|</span>
          <a href="https://github.com/KDeepak5673/Nexus-Cloud" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#" onClick={() => window.appState.setPage('profile')}>Profile</a>
          <a href="mailto:nexuscloud@gmail.com">Contact Us</a>
        </div>
        <div className="copyright">
          <p>&copy; 2025 Nexus Cloud. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer