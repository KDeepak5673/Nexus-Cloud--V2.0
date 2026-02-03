import React, { useState } from 'react'
import api from '../lib/api'

function DeploymentTable({ deployments }) {
    const [loadingId, setLoadingId] = useState(null)

    const handleDeploy = async (projectId) => {
        setLoadingId(projectId)
        try {
            const res = await api.deployProject({ projectId })
            if (res && res.status === 'queued') {
                console.log('Deployment queued:', res.data.deploymentId)
                // TODO: Show success notification instead of alert
            } else {
                console.error('Failed to queue deployment')
                // TODO: Show error notification instead of alert
            }
        } catch (err) {
            console.error('Network error:', err.message)
            // TODO: Show error notification instead of alert
        } finally {
            setLoadingId(null)
        }
    }

    const handleViewLogs = async (deploymentId, projectId) => {
        // Navigate to project details page where logs can be viewed
        window.appState.setPage('projectDetails', { projectId: projectId })
    }

    return (
        <table className="deployments-table">
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Deployment ID</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {deployments.map((deployment, index) => (
                    <tr key={index}>
                        <td>{deployment.project}</td>
                        <td>
                            <span className={`status-badge status-${deployment.status}`}>
                                {deployment.statusDisplay}
                            </span>
                        </td>
                        <td>{deployment.id}</td>
                        <td>{deployment.timestamp}</td>
                        <td>
                            <button className="btn" onClick={() => handleDeploy(deployment.projectId)} disabled={loadingId === deployment.projectId}>
                                {loadingId === deployment.projectId ? 'Queuing…' : 'Deploy'}
                            </button>
                            {' '}
                            <button className="btn btn-ghost" onClick={() => handleViewLogs(deployment.id, deployment.projectId)}>
                                📋 View Logs
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default DeploymentTable;