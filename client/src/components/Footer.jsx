import React from 'react'
import { COLORS } from '../constants/design'

function Footer() {
  return (
    <footer className="mt-auto border-t py-8" style={{ borderColor: 'var(--border-subtle, #e8c4b0)', background: 'var(--bg-surface, #FDF8F5)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
            <button
              className="text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => window.appState.setPage('dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <span style={{ color: 'var(--accent-hover, #E8CCBF)' }}>|</span>
            <button
              className="text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => window.appState.setPage('new-project')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Deploy Project
            </button>
            <span style={{ color: 'var(--accent-hover, #E8CCBF)' }}>|</span>
            <button
              className="text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => window.appState.setPage('docs')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Documentation
            </button>
            <span style={{ color: 'var(--accent-hover, #E8CCBF)' }}>|</span>
            <a
              href="https://github.com/KDeepak5673/Nexus-Cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage hover:underline transition-colors"
            >
              GitHub
            </a>
            <span style={{ color: 'var(--accent-hover, #E8CCBF)' }}>|</span>
            <button
              className="text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => window.appState.setPage('profile')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Profile
            </button>
            <span style={{ color: COLORS.BEIGE }}>|</span>
            <a href="mailto:nexuscloud@gmail.com" className="text-sage hover:underline transition-colors">
              Contact Us
            </a>
          </div>
        </div>

        <div className="border-t pt-6 text-center" style={{ borderColor: 'var(--border-subtle, #e8c4b0)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>
            &copy; 2025 Nexus Cloud. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer