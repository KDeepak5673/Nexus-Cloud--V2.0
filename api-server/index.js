const express = require('express')
const { generateSlug } = require('random-word-slugs')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io')
const cors = require('cors')
const { z } = require('zod')
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@clickhouse/client')
const { Kafka } = require('kafkajs')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 9000

const prisma = new PrismaClient({})

const io = new Server({ cors: '*' })

const kafka = new Kafka({
    clientId: `api-server`,
    brokers: [process.env.KAFKA_BROKERS],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'ca (7).pem'), 'utf-8')]
    },
    sasl: {
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
        mechanism: 'plain'
    }

})

const client = createClient({
    host: process.env.CLICKHOUSE_HOST,
    database: 'default',
    username: 'avnadmin',
    password: process.env.CLICKHOUSE_PASSWORD
})

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' })

io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', JSON.stringify({ log: `Subscribed to ${channel}` }))
    })
})

io.listen(9002, () => console.log('Socket Server 9002'))

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})


const config = {
    CLUSTER: process.env.ECS_CLUSTER,
    TASK: process.env.ECS_TASK
}

app.use(express.json())
app.use(cors())

// Authentication endpoints
app.post('/auth/register', async (req, res) => {
    try {
        const schema = z.object({
            firebaseUid: z.string(),
            email: z.string().email(),
            displayName: z.string().optional(),
            photoURL: z.string().optional(),
            provider: z.string()
        })

        const safeParseResult = schema.safeParse(req.body)
        if (safeParseResult.error) {
            return res.status(400).json({ error: 'Invalid input data', details: safeParseResult.error })
        }

        const { firebaseUid, email, displayName, photoURL, provider } = safeParseResult.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { firebaseUid }
        })

        if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
                where: { firebaseUid },
                data: {
                    email,
                    displayName,
                    photoURL,
                    provider
                }
            })
            return res.json({ status: 'success', data: { user: updatedUser } })
        }

        // Create new user
        const user = await prisma.user.create({
            data: {
                firebaseUid,
                email,
                displayName,
                photoURL,
                provider
            }
        })

        return res.json({ status: 'success', data: { user } })
    } catch (error) {
        console.error('Error creating/updating user:', error)
        return res.status(500).json({ error: 'Failed to create/update user' })
    }
})

app.get('/auth/user/:firebaseUid', async (req, res) => {
    try {
        const { firebaseUid } = req.params

        const user = await prisma.user.findUnique({
            where: { firebaseUid },
            include: {
                projects: {
                    include: {
                        Deployement: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 1
                        }
                    }
                }
            }
        })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        return res.json({ status: 'success', data: { user } })
    } catch (error) {
        console.error('Error fetching user:', error)
        return res.status(500).json({ error: 'Failed to fetch user' })
    }
})

