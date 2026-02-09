import React, { useState, useEffect } from 'react'
import { getProject, getLogs } from '../lib/api'
import { getProjectUrl } from '../lib/utils.js'
import ProjectConfigModal from '../components/ProjectConfigModal.jsx'
import '../styles/ProjectDetails.css'
import '../styles/ProjectConfig.css'

function ProjectDetailsPage({ projectId }) {
    const [project, setProject] = useState(null)
    const [deployments, setDeployments] = useState([])
    const [logs, setLogs] = useState([])
    const [selectedDeployment, setSelectedDeployment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [logsLoading, setLogsLoading] = useState(false)
    const [refreshInterval, setRefreshInterval] = useState(null)
    const [showConfigModal, setShowConfigModal] = useState(false)
    const [expandedView, setExpandedView] = useState(false)
    const [allDeploymentLogs, setAllDeploymentLogs] = useState([])

    useEffect(() => {
        if (projectId) {
            fetchProjectDetails()
        }

        // Cleanup interval on unmount
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval)
            }
        }
    }, [projectId])

    useEffect(() => {
        if (selectedDeployment) {
            fetchDeploymentLogs(selectedDeployment.id)
        }
    }, [selectedDeployment])

    useEffect(() => {
        // Set up auto-refresh for active deployments
        const hasActiveDeployment = deployments.some(dep =>
            dep.status === 'QUEUED' || dep.status === 'IN_PROGRESS'
        )

        if (hasActiveDeployment) {
            // Refresh every 3 seconds if there are active deployments
            const interval = setInterval(fetchProjectDetails, 3000)
            setRefreshInterval(interval)
        } else {
            // Clear interval if no active deployments
            if (refreshInterval) {
                clearInterval(refreshInterval)
                setRefreshInterval(null)
            }
        }

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval)
            }
        }
    }, [deployments])

    const fetchProjectDetails = async () => {
        try {
            // Don't show loading for auto-refresh
            if (!project) {
                setLoading(true)
            }
            setError('')

            console.log('Fetching project details for:', projectId)
            const response = await getProject(projectId)

            if (response.status === 'success') {
                setProject(response.data.project)
                const newDeployments = response.data.project.Deployement || []
                setDeployments(newDeployments)

                // Auto-select the latest deployment if none selected
                if (!selectedDeployment && newDeployments.length > 0) {
                    setSelectedDeployment(newDeployments[0])
                } else if (selectedDeployment) {
                    // Update selected deployment status if it exists
                    const updatedSelected = newDeployments.find(dep => dep.id === selectedDeployment.id)
                    if (updatedSelected) {
                        setSelectedDeployment(updatedSelected)
                    }
                }
            } else {
                setError('Failed to load project details')
            }
        } catch (err) {
            console.error('Error fetching project details:', err)
            setError('Failed to load project details')
        } finally {
            setLoading(false)
        }
    }

    const fetchDeploymentLogs = async (deploymentId) => {
        try {
            setLogsLoading(true)
            console.log('Fetching logs for deployment:', deploymentId)

            const response = await getLogs(deploymentId)
            if (response.logs) {
                setLogs(response.logs)
            } else {
                setLogs([])
            }
        } catch (err) {
            console.error('Error fetching logs:', err)
            setLogs([])
        } finally {
            setLogsLoading(false)
        }
    }

    const fetchAllDeploymentLogs = async () => {
        try {
            setLogsLoading(true)
            const allLogs = []

            for (const deployment of deployments) {
                const response = await getLogs(deployment.id)
                if (response.logs && response.logs.length > 0) {
                    // Add deployment info to each log
                    response.logs.forEach(log => {
                        allLogs.push({
                            ...log,
                            deploymentId: deployment.id,
                            deploymentDate: deployment.createdAt,
                            deploymentStatus: deployment.status
                        })
                    })
                }
            }

            // Sort all logs by timestamp
            allLogs.sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
                return timeA - timeB
            })

            setAllDeploymentLogs(allLogs)
        } catch (err) {
            console.error('Error fetching all deployment logs:', err)
            setAllDeploymentLogs([])
        } finally {
            setLogsLoading(false)
        }
    }

    const handleExpandView = async () => {
        if (!expandedView) {
            await fetchAllDeploymentLogs()
        }
        setExpandedView(!expandedView)
    }

    const handleRetryDeployment = async () => {
        try {
            const user = window.appState.user
            if (!user) {
                alert('Please log in to retry deployment')
                return
            }

            const token = await user.getIdToken()
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}/deploy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()

            if (response.ok) {
                alert('New deployment started successfully!')
                // Refresh project details to show new deployment
                fetchProjectDetails()
            } else {
                alert(`Failed to start deployment: ${data.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error starting deployment:', error)
            alert('Error starting deployment. Please try again.')
        }
    }

    const getStatusColor = (status) => {
        const statusColors = {
            'READY': '#1F2937',
            'IN_PROGRESS': '#6b7280',
            'QUEUED': '#9ca3af',
            'FAIL': '#D1D5DB',
            'NOT_STARTED': '#E5E7EB'
        }
        return statusColors[status] || '#6b7280'
    }

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMinutes = Math.floor((now - date) / (1000 * 60))

        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`

        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d ago`
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard:', text)
        }).catch(err => {
            console.error('Failed to copy:', err)
        })
    }

    if (loading) {
        return (
            <div className="project-details-container">
                <div className="container">
                    <div className="loading-spinner-large">
                        <div className="spinner"></div>
                        <p>Loading project details...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="project-details-container">
                <div className="container">
                    <div className="error-container">
                        <h2>Error Loading Project</h2>
                        <p>{error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.appState.setPage('dashboard')}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="project-details-container">
                <div className="container">
                    <div className="error-container">
                        <h2>Project Not Found</h2>
                        <p>The requested project could not be found.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.appState.setPage('dashboard')}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const deploymentUrl = getProjectUrl(project.subDomain)

    return (
        <div className="project-details-container">
            <div className="container">
                {/* Header */}
                <div className="project-header">
                    <button
                        className="btn btn-outline back-button"
                        onClick={() => window.appState.setPage('dashboard')}
                    >
                        ← Back to Dashboard
                    </button>

                    <div className="project-title-section">
                        <h1>{project.name}</h1>
                        <p className="project-description">
                            Repository: <a href={project.gitURL} target="_blank" rel="noopener noreferrer">{project.gitURL}</a>
                        </p>
                    </div>
                </div>

                {/* Deployment URL Card */}
                <div className="deployment-url-card">
                    <div className="card-header">
                        <h3>Live Deployment</h3>
                        <div className={`status-badge ${project.Deployement?.[0]?.status?.toLowerCase().replace(/[^a-z]/g, '-') || 'not-started'}`}>
                            {project.Deployement?.[0]?.status || 'NOT_STARTED'}
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
                            Copy
                        </button>
                    </div>
                    <div className="url-hint">
                        {project.Deployement?.[0]?.status === 'READY'
                            ? 'Your project is live and accessible at this URL'
                            : 'Your project will be available at this URL once deployment is complete'
                        }
                    </div>
                </div>

                {/* Project Configuration Card */}
                <div className="project-config-card">
                    <div className="card-header">
                        <h3>Project Configuration</h3>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowConfigModal(true)}
                        >
                            ⚙️ Edit Configuration
                        </button>
                    </div>
                    <div className="config-summary">
                        <div className="config-item">
                            <span className="config-label">Environment Variables:</span>
                            <span className="config-value">
                                {Object.keys(project.env || {}).length} variable(s)
                                {Object.keys(project.env || {}).length > 0 && (
                                    <span className="env-vars-preview">
                                        {' '}({Object.keys(project.env).slice(0, 3).join(', ')}
                                        {Object.keys(project.env).length > 3 && '...'})
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="config-item">
                            <span className="config-label">Project Root:</span>
                            <code className="config-value">{project.rootDir || '.'}</code>
                        </div>
                        <div className="config-item">
                            <span className="config-label">Install Command:</span>
                            <code className="config-value">{project.installCommand || 'npm install'}</code>
                        </div>
                        <div className="config-item">
                            <span className="config-label">Build Command:</span>
                            <code className="config-value">{project.buildCommand || 'npm run build'}</code>
                        </div>
                    </div>
                </div>

                <div className="project-content" style={{ gridTemplateColumns: expandedView ? '1fr' : '300px 1fr' }}>
                    {/* Deployments List */}
                    {!expandedView && (
                    <div className="deployments-section">
                        <h3>Deployment History</h3>
                        <div className="deployments-list">
                            {deployments.length > 0 ? (
                                deployments.map((deployment) => (
                                    <div
                                        key={deployment.id}
                                        className={`deployment-item ${selectedDeployment?.id === deployment.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedDeployment(deployment)}
                                    >
                                        <div className="deployment-info">
                                            <div className="deployment-id">#{deployment.id.slice(-8)}</div>
                                            <div className="deployment-time">{getTimeAgo(deployment.createdAt)}</div>
                                        </div>
                                        <div
                                            className="deployment-status"
                                            style={{ '--status-color': getStatusColor(deployment.status) }}
                                        >
                                            {deployment.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-deployments">
                                    <p>No deployments found for this project.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Logs Section */}
                    <div className="logs-section" style={{ gridColumn: expandedView ? '1' : 'auto' }}>
                        <div className="logs-header">
                            <h3>Deployment Logs</h3>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleExpandView}
                                style={{ marginLeft: 'auto' }}
                            >
                                {expandedView ? '� Collapse' : '⛶ Expand'}
                            </button>
                        </div>
                        {!expandedView && selectedDeployment && (
                                <div className="selected-deployment-info">
                                    <div className="deployment-info-details">
                                        <span className="deployment-id">
                                            Deployment #{selectedDeployment.id.slice(-8)}
                                        </span>
                                        <span
                                            className="deployment-status-badge"
                                            style={{
                                                backgroundColor: getStatusColor(selectedDeployment.status),
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {selectedDeployment.status === 'IN_PROGRESS' && '⟳ '}
                                            {selectedDeployment.status}
                                        </span>
                                        {selectedDeployment.status === 'FAIL' && (
                                            <button
                                                className="retry-deployment-btn"
                                                onClick={handleRetryDeployment}
                                                title="Start a new deployment"
                                            >
                                                Retry Deploy
                                            </button>
                                        )}
                                    </div>
                                    {selectedDeployment.status === 'FAIL' && (
                                        <div className="failure-message">
                                            This deployment failed. Check the logs below for details.
                                        </div>
                                    )}
                                    {selectedDeployment.status === 'IN_PROGRESS' && (
                                        <div className="progress-message">
                                            Deployment is currently in progress. Logs will update automatically.
                                        </div>
                                    )}
                                    {selectedDeployment.status === 'QUEUED' && (
                                        <div className="queued-message">
                                            Deployment is queued and will start shortly.
                                        </div>
                                    )}
                                </div>
                            )}

                        {!expandedView ? (
                            <div className="logs-container">
                                {logsLoading ? (
                                    <div className="logs-loading">
                                        <div className="spinner"></div>
                                        <p>Loading logs...</p>
                                    </div>
                                ) : logs.length > 0 ? (
                                    logs.map((log, idx) => (
                                        <div key={idx} className="log-entry">
                                            <span className="log-timestamp">
                                                [{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}]
                                            </span>
                                            <span className="log-content">{log.log}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-logs">
                                        <p>
                                            {selectedDeployment
                                                ? 'No logs available for this deployment.'
                                                : 'Select a deployment to view logs.'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="logs-container expanded-logs">
                                {logsLoading ? (
                                    <div className="logs-loading">
                                        <div className="spinner"></div>
                                        <p>Loading all deployment logs...</p>
                                    </div>
                                ) : allDeploymentLogs.length > 0 ? (
                                    allDeploymentLogs.map((log, logIdx) => (
                                        <div key={logIdx} className="log-entry">
                                            <span className="log-timestamp">
                                                [{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}]
                                            </span>
                                            <span className="log-content">{log.log}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-logs">
                                        <p>No deployment logs available.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Configuration Modal */}
            {showConfigModal && (
                <ProjectConfigModal
                    project={project}
                    onClose={() => setShowConfigModal(false)}
                    onUpdate={(updatedProject) => {
                        setProject(updatedProject)
                        fetchProjectDetails() // Refresh to get latest data
                    }}
                />
            )}
        </div>
    )
}

export default ProjectDetailsPage