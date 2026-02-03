const prisma = require('../config/database')
const { generateSlug } = require('random-word-slugs')


async function validateGitHubRepository(gitURL) {
    console.log(`🔍 Validating GitHub repository: ${gitURL}`)

    // Extract owner and repo from URL
    const gitUrlMatch = gitURL.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    
    if (!gitUrlMatch) {
        const error = new Error('Invalid GitHub repository URL format. Use: https://github.com/owner/repo')
        error.statusCode = 400
        throw error
    }

    const [, owner, repo] = gitUrlMatch
    const cleanRepo = repo.replace(/\.git$/, '')  // Remove .git extension

    // Check if repository exists via GitHub API
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`)
        
        if (response.status === 404) {
            const error = new Error(`GitHub repository '${owner}/${cleanRepo}' does not exist or is private`)
            error.statusCode = 400
            throw error
        }

        if (!response.ok) {
            console.warn(`GitHub API returned ${response.status} for ${owner}/${cleanRepo}`)
        } else {
            console.log(`✅ GitHub repository validated: ${owner}/${cleanRepo}`)
        }

        return { owner, repo: cleanRepo }
    } catch (error) {
        if (error.statusCode) throw error  // Re-throw if already has status code
        
        const apiError = new Error('Failed to validate GitHub repository')
        apiError.statusCode = 400
        throw apiError
    }
}


async function createProject(name, gitURL, userId) {
    // Validate GitHub repository first
    await validateGitHubRepository(gitURL)

    // Create project with generated subdomain
    const project = await prisma.project.create({
        data: {
            name,
            gitURL,
            subDomain: generateSlug(),  // Generate random subdomain
            userId
        }
    })

    return project
}


async function getUserProjects(userId) {
    return await prisma.project.findMany({
        where: { userId },
        include: {
            Deployement: {
                orderBy: { createdAt: 'desc' },
                take: 1  // Only latest deployment per project
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}


async function getProjectById(projectId) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            Deployement: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!project) {
        const error = new Error('Project not found')
        error.statusCode = 404
        throw error
    }

    // Add deployment URLs for READY deployments
    const projectWithUrls = {
        ...project,
        Deployement: project.Deployement.map(deployment => ({
            ...deployment,
            url: deployment.status === 'READY'
                ? `https://${project.subDomain}.nexuscloud.app`
                : null
        }))
    }

    return projectWithUrls
}

module.exports = {
    validateGitHubRepository,
    createProject,
    getUserProjects,
    getProjectById
}