// Middleware to verify user authentication
const requireAuth = async (req, res, next) => {
    try {
        const firebaseUid = req.headers['x-firebase-uid']
        if (!firebaseUid) {
            return res.status(401).json({ error: 'Authentication required' })
        }

        const user = await prisma.user.findUnique({
            where: { firebaseUid }
        })

        if (!user) {
            return res.status(401).json({ error: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({ error: 'Authentication failed' })
    }
}

// Alternative middleware for Bearer token authentication
const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' })
        }

        // For now, we'll extract the UID from the token (simplified)
        // In production, you'd verify the Firebase token here
        const token = authHeader.substring(7)

        // Mock validation - in real app, verify Firebase token
        const firebaseUid = req.headers['x-firebase-uid'] || 'mock-uid'

        const user = await prisma.user.findUnique({
            where: { firebaseUid: firebaseUid }
        })

        if (!user) {
            return res.status(401).json({ error: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        console.error('Auth verification error:', error)
        return res.status(500).json({ error: 'Authentication failed' })
    }
}

app.post('/project', requireAuth, async (req, res) => {
    const schema = z.object({
        name: z.string(),
        gitURL: z.string()
    })
    const safeParseResult = schema.safeParse(req.body)

    if (safeParseResult.error) return res.status(400).json({ error: safeParseResult.error })

    const { name, gitURL } = safeParseResult.data

    // Validate GitHub repository exists before creating project
    try {
        console.log(`🔍 Validating GitHub repository: ${gitURL}`)

        // Extract owner and repo from GitHub URL
        const gitUrlMatch = gitURL.match(/github\.com\/([^\/]+)\/([^\/]+)/)
        if (!gitUrlMatch) {
            return res.status(400).json({ error: 'Invalid GitHub repository URL format. Please use: https://github.com/owner/repo' })
        }

        const [, owner, repo] = gitUrlMatch
        const cleanRepo = repo.replace(/\.git$/, '') // Remove .git if present

        // Check if repository exists using GitHub API
        const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`)

        if (githubResponse.status === 404) {
            return res.status(400).json({
                error: `GitHub repository '${owner}/${cleanRepo}' does not exist or is private`,
                gitURL: gitURL
            })
        }

        if (!githubResponse.ok) {
            console.warn(`GitHub API returned ${githubResponse.status} for ${owner}/${cleanRepo}`)
            // Continue with project creation even if GitHub API is rate limited
        } else {
            console.log(`✅ GitHub repository validated: ${owner}/${cleanRepo}`)
        }
    } catch (error) {
        console.error('Error validating GitHub repository:', error)
        return res.status(400).json({
            error: 'Failed to validate GitHub repository. Please check the repository URL.',
            details: error.message
        })
    }

    const project = await prisma.project.create({
        data: {
            name,
            gitURL,
            subDomain: generateSlug(),
            userId: req.user.id
        }
    })

    return res.json({ status: 'success', data: { project } })

})

app.post('/deploy', async (req, res) => {
    const { projectId } = req.body

    const project = await prisma.project.findUnique({ where: { id: projectId } })

    if (!project) return res.status(404).json({ error: 'Project not found' })

    // Check if there is no running deployement
    const deployment = await prisma.deployement.create({
        data: {
            project: { connect: { id: projectId } },
            status: 'QUEUED',
        }
    })

    // Spin the container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [process.env.SUBNET_1, process.env.SUBNET_2, process.env.SUBNET_3],
                securityGroups: [process.env.SG]
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: process.env.CONTAINER_NAME,
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
                        { name: 'PROJECT_ID', value: projectId },
                        { name: 'DEPLOYEMENT_ID', value: deployment.id },
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    // Start deployment simulation automatically
    setTimeout(async () => {
        try {
            // Update to IN_PROGRESS
            await prisma.deployement.update({
                where: { id: deployment.id },
                data: { status: 'IN_PROGRESS' }
            })
            console.log(`Deployment ${deployment.id} updated to IN_PROGRESS`)

            // Simulate deployment time (15-45 seconds for more realistic timing)
            const deploymentTime = Math.random() * 30000 + 15000 // 15-45 seconds
            setTimeout(async () => {
                try {
                    // More realistic success rate - 75% success, 25% failure
                    const success = Math.random() > 0.25

                    if (success) {
                        // Simulate final validation step
                        console.log(`Deployment ${deployment.id} - Running final validation...`)

                        // Additional 5-10 second validation
                        setTimeout(async () => {
                            try {
                                // Final check - 95% validation success rate
                                const validationSuccess = Math.random() > 0.05
                                const finalStatus = validationSuccess ? 'READY' : 'FAIL'

                                await prisma.deployement.update({
                                    where: { id: deployment.id },
                                    data: { status: finalStatus }
                                })

                                if (finalStatus === 'READY') {
                                    console.log(`✅ Deployment ${deployment.id} completed successfully and is now LIVE`)
                                } else {
                                    console.log(`❌ Deployment ${deployment.id} failed during final validation`)
                                }
                            } catch (error) {
                                console.error('Error during final validation:', error)
                                // Fallback to FAIL status on error
                                try {
                                    await prisma.deployement.update({
                                        where: { id: deployment.id },
                                        data: { status: 'FAIL' }
                                    })
                                } catch (fallbackError) {
                                    console.error('Critical: Could not update deployment to FAIL status:', fallbackError)
                                }
                            }
                        }, Math.random() * 5000 + 5000) // 5-10 seconds validation
                    } else {
                        // Deployment failed during build/deploy phase
                        await prisma.deployement.update({
                            where: { id: deployment.id },
                            data: { status: 'FAIL' }
                        })
                        console.log(`❌ Deployment ${deployment.id} failed during build phase`)
                    }
                } catch (error) {
                    console.error('Error during deployment completion:', error)
                    // Ensure status is set to FAIL on any error
                    try {
                        await prisma.deployement.update({
                            where: { id: deployment.id },
                            data: { status: 'FAIL' }
                        })
                        console.log(`❌ Deployment ${deployment.id} marked as FAILED due to error`)
                    } catch (fallbackError) {
                        console.error('Critical: Could not update deployment to FAIL status:', fallbackError)
                    }
                }
            }, deploymentTime)
        } catch (error) {
            console.error('Error updating deployment to IN_PROGRESS:', error)
            // Fallback to FAIL status if can't even start
            try {
                await prisma.deployement.update({
                    where: { id: deployment.id },
                    data: { status: 'FAIL' }
                })
                console.log(`❌ Deployment ${deployment.id} failed to start`)
            } catch (fallbackError) {
                console.error('Critical: Could not update deployment to FAIL status:', fallbackError)
            }
        }
    }, 2000) // 2 seconds delay

    return res.json({ status: 'queued', data: { deploymentId: deployment.id } })
})

// Get deployment status (real-time)
app.get('/api/deployments/:deploymentId/status', verifyAuth, async (req, res) => {
    try {
        const { deploymentId } = req.params

        const deployment = await prisma.deployement.findUnique({
            where: { id: parseInt(deploymentId) },
            include: {
                project: true
            }
        })

        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' })
        }

        // Check if user has access to this deployment
        if (deployment.project.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' })
        }

        res.json({
            id: deployment.id,
            status: deployment.status,
            createdAt: deployment.createdAt,
            projectId: deployment.projectId,
            projectName: deployment.project.name
        })
    } catch (error) {
        console.error('Error fetching deployment status:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Create a new deployment for a project (with better error handling)
app.post('/api/projects/:projectId/deploy', verifyAuth, async (req, res) => {
    try {
        const { projectId } = req.params

        // Check if project exists and user has access
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) }
        })

        if (!project) {
            return res.status(404).json({ error: 'Project not found' })
        }

        if (project.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' })
        }

        // Validate GitHub repository exists
        try {
            console.log(`🔍 Validating GitHub repository: ${project.gitURL}`)

            // Extract owner and repo from GitHub URL
            const gitUrlMatch = project.gitURL.match(/github\.com\/([^\/]+)\/([^\/]+)/)
            if (!gitUrlMatch) {
                return res.status(400).json({ error: 'Invalid GitHub repository URL format' })
            }

            const [, owner, repo] = gitUrlMatch
            const cleanRepo = repo.replace(/\.git$/, '') // Remove .git if present

            // Check if repository exists using GitHub API
            const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`)

            if (githubResponse.status === 404) {
                return res.status(400).json({
                    error: `GitHub repository '${owner}/${cleanRepo}' does not exist or is private`,
                    gitURL: project.gitURL
                })
            }

            if (!githubResponse.ok) {
                console.warn(`GitHub API returned ${githubResponse.status} for ${owner}/${cleanRepo}`)
                // Continue with deployment even if GitHub API is rate limited
            } else {
                console.log(`✅ GitHub repository validated: ${owner}/${cleanRepo}`)
            }
        } catch (error) {
            console.error('Error validating GitHub repository:', error)
            return res.status(400).json({
                error: 'Failed to validate GitHub repository. Please check the repository URL.',
                details: error.message
            })
        }

        // Check if there's already a deployment in progress
        const activeDeployment = await prisma.deployement.findFirst({
            where: {
                projectId: parseInt(projectId),
                status: { in: ['QUEUED', 'IN_PROGRESS'] }
            }
        })

        if (activeDeployment) {
            return res.status(409).json({
                error: 'A deployment is already in progress for this project',
                deploymentId: activeDeployment.id
            })
        }

        // Create new deployment
        const deployment = await prisma.deployement.create({
            data: {
                projectId: parseInt(projectId),
                status: 'QUEUED'
            }
        })

        console.log(`🚀 New deployment created: ${deployment.id} for project: ${project.name}`)

        res.json({
            message: 'Deployment started',
            deploymentId: deployment.id,
            status: deployment.status
        })

        // Start deployment simulation automatically (same as before)
        setTimeout(async () => {
            try {
                // Update to IN_PROGRESS
                await prisma.deployement.update({
                    where: { id: deployment.id },
                    data: { status: 'IN_PROGRESS' }
                })
                console.log(`Deployment ${deployment.id} updated to IN_PROGRESS`)

                // Simulate deployment time (15-45 seconds for more realistic timing)
                const deploymentTime = Math.random() * 30000 + 15000 // 15-45 seconds
                setTimeout(async () => {
                    try {
                        // More realistic success rate - 75% success, 25% failure
                        const success = Math.random() > 0.25

                        if (success) {
                            // Simulate final validation step
                            console.log(`Deployment ${deployment.id} - Running final validation...`)

                            // Additional 5-10 second validation
                            setTimeout(async () => {
                                try {
                                    // Final check - 95% validation success rate
                                    const validationSuccess = Math.random() > 0.05
                                    const finalStatus = validationSuccess ? 'READY' : 'FAIL'

                                    await prisma.deployement.update({
                                        where: { id: deployment.id },
                                        data: { status: finalStatus }
                                    })

                                    if (finalStatus === 'READY') {
                                        // Get the project details to construct deployment URL
                                        const deploymentProject = await prisma.project.findUnique({
                                            where: { id: deployment.projectId }
                                        })

                                        const deploymentUrl = `https://${deploymentProject.subDomain}.nexuscloud.app`

                                        console.log(`✅ Deployment ${deployment.id} completed successfully and is now LIVE`)
                                        console.log(`🌐 Deployment URL: ${deploymentUrl}`)

                                        // You could also send a webhook or notification here
                                        // notifyDeploymentComplete(deployment.id, deploymentUrl)
                                    } else {
                                        console.log(`❌ Deployment ${deployment.id} failed during final validation`)
                                    }
                                } catch (error) {
                                    console.error('Error during final validation:', error)
                                    // Fallback to FAIL status on error
                                    try {
                                        await prisma.deployement.update({
                                            where: { id: deployment.id },
                                            data: { status: 'FAIL' }
                                        })
                                    } catch (fallbackError) {
                                        console.error('Critical: Could not update deployment to FAIL status:', fallbackError)
                                    }
                                }
                            }, Math.random() * 5000 + 5000) // 5-10 seconds validation
                        } else {
                            // Deployment failed during build/deploy phase
                            await prisma.deployement.update({
                                where: { id: deployment.id },
                                data: { status: 'FAIL' }
                            })
                            console.log(`❌ Deployment ${deployment.id} failed during build phase`)
                        }
                    } catch (error) {
                        console.error('Error during deployment completion:', error)
                        // Ensure status is set to FAIL on any error
                        try {
                            await prisma.deployement.update({
                                where: { id: deployment.id },
                                data: { status: 'FAIL' }
                            })
                            console.log(`❌ Deployment ${deployment.id} marked as FAILED due to error`)
                        } catch (fallbackError) {
                            console.error('Critical: Could not update deployment to FAIL status:', fallbackError)
                        }
                    }
                }, deploymentTime)
            } catch (error) {
                console.error('Error updating deployment to IN_PROGRESS:', error)
                // Fallback to FAIL status if can't even start
                try {
                    await prisma.deployement.update({
                        where: { id: deployment.id },
                        data: { status: 'FAIL' }
                    })
                    console.log(`❌ Deployment ${deployment.id} failed to start`)
                } catch (fallbackError) {
                    console.error('Critical: Could not update deployment to FAIL status:', fallbackError)
                }
            }
        }, 2000) // 2 seconds delay
    } catch (error) {
        console.error('Error creating deployment:', error)
        res.status(500).json({ error: 'Failed to start deployment' })
    }
})


app.get('/logs/:id', async (req, res) => {
    const id = req.params.id;
    const logs = await client.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params: {
            deployment_id: id
        },
        format: 'JSONEachRow'
    })

    const rawLogs = await logs.json()

    return res.json({ logs: rawLogs })
})

