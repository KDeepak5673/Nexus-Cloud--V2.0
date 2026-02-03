const prisma = require('../config/database')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')

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

async function createDeployment(projectId, userId) {
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

    console.log(`🚀 New deployment created: ${deployment.id} for project: ${project.name}`)

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
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
                        { name: 'PROJECT_ID', value: projectId },
                        { name: 'DEPLOYEMENT_ID', value: deployment.id }
                    ]
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

                                await prisma.deployement.update({
                                    where: { id: deploymentId },
                                    data: { status: finalStatus }
                                })

                                if (finalStatus === 'READY') {
                                    const deploymentProject = await prisma.project.findUnique({
                                        where: { id: (await prisma.deployement.findUnique({ where: { id: deploymentId } })).projectId }
                                    })

                                    const deploymentUrl = `https://${deploymentProject.subDomain}.nexuscloud.app`
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
                            data: { status: 'FAIL' }
                        })
                        console.log(`❌ Deployment ${deploymentId} failed during build phase`)
                    }
                } catch (error) {
                    console.error('Error during deployment completion:', error)
                    await prisma.deployement.update({
                        where: { id: deploymentId },
                        data: { status: 'FAIL' }
                    }).catch(err => console.error('Critical: Could not update deployment to FAIL status:', err))
                }
            }, deploymentTime)
        } catch (error) {
            console.error('Error updating deployment to IN_PROGRESS:', error)
            await prisma.deployement.update({
                where: { id: deploymentId },
                data: { status: 'FAIL' }
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

    const deploymentUrl = `https://${deployment.project.subDomain}.nexuscloud.app`

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

    const deployment = await prisma.deployement.update({
        where: { id: deploymentId },
        data: { status },
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

                    await prisma.deployement.update({
                        where: { id: deploymentId },
                        data: { status: finalStatus }
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

module.exports = {
    createDeployment,
    getDeploymentStatus,
    getDeploymentUrl,
    getUserDeployments,
    updateDeploymentStatus,
    simulateDeploymentProcess
}
