import React, { useState } from 'react'
import api from '../lib/api'
import { getProjectUrl, getProjectDisplayUrl } from '../lib/utils.js'

function NewProjectPage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [deploymentUrl, setDeploymentUrl] = useState('')
  const [deploymentStatus, setDeploymentStatus] = useState('')

  // Helper function to sanitize project name for subdomain
  const sanitizeSubdomain = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
  }

  const handleDeploy = async (e) => {
    e.preventDefault()
    setError('')
    setDeploymentUrl('')
    setDeploymentStatus('')

    if (!repoUrl || !/^https?:\/\/github\.com\//i.test(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo).')
      return
    }

    if (!projectName.trim()) {
      setError('Please enter a project name or domain.')
      return
    }

    setLoading(true)
    setLogs([`🚀 Starting deployment for project: ${projectName}`])

    try {
      const name = projectName.trim()
      console.log('Creating project:', { name, gitURL: repoUrl })

      const res = await api.createProject({ name, gitURL: repoUrl })
      if (res && res.status === 'success') {
        const projectId = res.data.project.id
        setLogs(prev => [...prev, `✅ Project created successfully `])

        // Start deploy automatically
        setLogs(prev => [...prev, `📦 Initiating deployment...`])
        const deployRes = await api.deployProject({ projectId })

        if (deployRes && deployRes.status === 'queued') {
          const deployId = deployRes.data.deploymentId
          setDeploymentStatus('Building...')
          setLogs(prev => [...prev, `⏳ Deployment queued with ID: ${deployId}`])

          // Generate deployment URL (this would typically come from your API)
          const subdomain = sanitizeSubdomain(name)
          const generatedUrl = getProjectUrl(subdomain)
          setDeploymentUrl(generatedUrl)
          setLogs(prev => [...prev, `🌐 Deployment URL: ${generatedUrl}`])          // Start polling logs
          let attempts = 0
          const maxAttempts = 150 // ~5 minutes
          const interval = setInterval(async () => {
            attempts++
            try {
              const logsRes = await api.getLogs(deployId)
              if (logsRes && logsRes.logs) {
                setLogs(prev => {
                  const newLines = logsRes.logs.map(r => r.log)
                  const combined = [...prev, ...newLines]
                  return Array.from(new Set(combined))
                })

                // Check deployment status
                const joined = logsRes.logs.map(l => l.log).join('\n')
                if (/BUILD_FINISHED|DEPLOYMENT_COMPLETE/i.test(joined)) {
                  setDeploymentStatus('Deployed Successfully')
                  setLogs(prev => [...prev, `🎉 Deployment completed successfully!`])
                  clearInterval(interval)
                } else if (/ERROR|FAILED/i.test(joined)) {
                  setDeploymentStatus('Deployment Failed')
                  setLogs(prev => [...prev, `❌ Deployment failed. Check logs for details.`])
                  clearInterval(interval)
                } else if (attempts >= maxAttempts) {
                  setDeploymentStatus('Timeout')
                  setLogs(prev => [...prev, `⏰ Deployment timeout reached.`])
                  clearInterval(interval)
                }
              }
            } catch (err) {
              console.log('Log polling error:', err)
            }
          }, 2000)
        } else {
          setError('Failed to queue deployment')
          setLogs(prev => [...prev, `❌ Failed to queue deployment`])
        }
      } else {
        setError((res && res.error) || 'Failed to create project')
        setLogs(prev => [...prev, `❌ Failed to create project: ${(res && res.error) || 'Unknown error'}`])
      }
    } catch (err) {
      setError(err.message || 'Network error')
      setLogs(prev => [...prev, `❌ Network error: ${err.message || 'Unknown error'}`])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  return (
    <div className="new-project-container">
      <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
        <button
          className="btn btn-outline back-button"
          onClick={() => window.appState.setPage('dashboard')}
          style={{ marginBottom: 24 }}
        >
          ← Back to Dashboard
        </button>

        <div className="page-header">
          <h1>Create New Project</h1>
          <p>Deploy your GitHub repository with a custom domain name</p>
        </div>

        <div className="deployment-form-card">
          <form onSubmit={handleDeploy} className="deployment-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="projectName">
                  Project Name
                  <span className="required">*</span>
                </label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="my-awesome-project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="form-input"
                />
                <div className="input-hint">
                  This will be used as your subdomain: <strong>{projectName ? getProjectDisplayUrl(sanitizeSubdomain(projectName)) : 'project-name.localhost:8000'}</strong>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="repoUrl">
                  GitHub Repository URL
                  <span className="required">*</span>
                </label>
                <input
                  id="repoUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                  className="form-input"
                />
                <div className="input-hint">
                  Make sure your repository is public or you have access permissions
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary deploy-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Deploying...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Deploy Project
                </>
              )}
            </button>
          </form>
        </div>

        {/* Deployment URL Section */}
        {deploymentUrl && (
          <div className="deployment-url-card">
            <div className="card-header">
              <h3>🌐 Deployment URL</h3>
              <div className={`status-badge ${deploymentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                {deploymentStatus || 'Building...'}
              </div>
            </div>
            <div className="url-container">
              <div className="url-display">
                <a
                  href={deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="deployment-link"
                >
                  {deploymentUrl}
                </a>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(deploymentUrl)}
                title="Copy URL"
              >
                📋
              </button>
            </div>
            <div className="url-hint">
              Your project will be available at this URL once deployment is complete
            </div>
          </div>
        )}

        {/* Enhanced Logs Section */}
        {logs.length > 0 && (
          <div className="deployment-logs-card">
            <div className="card-header">
              <h3>📋 Deployment Logs</h3>
              <div className="logs-info">
                <span className="log-count">{logs.length} entries</span>
                <button
                  className="clear-logs-btn"
                  onClick={() => setLogs([])}
                  title="Clear logs"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
            <div className="logs-container">
              {logs.map((line, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-timestamp">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span className="log-content">{line}</span>
                </div>
              ))}
            </div>
            <div className="logs-footer">
              <small>Logs update automatically every 2 seconds during deployment</small>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .new-project-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #6B7280;
          font-size: 1.1rem;
        }

        .deployment-form-card,
        .deployment-url-card,
        .deployment-logs-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        .form-row {
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #000000;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .required {
          color: #000000;
        }

        .form-input {
          padding: 0.75rem;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }

        .input-hint {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          color: #000000;
          margin-bottom: 1rem;
        }

        .deploy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .card-header h3 {
          margin: 0;
          color: #000000;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-badge.building {
          background: #F3F4F6;
          color: #4B5563;
          border: 1px solid #E5E7EB;
        }

        .status-badge.deployed-successfully {
          background: #000000;
          color: #FFFFFF;
        }

        .status-badge.deployment-failed {
          background: #FFFFFF;
          color: #000000;
          border: 1px solid #000000;
        }

        .url-container {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .url-display {
          flex: 1;
          padding: 0.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .deployment-link {
          color: #000000;
          text-decoration: underline;
          font-weight: 500;
        }

        .deployment-link:hover {
          text-decoration: none;
        }

        .copy-btn {
          padding: 0.75rem;
          background: #000000;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .copy-btn:hover {
          background: #374151;
        }

        .url-hint {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .logs-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .log-count {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .clear-logs-btn {
          padding: 0.25rem 0.5rem;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .clear-logs-btn:hover {
          background: #E5E7EB;
        }

        .logs-container {
          background: #000000;
          border-radius: 8px;
          padding: 1rem;
          max-height: 400px;
          overflow-y: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .log-entry {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .log-timestamp {
          color: #9CA3AF;
          flex-shrink: 0;
          min-width: 90px;
        }

        .log-content {
          color: #E5E7EB;
          flex: 1;
        }

        .logs-footer {
          margin-top: 1rem;
          text-align: center;
        }

        .logs-footer small {
          color: #6B7280;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px 15px !important;
          }
          
          .page-header h1 {
            font-size: 2rem;
          }
          
          .deployment-form-card,
          .deployment-url-card,
          .deployment-logs-card {
            padding: 1.5rem;
          }
          
          .url-container {
            flex-direction: column;
          }
          
          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default NewProjectPage


