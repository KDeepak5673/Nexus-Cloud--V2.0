import { getProjectUrl, getProjectDisplayUrl, isProjectLive } from '../lib/utils.js';
import { COLORS } from '../constants/design'

function ProjectCard({ id, title, environment, lastDeployed, subDomain, deploymentStatus }) {
    const handleCardClick = () => {
        window.appState.setPage('projectDetails', { projectId: id });
    };

    const handleViewLogs = (e) => {
        e.stopPropagation();
        window.appState.setPage('projectDetails', { projectId: id });
    };

    const handleRetryDeployment = async (e) => {
        e.stopPropagation();

        if (deploymentStatus !== 'FAIL') {
            return;
        }

        try {
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
                alert('Deployment started! The page will refresh to show the new status.');
                window.location.reload();
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
            'READY': 'var(--accent-primary, #266150)',
            'IN_PROGRESS': 'var(--accent-hover, #DDAF94)',
            'QUEUED': 'var(--accent-hover, #e8c4b0)',
            'FAIL': '#a86b4f',
            'NOT_STARTED': 'var(--text-muted, #6b6562)'
        }
        return statusColors[status] || 'var(--text-muted, #6b6562)'
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

    const isLive = isProjectLive(deploymentStatus);
    const isFailed = deploymentStatus === 'FAIL';
    const isDeploying = deploymentStatus === 'IN_PROGRESS';

    const projectUrl = getProjectUrl(subDomain);
    const displayUrl = getProjectDisplayUrl(subDomain);

    return (
                <div className="rounded-lg shadow-soft border p-6 hover:shadow-md transition-shadow cursor-pointer"
                    style={{ background: 'var(--bg-surface, #fff)', borderColor: 'var(--border-subtle, #e8c4b0)' }}
                    onClick={handleCardClick}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
                    <p className="text-sm text-text-muted mt-1">{environment}</p>
                <div
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{ backgroundColor: getStatusColor(deploymentStatus), color: 'var(--text-primary, #FDF8F5)' }}
                    title={getStatusDescription(deploymentStatus)}
                >
                    {isDeploying && <span className="inline-block animate-spin mr-1">\u27f3</span>}
                    {getStatusLabel(deploymentStatus) || 'NOT_STARTED'}
                </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                        <span className="inline-block px-2 py-1 rounded-md text-xs font-medium"
                                            style={{ background: 'var(--accent-hover, #E8CCBF)', color: 'var(--accent-primary, #266150)' }}>{environment}</span>
                                        <span style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>Last deployed: {lastDeployed}</span>
                                </div>
            </div>

            {subDomain && isLive && (
                <div className="mb-4 p-3 rounded-md"
                  style={{ background: 'var(--accent-hover, #E8CCBF)', borderLeft: '3px solid var(--accent-primary, #266150)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-primary, #4F4846)' }}> <a href={projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary, #266150)', textDecoration: 'underline' }}>{displayUrl}</a></span>
                        <span className="text-xs font-medium" style={{ color: 'var(--accent-primary, #266150)' }}> LIVE</span>
                    </div>
                </div>
            )}

            {subDomain && !isLive && (
                <div className="mb-4 p-3 rounded-md" style={{ background: 'var(--bg-elevated, #f5dfd4)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>🌐 {displayUrl}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>● OFFLINE</span>
                    </div>
                </div>
            )}

            {isFailed && (
                <div className="mb-4 p-3 rounded-md" style={{ background: 'rgba(168,107,79,0.13)', borderLeft: '3px solid #a86b4f' }}>
                    <p className="text-sm" style={{ color: '#a86b4f' }}>⚠️ Deployment failed. Check logs for details.</p>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium border transition-colors"
                    style={{ color: 'var(--accent-primary, #266150)', borderColor: 'var(--accent-primary, #266150)', background: 'transparent' }}
                    onClick={handleViewLogs}
                    title="View deployment logs"
                >
                    📋 View Logs
                </button>

                {isFailed && (
                    <button
                        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{ background: 'var(--accent-primary, #266150)', color: 'var(--text-primary, #FDF8F5)' }}
                        onClick={handleRetryDeployment}
                        title="Retry failed deployment"
                    >
                        🔄 Retry
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProjectCard;