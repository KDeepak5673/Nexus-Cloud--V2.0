const prisma = require('../config/database')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
const { deleteDeploymentFromS3 } = require('../utils/s3')
const { ensureBillingAccountForUser } = require('./billing-account.service')

const DEPLOYMENT_BASE_DOMAIN = (process.env.DEPLOYMENT_BASE_DOMAIN || 'nexus-cloud.tech').trim()
const DEPLOYMENT_URL_PROTOCOL = (process.env.DEPLOYMENT_URL_PROTOCOL || 'https').trim()

function buildDeploymentUrl(subDomain) {
    return `${DEPLOYMENT_URL_PROTOCOL}://${subDomain}.${DEPLOYMENT_BASE_DOMAIN}`
}

function buildCompletionMetrics(createdAt) {
    const finishedAt = new Date()
    const deploymentTime = createdAt
        ? Math.max(0, Math.round((finishedAt.getTime() - new Date(createdAt).getTime()) / 1000))
        : null

    return { finishedAt, deploymentTime }
}

const ecsClient = new ECSClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

const config = {
    CLUSTER: process.env.ECS_CLUSTER,
    TASK: process.env.ECS_TASK,
    CONTAINER_NAME: process.env.CONTAINER_NAME,
    SUBNET_1: process.env.SUBNET_1,
    SUBNET_2: process.env.SUBNET_2,
    SUBNET_3: process.env.SUBNET_3,
    SG: process.env.SG
}

function normalizeOptionalCommand(value) {
    if (!value) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function isLegacyDefaultCommand(command, legacyDefault) {
    return command === legacyDefault
}

async function validateGitHubRepository(gitURL) {
    console.log(`🔍 Validating GitHub repository: ${gitURL}`)

    const gitUrlMatch = gitURL.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!gitUrlMatch) {
        const error = new Error('Invalid GitHub repository URL format')
        error.statusCode = 400
        throw error
    }

    const [, owner, repo] = gitUrlMatch
    const cleanRepo = repo.replace(/\.git$/, '')

    const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`)

    if (githubResponse.status === 404) {
        const error = new Error(`GitHub repository '${owner}/${cleanRepo}' does not exist or is private`)
        error.statusCode = 400
        throw error
    }

    if (!githubResponse.ok) {
        console.warn(`GitHub API returned ${githubResponse.status} for ${owner}/${cleanRepo}`)
    } else {
        console.log(`✅ GitHub repository validated: ${owner}/${cleanRepo}`)
    }
}

async function createDeployment(projectId, userId, options = {}) {
    const mode = options?.mode === 'redeploy' ? 'redeploy' : 'latest'

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

    if (!project.billingAccountId) {
        const owner = await prisma.user.findUnique({
            where: { id: project.userId },
            select: {
                id: true,
                email: true,
                displayName: true
            }
        })

        if (owner) {
            const billingAccount = await ensureBillingAccountForUser(owner)
            await prisma.project.update({
                where: { id: project.id },
                data: { billingAccountId: billingAccount.id }
            })
            project.billingAccountId = billingAccount.id
        }
    }

    // Validate GitHub repository
    await validateGitHubRepository(project.gitURL)

    // Check for active deployment
    const activeDeployment = await prisma.deployement.findFirst({
        where: {
            projectId: projectId,
            status: { in: ['QUEUED', 'IN_PROGRESS'] }
        }
    })

    if (activeDeployment) {
        const error = new Error('A deployment is already in progress for this project')
        error.statusCode = 409
        error.deploymentId = activeDeployment.id
        throw error
    }

    // Create deployment
    const deployment = await prisma.deployement.create({
        data: {
            projectId: projectId,
            status: 'QUEUED'
        }
    })

    console.log(`🚀 New deployment created: ${deployment.id} for project: ${project.name} (mode: ${mode})`)

    // Prepare environment variables for ECS task
    const projectEnvs = JSON.stringify(project.env || {})
    const rootDir = project.rootDir || '.'

    const normalizedBuildCommand = normalizeOptionalCommand(project.buildCommand)
    const normalizedInstallCommand = normalizeOptionalCommand(project.installCommand)

    const customBuildCommand = normalizedBuildCommand && !isLegacyDefaultCommand(normalizedBuildCommand, 'npm run build')
        ? normalizedBuildCommand
        : null

    const customInstallCommand = normalizedInstallCommand && !isLegacyDefaultCommand(normalizedInstallCommand, 'npm install')
        ? normalizedInstallCommand
        : null

    const environment = [
        { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
        { name: 'PROJECT_ID', value: projectId },
        { name: 'BILLING_ACCOUNT_ID', value: project.billingAccountId || '' },
        { name: 'DEPLOYEMENT_ID', value: deployment.id },
        { name: 'PROJECT_ENVS', value: projectEnvs },
        { name: 'ROOT_DIR', value: rootDir }
    ]

    if (customBuildCommand) {
        environment.push({ name: 'BUILD_COMMAND', value: customBuildCommand })
    }

    if (customInstallCommand) {
        environment.push({ name: 'INSTALL_COMMAND', value: customInstallCommand })
    }

    // Spin up ECS container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [config.SUBNET_1, config.SUBNET_2, config.SUBNET_3],
                securityGroups: [config.SG]
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: config.CONTAINER_NAME,
                    environment
                }
            ]
        }
    })

    await ecsClient.send(command)

    // Start deployment simulation
    startDeploymentSimulation(deployment.id)

    return deployment
}

async function startDeploymentSimulation(deploymentId) {
    setTimeout(async () => {
        try {
            await prisma.deployement.update({
                where: { id: deploymentId },
                data: { status: 'IN_PROGRESS' }
            })
            console.log(`Deployment ${deploymentId} updated to IN_PROGRESS`)

            const deploymentTime = Math.random() * 30000 + 15000
            setTimeout(async () => {
                try {
                    const success = Math.random() > 0.25

                    if (success) {
                        console.log(`Deployment ${deploymentId} - Running final validation...`)

                        setTimeout(async () => {
                            try {
                                const validationSuccess = Math.random() > 0.05
                                const finalStatus = validationSuccess ? 'READY' : 'FAIL'
                                const deploymentMeta = await prisma.deployement.findUnique({
                                    where: { id: deploymentId },
                                    select: { createdAt: true }
                                })
                                const completionMetrics = buildCompletionMetrics(deploymentMeta?.createdAt)

                                await prisma.deployement.update({
                                    where: { id: deploymentId },
                                    data: {
                                        status: finalStatus,
                                        finishedAt: completionMetrics.finishedAt,
                                        deploymentTime: completionMetrics.deploymentTime
                                    }
                                })

                                if (finalStatus === 'READY') {
                                    const deploymentProject = await prisma.project.findUnique({
                                        where: { id: (await prisma.deployement.findUnique({ where: { id: deploymentId } })).projectId }
                                    })

                                    const deploymentUrl = buildDeploymentUrl(deploymentProject.subDomain)
                                    console.log(`✅ Deployment ${deploymentId} completed successfully and is now LIVE`)
                                    console.log(`🌐 Deployment URL: ${deploymentUrl}`)
                                } else {
                                    console.log(`❌ Deployment ${deploymentId} failed during final validation`)
                                }
                            } catch (error) {
                                console.error('Error during final validation:', error)
                                await prisma.deployement.update({
                                    where: { id: deploymentId },
                                    data: { status: 'FAIL' }
                                }).catch(err => console.error('Critical: Could not update deployment to FAIL status:', err))
                            }
                        }, Math.random() * 5000 + 5000)
                    } else {
                        await prisma.deployement.update({
                            where: { id: deploymentId },
                            data: {
                                status: 'FAIL',
                                ...buildCompletionMetrics((await prisma.deployement.findUnique({
                                    where: { id: deploymentId },
                                    select: { createdAt: true }
                                }))?.createdAt)
                            }
                        })
                        console.log(`❌ Deployment ${deploymentId} failed during build phase`)
                    }
                } catch (error) {
                    console.error('Error during deployment completion:', error)
                    await prisma.deployement.update({
                        where: { id: deploymentId },
                        data: {
                            status: 'FAIL',
                            ...buildCompletionMetrics((await prisma.deployement.findUnique({
                                where: { id: deploymentId },
                                select: { createdAt: true }
                            }))?.createdAt)
                        }
                    }).catch(err => console.error('Critical: Could not update deployment to FAIL status:', err))
                }
            }, deploymentTime)
        } catch (error) {
            console.error('Error updating deployment to IN_PROGRESS:', error)
            await prisma.deployement.update({
                where: { id: deploymentId },
                data: {
                    status: 'FAIL',
                    ...buildCompletionMetrics((await prisma.deployement.findUnique({
                        where: { id: deploymentId },
                        select: { createdAt: true }
                    }))?.createdAt)
                }
            }).catch(err => console.error('Critical: Could not update deployment to FAIL status:', err))
        }
    }, 2000)
}

async function getDeploymentStatus(deploymentId, userId) {
    const deployment = await prisma.deployement.findUnique({
        where: { id: deploymentId },
        include: {
            project: true
        }
    })

    if (!deployment) {
        const error = new Error('Deployment not found')
        error.statusCode = 404
        throw error
    }

    if (deployment.project.userId !== userId) {
        const error = new Error('Access denied')
        error.statusCode = 403
        throw error
    }

    return deployment
}

async function getDeploymentUrl(deploymentId, userId) {
    const deployment = await prisma.deployement.findUnique({
        where: { id: deploymentId },
        include: {
            project: true
        }
    })

    if (!deployment) {
        const error = new Error('Deployment not found')
        error.statusCode = 404
        throw error
    }

    if (deployment.project.userId !== userId) {
        const error = new Error('Access denied')
        error.statusCode = 403
        throw error
    }

    if (deployment.status !== 'READY') {
        const error = new Error('Deployment is not ready yet')
        error.statusCode = 400
        error.currentStatus = deployment.status
        throw error
    }

    const deploymentUrl = buildDeploymentUrl(deployment.project.subDomain)

    return {
        deploymentId: deployment.id,
        status: deployment.status,
        url: deploymentUrl,
        projectName: deployment.project.name,
        subDomain: deployment.project.subDomain
    }
}

async function getUserDeployments(userId) {
    return await prisma.deployement.findMany({
        include: {
            project: true
        },
        where: {
            project: {
                userId: userId
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    })
}

async function updateDeploymentStatus(deploymentId, status) {
    const validStatuses = ['NOT_STARTED', 'QUEUED', 'IN_PROGRESS', 'READY', 'FAIL']

    if (!validStatuses.includes(status)) {
        const error = new Error('Invalid status')
        error.statusCode = 400
        throw error
    }

    const existingDeployment = await prisma.deployement.findUnique({
        where: { id: deploymentId },
        select: { createdAt: true }
    })

    const shouldSetCompletionMetrics = status === 'READY' || status === 'FAIL'

    const deployment = await prisma.deployement.update({
        where: { id: deploymentId },
        data: shouldSetCompletionMetrics
            ? {
                status,
                ...buildCompletionMetrics(existingDeployment?.createdAt)
            }
            : { status },
        include: {
            project: true
        }
    })

    return deployment
}

async function simulateDeploymentProcess(deploymentId) {
    const deployment = await prisma.deployement.findUnique({
        where: { id: deploymentId },
        include: { project: true }
    })

    if (!deployment) {
        const error = new Error('Deployment not found')
        error.statusCode = 404
        throw error
    }

    setTimeout(async () => {
        try {
            await prisma.deployement.update({
                where: { id: deploymentId },
                data: { status: 'IN_PROGRESS' }
            })
            console.log(`Deployment ${deploymentId} updated to IN_PROGRESS`)

            setTimeout(async () => {
                try {
                    const success = Math.random() > 0.2
                    const finalStatus = success ? 'READY' : 'FAIL'
                    const completionMetrics = buildCompletionMetrics(deployment.createdAt)

                    await prisma.deployement.update({
                        where: { id: deploymentId },
                        data: {
                            status: finalStatus,
                            finishedAt: completionMetrics.finishedAt,
                            deploymentTime: completionMetrics.deploymentTime
                        }
                    })
                    console.log(`Deployment ${deploymentId} completed with status: ${finalStatus}`)
                } catch (error) {
                    console.error('Error completing deployment:', error)
                }
            }, 10000)
        } catch (error) {
            console.error('Error updating deployment to IN_PROGRESS:', error)
        }
    }, 2000)
}

async function deleteDeployment(deploymentId, userId) {
    // Find the deployment with project details
    const deployment = await prisma.deployement.findUnique({
        where: { id: deploymentId },
        include: { project: true }
    })

    if (!deployment) {
        const error = new Error('Deployment not found')
        error.statusCode = 404
        throw error
    }

    // Check user authorization
    if (deployment.project.userId !== userId) {
        const error = new Error('Access denied')
        error.statusCode = 403
        throw error
    }

    const latestDeployment = await prisma.deployement.findFirst({
        where: { projectId: deployment.projectId },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
    })

    const isDeletingLatest = latestDeployment?.id === deploymentId

    // Only latest deployment controls active website assets; clear those from S3.
    const s3DeleteSuccess = isDeletingLatest
        ? await deleteDeploymentFromS3(deploymentId, deployment.project.subDomain, deployment.projectId)
        : true

    if (isDeletingLatest && !s3DeleteSuccess) {
        console.warn(`⚠️ S3 deletion failed for deployment ${deploymentId}, but continuing with database deletion`)
    }

    // Delete deployment record from database
    await prisma.deployement.delete({
        where: { id: deploymentId }
    })

    if (isDeletingLatest) {
        // Keep project inactive after deleting latest deployment.
        await prisma.deployement.updateMany({
            where: {
                projectId: deployment.projectId,
                status: 'READY'
            },
            data: {
                status: 'NOT_STARTED'
            }
        })
    }

    console.log(`✅ Deployment ${deploymentId} deleted successfully from database and S3`)
    return { success: true, s3Cleaned: s3DeleteSuccess, projectInactive: isDeletingLatest }
}

module.exports = {
    createDeployment,
    getDeploymentStatus,
    getDeploymentUrl,
    getUserDeployments,
    updateDeploymentStatus,
    simulateDeploymentProcess,
    deleteDeployment
}
