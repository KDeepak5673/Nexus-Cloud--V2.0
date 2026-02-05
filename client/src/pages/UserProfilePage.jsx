import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getUserProfile } from '../lib/api.js'
import { getProjectUrl } from '../lib/utils.js'
import ImageUpload from '../components/ImageUpload.jsx'

function UserProfilePage() {
    const { user, logout, updateProfile } = useAuth()
    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({
        displayName: '',
        photoURL: ''
    })
    const [updateLoading, setUpdateLoading] = useState(false)
    const [updateError, setUpdateError] = useState('')

    useEffect(() => {
        if (user?.uid) {
            fetchUserProfile()
            // Initialize edit form with current user data
            setEditForm({
                displayName: user.displayName || '',
                photoURL: user.photoURL || ''
            })
        }
    }, [user])

    const fetchUserProfile = async () => {
        try {
            setLoading(true)
            setError('')

            console.log('Fetching user profile for:', user.uid)
            const response = await getUserProfile(user.uid)

            if (response.status === 'success') {
                setProfileData(response.data.user)
                console.log('User profile data:', response.data.user)
            } else {
                setError('Failed to load profile data')
            }
        } catch (err) {
            console.error('Error fetching user profile:', err)
            setError('Failed to load profile data')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setUpdateError('')
        setUpdateLoading(true)

        try {
            const updates = {}
            if (editForm.displayName.trim()) {
                updates.displayName = editForm.displayName.trim()
            }
            if (editForm.photoURL.trim()) {
                updates.photoURL = editForm.photoURL.trim()
            }

            if (Object.keys(updates).length === 0) {
                setUpdateError('Please provide at least one field to update')
                setUpdateLoading(false)
                return
            }

            await updateProfile(updates)
            setShowEditModal(false)
            // Optionally refresh profile data
            await fetchUserProfile()
        } catch (err) {
            setUpdateError(err.message || 'Failed to update profile')
        } finally {
            setUpdateLoading(false)
        }
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

    const getMemberSince = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        })
    }

    if (!user) {
        return (
            <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1>Please log in to view your profile</h1>
                <button className="btn btn-primary" onClick={() => window.appState.setPage('login')}>
                    Go to Login
                </button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="user-profile-page">
                <div className="container">
                    <div className="loading-spinner-large">
                        <div className="spinner"></div>
                        <p>Loading your profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="user-profile-page">
                <div className="container">
                    <div className="error-container">
                        <h2>Error Loading Profile</h2>
                        <p>{error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={fetchUserProfile}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Calculate stats from real data
    const userStats = {
        totalProjects: profileData?.projects?.length || 0,
        activeProjects: profileData?.projects?.filter(p =>
            p.Deployement?.[0]?.status === 'READY'
        ).length || 0,
        totalDeployments: profileData?.projects?.reduce((sum, p) =>
            sum + (p.Deployement?.length || 0), 0
        ) || 0,
        memberSince: profileData?.createdAt ? getMemberSince(profileData.createdAt) : 'Unknown'
    }

    // Transform projects data
    const userProjects = profileData?.projects?.map(project => {
        const latestDeployment = project.Deployement?.[0]
        const getProjectStatus = (deploymentStatus) => {
            switch (deploymentStatus) {
                case 'READY': return 'Active'
                case 'IN_PROGRESS': return 'Deploying'
                case 'QUEUED': return 'Queued'
                case 'FAIL': return 'Failed'
                case 'NOT_STARTED': return 'Not Started'
                default: return 'Inactive'
            }
        }

        return {
            id: project.id,
            name: project.name,
            status: getProjectStatus(latestDeployment?.status),
            rawStatus: latestDeployment?.status || 'NOT_STARTED',
            deployments: project.Deployement?.length || 0,
            lastDeployed: latestDeployment ? getTimeAgo(latestDeployment.createdAt) : 'Never',
            url: getProjectUrl(project.subDomain)
        }
    }) || []

    return (
        <div className="user-profile-page">
            <div className="container">
                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-info">
                        <div className="profile-avatar">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'Profile'}
                                    className="avatar-image"
                                    onError={(e) => {
                                        // Fallback if image fails to load
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'flex'
                                    }}
                                />
                            ) : null}
                            <div
                                className="avatar-placeholder"
                                style={{ display: user.photoURL ? 'none' : 'flex' }}
                            >
                                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="profile-details">
                            <h1>{user.displayName || user.email?.split('@')[0] || 'Anonymous User'}</h1>
                            <p className="profile-email">{user.email || 'No email provided'}</p>
                            {user.phoneNumber && (
                                <p className="profile-phone">{user.phoneNumber}</p>
                            )}
                            <p className="profile-member">Member since {userStats.memberSince}</p>
                            {!user.displayName && !user.photoURL && (
                                <p className="profile-incomplete" style={{
                                    color: '#f59e0b',
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem'
                                }}>
                                    ⚠️ Profile incomplete. Update your profile details.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="profile-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowEditModal(true)}
                            style={{ marginRight: '1rem' }}
                        >
                            Edit Profile
                        </button>
                        <button className="btn btn-outline" onClick={logout}>Logout</button>
                    </div>
                </div>

                {/* User Stats */}
                <div className="profile-stats">
                    <div className="stat-card">
                        <h3>{userStats.totalProjects}</h3>
                        <p>Total Projects</p>
                    </div>
                    <div className="stat-card">
                        <h3>{userStats.activeProjects}</h3>
                        <p>Active Projects</p>
                    </div>
                    <div className="stat-card">
                        <h3>{userStats.totalDeployments}</h3>
                        <p>Total Deployments</p>
                    </div>
                </div>

                {/* Projects Section */}
                <div className="profile-projects">
                    <div className="section-header">
                        <h2>Your Projects</h2>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.appState.setPage('new-project')}
                        >
                            New Project
                        </button>
                    </div>

                    <div className="projects-list">
                        {userProjects.length > 0 ? (
                            userProjects.map(project => (
                                <div key={project.id} className="project-item">
                                    <div className="project-main">
                                        <div className="project-info">
                                            <h3
                                                onClick={() => window.appState.setPage('projectDetails', { projectId: project.id })}
                                                style={{ cursor: 'pointer', color: '#000000' }}
                                            >
                                                {project.name}
                                            </h3>
                                            <div className="project-meta">
                                                <span className={`status-badge status-${project.status.toLowerCase()}`}>
                                                    {project.status}
                                                </span>
                                                <span>{project.deployments} deployments</span>
                                                <span>Last deployed {project.lastDeployed}</span>
                                            </div>
                                        </div>
                                        <div className="project-actions">
                                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                                Visit Site
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-projects">
                                <p>No projects yet. Create your first project to get started!</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => window.appState.setPage('new-project')}
                                >
                                    Create First Project
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="profile-activity">
                    <h2>Recent Activity</h2>
                    <div className="activity-list">
                        {profileData?.projects?.length > 0 ? (
                            profileData.projects
                                .filter(project => project.Deployement?.length > 0)
                                .slice(0, 5)
                                .map((project, index) => {
                                    const latestDeployment = project.Deployement[0]
                                    const getActivityIcon = (status) => {
                                        switch (status) {
                                            case 'READY': return '🚀'
                                            case 'IN_PROGRESS': return '⏳'
                                            case 'QUEUED': return '🔄'
                                            case 'FAIL': return '❌'
                                            default: return '🔧'
                                        }
                                    }

                                    const getActivityText = (status) => {
                                        switch (status) {
                                            case 'READY': return 'deployed successfully'
                                            case 'IN_PROGRESS': return 'deployment in progress'
                                            case 'QUEUED': return 'deployment queued'
                                            case 'FAIL': return 'deployment failed'
                                            default: return 'status updated'
                                        }
                                    }

                                    return (
                                        <div key={project.id} className="activity-item">
                                            <div className="activity-icon">{getActivityIcon(latestDeployment.status)}</div>
                                            <div className="activity-content">
                                                <p><strong>{project.name}</strong> {getActivityText(latestDeployment.status)}</p>
                                                <span className="activity-time">{getTimeAgo(latestDeployment.createdAt)}</span>
                                            </div>
                                        </div>
                                    )
                                })
                        ) : (
                            <div className="no-activity">
                                <p>No recent activity. Create your first project to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowEditModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label htmlFor="edit-displayName">Display Name</label>
                                <input
                                    id="edit-displayName"
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm(prev => ({
                                        ...prev,
                                        displayName: e.target.value
                                    }))}
                                    placeholder="Enter your name"
                                    className="form-input"
                                />
                            </div>
                            <ImageUpload
                                label="Profile Picture"
                                currentImageUrl={editForm.photoURL}
                                onUploadComplete={(url) => setEditForm(prev => ({
                                    ...prev,
                                    photoURL: url || ''
                                }))}
                            />
                            {updateError && (
                                <div className="error-message" style={{
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem'
                                }}>
                                    {updateError}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={updateLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #6b7280;
                    line-height: 1;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                }

                .modal-close:hover {
                    color: #000;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #374151;
                }

                .form-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #000;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 2rem;
                }

                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                }

                .btn-secondary:hover {
                    background: #e5e7eb;
                }

                .loading-spinner-large {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #000000;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }
                }

                .no-activity {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                }

                .no-projects {
                    text-align: center;
                    padding: 3rem 2rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 2px dashed #cbd5e1;
                }

                .no-projects p {
                    color: #64748b;
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .status-active {
                    background: #d1fae5;
                    color: #059669;
                }

                .status-deploying {
                    background: #fef3c7;
                    color: #d97706;
                }

                .status-queued {
                    background: #e0e7ff;
                    color: #3730a3;
                }

                .status-failed {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .status-inactive,
                .status-not.started {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default UserProfilePage