const prisma = require('../config/database')
const { generateSlug } = require('random-word-slugs')
const { getPrimaryBillingAccountForUser } = require('./billing-account.service')

const DEPLOYMENT_BASE_DOMAIN = (process.env.DEPLOYMENT_BASE_DOMAIN || 'nexus-cloud.tech').trim()
const DEPLOYMENT_URL_PROTOCOL = (process.env.DEPLOYMENT_URL_PROTOCOL || 'https').trim()

function buildDeploymentUrl(subDomain) {
    return `${DEPLOYMENT_URL_PROTOCOL}://${subDomain}.${DEPLOYMENT_BASE_DOMAIN}`
}

const SUPPORTED_FRAMEWORKS = new Set([
    'auto',
    'next',
    'vite',
    'react',
    'vue',
    'angular'
])

const SUPPORTED_PACKAGE_MANAGERS = new Set(['npm', 'pnpm', 'yarn', 'bun'])

function normalizeText(value) {
    if (value === undefined || value === null) return undefined
    const trimmed = String(value).trim()
    return trimmed.length > 0 ? trimmed : undefined
}

function normalizeFramework(value) {
    const normalized = normalizeText(value)?.toLowerCase()
    if (!normalized) return 'auto'
    return SUPPORTED_FRAMEWORKS.has(normalized) ? normalized : 'auto'
}

function normalizePackageManager(value) {
    const normalized = normalizeText(value)?.toLowerCase()
    if (!normalized) return 'npm'
    return SUPPORTED_PACKAGE_MANAGERS.has(normalized) ? normalized : 'npm'
}

function getCommandsForFrameworkAndPackageManager(framework, packageManager) {
    if (framework === 'next') {
        switch (packageManager) {
            case 'pnpm':
                return {
                    installCommand: 'pnpm install --frozen-lockfile',
                    buildCommand: 'pnpm run build -- --no-lint'
                }
            case 'yarn':
                return {
                    installCommand: 'yarn install --frozen-lockfile || yarn install',
                    buildCommand: 'yarn build --no-lint'
                }
            case 'bun':
                return {
                    installCommand: 'bun install',
                    buildCommand: 'bun run build -- --no-lint'
                }
            case 'npm':
            default:
                return {
                    installCommand: 'npm install',
                    buildCommand: 'npm run build -- --no-lint'
                }
        }
    }

    switch (packageManager) {
        case 'pnpm':
            return {
                installCommand: 'pnpm install --frozen-lockfile',
                buildCommand: 'pnpm run build'
            }
        case 'yarn':
            return {
                installCommand: 'yarn install --frozen-lockfile || yarn install',
                buildCommand: 'yarn build'
            }
        case 'bun':
            return {
                installCommand: 'bun install',
                buildCommand: 'bun run build'
            }
        case 'npm':
        default:
            return {
                installCommand: 'npm install',
                buildCommand: 'npm run build'
            }
    }
}

function resolveProjectCommandConfig(config = {}) {
    const framework = normalizeFramework(config.framework)
    const packageManager = normalizePackageManager(config.packageManager)
    const providedBuildCommand = normalizeText(config.buildCommand)
    const providedInstallCommand = normalizeText(config.installCommand)

    if (providedBuildCommand || providedInstallCommand || framework === 'auto') {
        return {
            buildCommand: providedBuildCommand,
            installCommand: providedInstallCommand
        }
    }

    return getCommandsForFrameworkAndPackageManager(framework, packageManager)
}


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


async function createProject(name, gitURL, userId, config = {}) {
    // Validate GitHub repository first
    await validateGitHubRepository(gitURL)
    const billingAccount = await getPrimaryBillingAccountForUser(userId)

    // Prepare project data with optional configuration
    const projectData = {
        name,
        gitURL,
        subDomain: generateSlug(),  // Generate random subdomain
        userId,
        billingAccountId: billingAccount.id
    }

    const commandConfig = resolveProjectCommandConfig(config)

    // Add configuration if provided
    if (config.env !== undefined) projectData.env = config.env
    if (config.rootDir !== undefined) projectData.rootDir = config.rootDir
    if (commandConfig.buildCommand !== undefined) projectData.buildCommand = commandConfig.buildCommand
    if (commandConfig.installCommand !== undefined) projectData.installCommand = commandConfig.installCommand

    // Create project with generated subdomain and optional config
    const project = await prisma.project.create({
        data: projectData
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
                ? buildDeploymentUrl(project.subDomain)
                : null
        }))
    }

    return projectWithUrls
}

async function updateProjectConfig(projectId, userId, config) {
    // Verify project exists and user owns it
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    })

    if (!project) {
        const error = new Error('Project not found')
        error.statusCode = 404
        throw error
    }

    if (project.userId !== userId) {
        const error = new Error('Access denied')
        error.statusCode = 403
        throw error
    }

    const commandConfig = resolveProjectCommandConfig(config)

    // Prepare update data (only include defined fields)
    const updateData = {}
    if (config.env !== undefined) updateData.env = config.env
    if (config.rootDir !== undefined) updateData.rootDir = config.rootDir
    if (commandConfig.buildCommand !== undefined) updateData.buildCommand = commandConfig.buildCommand
    if (commandConfig.installCommand !== undefined) updateData.installCommand = commandConfig.installCommand

    // Update project configuration
    const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
            Deployement: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    })

    return updatedProject
}

module.exports = {
    validateGitHubRepository,
    createProject,
    getUserProjects,
    getProjectById,
    updateProjectConfig
}