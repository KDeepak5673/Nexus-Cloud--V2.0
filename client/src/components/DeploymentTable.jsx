import React, { useState } from 'react'
import api from '../lib/api'
import { COLORS } from '../constants/design'

function DeploymentTable({ deployments }) {
    const [loadingId, setLoadingId] = useState(null)

    const handleDeploy = async (projectId) => {
        setLoadingId(projectId)
        try {
            const res = await api.deployProject({ projectId })
            if (res && res.status === 'queued') {
                console.log('Deployment queued:', res.data.deploymentId)
            } else {
                console.error('Failed to queue deployment')
            }
        } catch (err) {
            console.error('Network error:', err.message)
        } finally {
            setLoadingId(null)
        }
    }

    const handleViewLogs = async (deploymentId, projectId) => {
        window.appState.setPage('projectDetails', { projectId: projectId })
    }

    const getStatusBadgeColor = (status) => {
        const colors = {
            'READY': 'var(--accent-primary, #266150)',
            'IN_PROGRESS': 'var(--accent-hover, #DDAF94)',
            'QUEUED': 'var(--accent-hover, #e8c4b0)',
            'FAIL': '#a86b4f',
            'NOT_STARTED': 'var(--text-muted, #6b6562)'
        }
        return colors[status] || 'var(--text-muted, #6b6562)'
    }

    return (
                <div className="rounded-lg shadow-soft border overflow-hidden"
                    style={{ background: 'var(--bg-surface, #fff)', borderColor: 'var(--border-subtle, #e8c4b0)' }}>
            <table className="w-full">
                <thead style={{ background: 'var(--bg-elevated, #E8CCBF)', borderBottom: '1px solid var(--border-subtle, #e8c4b0)' }}>
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary, #4F4846)' }}>Project</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary, #4F4846)' }}>Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary, #4F4846)' }}>Deployment ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary, #4F4846)' }}>Timestamp</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary, #4F4846)' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {deployments.map((deployment, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle, #e8c4b0)' }} className="hover:opacity-90 transition-colors">
                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary, rgba(79,72,70,0.8))' }}>{deployment.project}</td>
                            <td className="px-6 py-4 text-sm">
                                <span
                                    className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: getStatusBadgeColor(deployment.status), color: 'var(--text-primary, #FDF8F5)' }}
                                >
                                    {deployment.statusDisplay}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>{deployment.id}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>{deployment.timestamp}</td>
                            <td className="px-6 py-4 text-sm flex gap-2">
                                <button
                                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                                    style={{ backgroundColor: 'var(--accent-primary, #266150)', color: 'var(--text-primary, #FDF8F5)' }}
                                    onClick={() => handleDeploy(deployment.projectId)}
                                    disabled={loadingId === deployment.projectId}
                                >
                                    {loadingId === deployment.projectId ? 'Queuing…' : 'Deploy'}
                                </button>
                                <button
                                    className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                                    style={{ color: 'var(--accent-primary, #266150)', borderColor: 'var(--accent-primary, #266150)', background: 'transparent' }}
                                    onClick={() => handleViewLogs(deployment.id, deployment.projectId)}
                                >
                                    📋 Logs
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DeploymentTable;