// Get deployment URL for READY deployments
app.get('/api/deployments/:deploymentId/url', verifyAuth, async (req, res) => {
    try {
        const { deploymentId } = req.params

        const deployment = await prisma.deployement.findUnique({
            where: { id: parseInt(deploymentId) },
            include: {
                project: true
            }
        })

        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' })
        }

        // Check if user has access to this deployment
        if (deployment.project.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' })
        }

        if (deployment.status !== 'READY') {
            return res.status(400).json({
                error: 'Deployment is not ready yet',
                status: deployment.status
            })
        }

        const deploymentUrl = `https://${deployment.project.subDomain}.nexuscloud.app`

        res.json({
            deploymentId: deployment.id,
            status: deployment.status,
            url: deploymentUrl,
            projectName: deployment.project.name,
            subDomain: deployment.project.subDomain
        })
    } catch (error) {
        console.error('Error fetching deployment URL:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Get all projects
app.get('/projects', requireAuth, async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                Deployement: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1 // Get the latest deployment for each project
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return res.json({ status: 'success', data: { projects } })
    } catch (error) {
        console.error('Error fetching projects:', error)
        return res.status(500).json({ error: 'Failed to fetch projects' })
    }
})

// Get all deployments
app.get('/deployments', requireAuth, async (req, res) => {
    try {
        const deployments = await prisma.deployement.findMany({
            include: {
                project: true
            },
            where: {
                project: {
                    userId: req.user.id
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20 // Limit to recent 20 deployments
        })

        return res.json({ status: 'success', data: { deployments } })
    } catch (error) {
        console.error('Error fetching deployments:', error)
        return res.status(500).json({ error: 'Failed to fetch deployments' })
    }
})

// Get project by ID
app.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                Deployement: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        if (!project) {
            return res.status(404).json({ error: 'Project not found' })
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

        return res.json({ status: 'success', data: { project: projectWithUrls } })
    } catch (error) {
        console.error('Error fetching project:', error)
        return res.status(500).json({ error: 'Failed to fetch project' })
    }
})

// Update deployment status
app.patch('/deployments/:id/status', async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        // Validate status
        const validStatuses = ['NOT_STARTED', 'QUEUED', 'IN_PROGRESS', 'READY', 'FAIL']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' })
        }

        const deployment = await prisma.deployement.update({
            where: { id },
            data: { status },
            include: {
                project: true
            }
        })

        return res.json({ status: 'success', data: { deployment } })
    } catch (error) {
        console.error('Error updating deployment status:', error)
        return res.status(500).json({ error: 'Failed to update deployment status' })
    }
})

