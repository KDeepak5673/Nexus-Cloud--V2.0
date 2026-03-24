import React, { useState } from 'react'
import api from '../lib/api'

function DeploymentTable({ deployments, onDeleteSuccess }) {
    const [loadingId, setLoadingId] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

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

    const handleDeleteClick = (deploymentId) => {
        setDeleteConfirm(deploymentId)
    }

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return

        setIsDeleting(true)
        try {
            const res = await api.deleteDeployment(deleteConfirm)
            if (res && res.success) {
                console.log('Deployment deleted successfully')
                setDeleteConfirm(null)
                if (onDeleteSuccess) {
                    onDeleteSuccess(deleteConfirm)
                }
                // TODO: Show success notification
            } else {
                console.error('Failed to delete deployment:', res?.message || res)
                alert(`Error: ${res?.message || 'Failed to delete deployment'}`)
            }
        } catch (err) {
            console.error('Delete error:', err)
            alert(`Error: ${err.message || 'Failed to delete deployment'}`)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCancelDelete = () => {
        setDeleteConfirm(null)
    }

    return (
        <>
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
                                <button 
                                    className="btn" 
                                    onClick={() => handleDeploy(deployment.projectId)} 
                                    disabled={loadingId === deployment.projectId}
                                >
                                    {loadingId === deployment.projectId ? 'Queuing…' : 'Deploy'}
                                </button>
                                {' '}
                                <button 
                                    className="btn btn-ghost" 
                                    onClick={() => handleViewLogs(deployment.id, deployment.projectId)}
                                >
                                    View Logs
                                </button>
                                {' '}
                                <button 
                                    className="btn btn-danger-ghost" 
                                    onClick={() => handleDeleteClick(deployment.id)}
                                    title="Delete deployment"
                                >
                                    🗑️ Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={handleCancelDelete}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Delete Deployment</h2>
                        <p>Are you sure you want to delete this deployment? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button 
                                className="btn btn-ghost" 
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DeploymentTable;