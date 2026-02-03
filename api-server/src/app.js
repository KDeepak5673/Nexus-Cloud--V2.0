const express = require('express')
const cors = require('cors')
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware')

// Import routes
const authRoutes = require('./routes/auth.routes')
const projectRoutes = require('./routes/project.routes')

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
    app.use('/auth', authRoutes)      // /auth/register, /auth/user/:id
    app.use('/projects', projectRoutes) // Changed from /project to /projects
    app.use('/project', projectRoutes)  // Keep backward compatibility
    app.use(notFoundHandler)
    app.use(errorHandler)

    return app
}

module.exports = { createApp }