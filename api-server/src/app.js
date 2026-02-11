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

    // CORS Configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000'
        ]

    const corsOptions = {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, Postman, curl)
            if (!origin) return callback(null, true)

            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 86400 // 24 hours
    }

    app.use(cors(corsOptions))
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