const express = require('express')
const cors = require('cors')
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware')

// Import routes
const authRoutes = require('./routes/auth.routes')
const projectRoutes = require('./routes/project.routes')
const deploymentRoutes = require('./routes/deployment.routes')
const analyticsRoutes = require('./routes/analytics.routes')
const logsRoutes = require('./routes/logs.routes')

function createApp() {
    const app = express()

    app.use(express.json())

    app.use(cors())
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        })
    })

    // Mount route modules
    app.use('/auth', authRoutes)
    app.use('/projects', projectRoutes)
    app.use('/project', projectRoutes)
    app.use('/api', deploymentRoutes)
    app.use('/api', analyticsRoutes)
    app.use('/', logsRoutes)

    app.use(notFoundHandler)
    app.use(errorHandler)

    return app
}

module.exports = { createApp }