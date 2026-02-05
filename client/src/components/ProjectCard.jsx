import { getProjectUrl, getProjectDisplayUrl, isProjectLive } from '../lib/utils.js';

function ProjectCard({ id, title, environment, lastDeployed, subDomain, deploymentStatus }) {
    const handleCardClick = () => {
        // Navigate to project details page
        window.appState.setPage('projectDetails', { projectId: id });
    };

    const handleViewLogs = (e) => {
        e.stopPropagation(); // Prevent card click when clicking the button
        // Navigate to project details page
        window.appState.setPage('projectDetails', { projectId: id });
    };

    const handleRetryDeployment = async (e) => {
        e.stopPropagation(); // Prevent card click when clicking the button

        if (deploymentStatus !== 'FAIL') {
            return;
        }

        try {
            // Get current user token
            const user = window.appState.user;
            if (!user) {
                alert('Please log in to retry deployment');
                return;
            }

            const token = await user.getIdToken();
            const response = await fetch(`http://localhost:5000/api/projects/${id}/deploy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                alert('Deployment started! The page will refresh to show the new status.');
                window.location.reload(); // Refresh to show new deployment
            } else {
                const errorData = await response.json();
                alert(`Failed to retry deployment: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error retrying deployment:', error);
            alert('Error retrying deployment. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'READY': '#1F2937',
            'IN_PROGRESS': '#6B7280',
            'QUEUED': '#9CA3AF',
            'FAIL': '#D1D5DB',
            'NOT_STARTED': '#E5E7EB'
        }
        return statusColors[status] || '#6b7280'
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            'READY': 'Live',
            'IN_PROGRESS': 'Deploying',
            'QUEUED': 'Queued',
            'FAIL': 'Failed',
            'NOT_STARTED': 'Not Started'
        }
        return statusLabels[status] || status
    };

    const getStatusDescription = (status) => {
        const descriptions = {
            'READY': 'Successfully deployed and running',
            'IN_PROGRESS': 'Deployment in progress...',
            'QUEUED': 'Waiting to start deployment...',
            'FAIL': 'Deployment failed - check logs for details',
            'NOT_STARTED': 'No deployments yet'
        }
        return descriptions[status] || 'Unknown status'
    };

    // Determine if project is accessible (only if status is READY)
    const isLive = isProjectLive(deploymentStatus);
    const isFailed = deploymentStatus === 'FAIL';
    const isDeploying = deploymentStatus === 'IN_PROGRESS';

    const projectUrl = getProjectUrl(subDomain);
    const displayUrl = getProjectDisplayUrl(subDomain);

    return (
        <div className="project-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className="project-header">
                <h3>{title}</h3>
                <div
                    className="deployment-status-badge"
                    style={{ backgroundColor: getStatusColor(deploymentStatus) }}
                    title={getStatusDescription(deploymentStatus)}
                >
                    {isDeploying && <span className="spinner">⟳</span>}
                    {getStatusLabel(deploymentStatus) || 'NOT_STARTED'}
                </div>
            </div>

            <div className="project-meta">
                <span className="environment-badge">{environment}</span>
                <span className="last-deployed">Last deployed: {lastDeployed}</span>
            </div>

            {subDomain && isLive && (
                <div className="deployment-url">
                    <a href={projectUrl} target="_blank" rel="noopener noreferrer">
                        {displayUrl}
                    </a>
                    <span className="live-indicator">● LIVE</span>
                </div>
            )}

            {subDomain && !isLive && (
                <div className="deployment-url inactive">
                    {displayUrl}
                    <span className="inactive-indicator">● OFFLINE</span>
                </div>
            )}

            {isFailed && (
                <div className="failure-notice">
                    Deployment failed. Check logs for details.
                </div>
            )}

            <div className="project-actions">
                <button
                    className="view-logs-btn"
                    onClick={handleViewLogs}
                    title="View deployment logs"
                >
                    View Logs
                </button>

                {isFailed && (
                    <button
                        className="retry-btn"
                        onClick={handleRetryDeployment}
                        title="Retry failed deployment"
                    >
                        Retry Deploy
                    </button>
                )}
            </div>

            <style jsx>{`
                .project-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s ease;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .project-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    border-color: #4A90E2;
                }

                .project-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .project-header h3 {
                    margin: 0;
                    color: #1a2a3a;
                    font-size: 1.25rem;
                    font-weight: 600;
                    flex: 1;
                }

                .deployment-status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 500;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    cursor: help;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    display: inline-block;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .project-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .environment-badge {
                    background: #F9FAFB;
                    color: #1F2937;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    width: fit-content;
                }

                .last-deployed {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .deployment-url {
                    background: #F9FAFB;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    color: #1F2937;
                    border: 1px solid #E5E7EB;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .deployment-url a {
                    color: #122a2c;
                    text-decoration: none;
                    font-weight: 500;
                }

                .deployment-url a:hover {
                    text-decoration: underline;
                }

                .deployment-url.inactive {
                    background: #f8fafc;
                    color: #64748b;
                    border-color: #e2e8f0;
                }

                .live-indicator {
                    color: #122a2c;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .inactive-indicator {
                    color: #64748b;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .failure-notice {
                    background: #F9FAFB;
                    color: #1F2937;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    border: 1px solid #E5E7EB;
                }

                .project-actions {
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                    margin-top: auto;
                    display: flex;
                    gap: 0.5rem;
                    flex-direction: column;
                }

                .view-logs-btn, .retry-btn {
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .view-logs-btn {
                    background: #122a2c;
                    color: white;
                }

                .view-logs-btn:hover {
                    background: #1F2937;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .retry-btn {
                    background: #6B7280;
                    color: white;
                }

                .retry-btn:hover {
                    background: #4B5563;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                }

                .retry-btn:active {
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
}

export default ProjectCard;