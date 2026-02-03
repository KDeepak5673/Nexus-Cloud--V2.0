import { auth } from '../auth/firebase'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9000'

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`

    // Get current user's UID for authentication
    const user = auth.currentUser
    const headers = {
        'Content-Type': 'application/json',
        ...(user && { 'x-firebase-uid': user.uid })
    }

    const res = await fetch(url, {
        headers,
        ...options
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
    return request('/project', { method: 'POST', body: JSON.stringify(payload) })
}

export async function deployProject(payload) {
    return request('/deploy', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getLogs(id) {
    return request(`/logs/${id}`)
}

export async function getProjects() {
    return request('/projects')
}

export async function getDeployments() {
    return request('/deployments')
}

export async function getProject(id) {
    return request(`/projects/${id}`)
}

export async function getUserProfile(firebaseUid) {
    return request(`/auth/user/${firebaseUid}`)
}

export default {
    registerUser,
    getUser,
    createProject,
    deployProject,
    getLogs,
    getProjects,
    getDeployments,
    getProject,
    getUserProfile
}