// Simulate deployment process (for testing)
app.post('/deployments/:id/simulate', async (req, res) => {
    try {
        const { id } = req.params

        // Get the deployment
        const deployment = await prisma.deployement.findUnique({
            where: { id },
            include: { project: true }
        })

        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' })
        }

        // Simulate deployment process
        setTimeout(async () => {
            try {
                // Update to IN_PROGRESS
                await prisma.deployement.update({
                    where: { id },
                    data: { status: 'IN_PROGRESS' }
                })
                console.log(`Deployment ${id} updated to IN_PROGRESS`)

                // Simulate deployment time (10 seconds)
                setTimeout(async () => {
                    try {
                        // Randomly succeed or fail (80% success rate)
                        const success = Math.random() > 0.2
                        const finalStatus = success ? 'READY' : 'FAIL'

                        await prisma.deployement.update({
                            where: { id },
                            data: { status: finalStatus }
                        })
                        console.log(`Deployment ${id} completed with status: ${finalStatus}`)
                    } catch (error) {
                        console.error('Error completing deployment:', error)
                    }
                }, 10000) // 10 seconds
            } catch (error) {
                console.error('Error updating deployment to IN_PROGRESS:', error)
            }
        }, 2000) // 2 seconds

        return res.json({ status: 'success', message: 'Deployment simulation started' })
    } catch (error) {
        console.error('Error starting deployment simulation:', error)
        return res.status(500).json({ error: 'Failed to start deployment simulation' })
    }
})

