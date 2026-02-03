/**
 * MAIN ENTRY POINT
 * 
 * This file starts the server and initializes all services
 */

const { createServer } = require('http')
const { createApp } = require('./src/app')
const { initializeSocketIO } = require('./src/config/socketio')

require('dotenv').config()

const PORT = process.env.PORT || 9000

// Create Express app
const app = createApp()

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = initializeSocketIO(httpServer)

// Make io available globally for services
global.io = io

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 API Server Running on port ${PORT}`)
    console.log(`🔌 Socket.IO Server Running on port ${PORT}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)

    // Initialize Kafka consumer (if needed)
    const kafkaService = require('./src/services/kafka.service')
    kafkaService.initKafkaConsumer().catch(console.error)
})

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server gracefully')

    // Disconnect Kafka
    const kafkaService = require('./src/services/kafka.service')
    await kafkaService.disconnectKafka()

    httpServer.close(() => {
        console.log('Server closed')
        process.exit(0)
    })
})