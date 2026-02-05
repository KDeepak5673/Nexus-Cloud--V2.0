import { auth } from '../auth/firebase'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9000'

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`

    // Get current user's UID for authentication
    const user = auth.currentUser
    const headers = {
        'Content-Type': 'application/json',
        ...(user && { 'x-firebase-uid': user.uid }),
        ...options.headers
    }

    const res = await fetch(url, {
        ...options,
        headers
    })
    const text = await res.text()
    try { return JSON.parse(text) } catch (e) { return text }
}

export async function registerUser(userData) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    })
}

export async function getUser(firebaseUid) {
    return request(`/auth/user/${firebaseUid}`)
}

export async function createProject(payload) {
    return request('/projects', { method: 'POST', body: JSON.stringify(payload) })
}

export async function deployProject(payload) {
    return request('/api/deploy', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getLogs(id) {
    return request(`/logs/${id}`)
}

export async function getProjects() {
    return request('/projects')
}

export async function getDeployments() {
    return request('/api/deployments')
}

export async function getProject(id) {
    return request(`/projects/${id}`)
}

export async function getUserProfile(firebaseUid) {
    return request(`/auth/user/${firebaseUid}`)
}

export async function deployProjectById(projectId) {
    return request(`/api/projects/${projectId}/deploy`, { method: 'POST' })
}

export async function getDeploymentStatus(deploymentId) {
    const user = auth.currentUser
    return request(`/api/deployments/${deploymentId}/status`, {
        headers: {
            'Authorization': user ? `Bearer ${await user.getIdToken()}` : '',
            'x-firebase-uid': user?.uid
        }
    })
}

export async function getDeploymentUrl(deploymentId) {
    const user = auth.currentUser
    return request(`/api/deployments/${deploymentId}/url`, {
        headers: {
            'Authorization': user ? `Bearer ${await user.getIdToken()}` : '',
            'x-firebase-uid': user?.uid
        }
    })
}

export async function getAnalytics() {
    return request('/api/analytics')
}

export async function resolveSubdomain(subdomain) {
    return request(`/api/resolve/${subdomain}`)
}

export async function updateDeploymentStatus(deploymentId, status) {
    return request(`/api/deployments/${deploymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    })
}

export async function simulateDeployment(deploymentId) {
    return request(`/api/deployments/${deploymentId}/simulate`, {
        method: 'POST'
    })
}

export async function updateProjectConfig(projectId, config) {
    return request(`/projects/${projectId}/config`, {
        method: 'PATCH',
        body: JSON.stringify(config)
    })
}

export default {
    registerUser,
    getUser,
    createProject,
    deployProject,
    deployProjectById,
    getLogs,
    getProjects,
    getDeployments,
    getDeploymentStatus,
    getDeploymentUrl,
    getProject,
    getUserProfile,
    getAnalytics,
    resolveSubdomain,
    updateDeploymentStatus,
    simulateDeployment,
    updateProjectConfig
}