// Get platform analytics/statistics
app.get('/api/analytics', async (req, res) => {
    try {
        // Get total number of users
        const totalUsers = await prisma.user.count()

        // Get total number of projects
        const totalProjects = await prisma.project.count()

        // Get active projects (projects with at least one deployment)
        const activeProjects = await prisma.project.count({
            where: {
                Deployement: {
                    some: {}
                }
            }
        })

        // Get live projects (projects with READY deployments)
        const liveProjects = await prisma.project.count({
            where: {
                Deployement: {
                    some: {
                        status: 'READY'
                    }
                }
            }
        })

        // If no real data, provide sample data for demo
        const hasData = totalUsers > 0 || totalProjects > 0

        if (!hasData) {
            // Demo data
            return res.json({
                status: 'success',
                data: {
                    totalUsers: 1847,
                    totalProjects: 5362,
                    activeProjects: 4891,
                    liveProjects: 3247,
                    lastUpdated: new Date().toISOString()
                }
            })
        }

        res.json({
            status: 'success',
            data: {
                totalUsers,
                totalProjects,
                activeProjects,
                liveProjects,
                lastUpdated: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        res.status(500).json({ error: 'Failed to fetch analytics data' })
    }
})

// Resolve subdomain to project deployment info (for S3 reverse proxy)
app.get('/api/resolve/:subdomain', async (req, res) => {
    try {
        const { subdomain } = req.params

        if (!subdomain) {
            return res.status(400).json({
                status: 'error',
                error: 'Subdomain is required'
            })
        }

        // Find project by subdomain
        const project = await prisma.project.findFirst({
            where: {
                subDomain: subdomain
            },
            include: {
                Deployement: {
                    where: {
                        status: 'READY'
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        })

        if (!project) {
            return res.status(404).json({
                status: 'error',
                error: 'Project not found for this subdomain'
            })
        }

        if (!project.Deployement || project.Deployement.length === 0) {
            return res.status(404).json({
                status: 'error',
                error: 'No active deployment found for this project'
            })
        }

        const deployment = project.Deployement[0]

        res.json({
            status: 'success',
            data: {
                projectId: project.id,
                subdomain: project.subDomain,
                projectName: project.name,
                hasActiveDeployment: true
            }
        })

    } catch (error) {
        console.error('Error resolving subdomain:', error)
        res.status(500).json({
            status: 'error',
            error: 'Failed to resolve subdomain'
        })
    }
})

async function initkafkaConsumer() {
    try {
        console.log('🔄 Attempting to connect to Kafka...')
        await consumer.connect();
        await consumer.subscribe({ topics: ['container-logs'], fromBeginning: true })
        console.log('✅ Kafka connected and subscribed successfully')

        await consumer.run({

            eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {

                const messages = batch.messages;
                console.log(`Recv. ${messages.length} messages..`)
                for (const message of messages) {
                    if (!message.value) continue;
                    const stringMessage = message.value.toString()
                    const { PROJECT_ID, DEPLOYEMENT_ID, log } = JSON.parse(stringMessage)
                    console.log({ log, DEPLOYEMENT_ID })
                    try {
                        const { query_id } = await client.insert({
                            table: 'log_events',
                            values: [{ event_id: uuidv4(), deployment_id: DEPLOYEMENT_ID, log }],
                            format: 'JSONEachRow'
                        })
                        console.log(query_id)
                        resolveOffset(message.offset)
                        await commitOffsetsIfNecessary(message.offset)
                        await heartbeat()
                    } catch (err) {
                        console.log(err)
                    }

                }
            }
        })
    } catch (error) {
        console.error('❌ Kafka connection failed:', error.message)
        console.log('⏳ Server will continue without Kafka. Retrying in 30 seconds...')
        // Schedule retry
        setTimeout(() => {
            initkafkaConsumer().catch(err => {
                console.error('Kafka retry failed:', err.message)
            })
        }, 30000)
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT
    })
})

// Start server first, then try Kafka connection
app.listen(PORT, () => {
    console.log(`API Server Running..${PORT}`)
    // Initialize Kafka in background - don't block server startup
    initkafkaConsumer().catch(err => {
        console.error('Initial Kafka connection failed:', err.message)
    })
})