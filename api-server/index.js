/**
 * MAIN ENTRY POINT
 * 
 * This file starts the server and initializes all services
 */

const { createServer } = require('http')
const { createApp } = require('./src/app')
const { initializeSocketIO } = require('./src/config/socketio')
const cron = require('node-cron')
const { runWorker, stopWorker } = require('./src/workers/billing-usage-worker')
const { runMonthEndJob } = require('./src/workers/billing-month-end-job')

require('dotenv').config()

const PORT = process.env.PORT || 9000
const ENABLE_BILLING_WORKER = process.env.ENABLE_BILLING_WORKER !== 'false'
const ENABLE_BILLING_MONTH_END_CRON = process.env.ENABLE_BILLING_MONTH_END_CRON === 'true'
const BILLING_MONTH_END_CRON = process.env.BILLING_MONTH_END_CRON || '0 0 1 * *'
let billingCronTask = null

// Create Express app
const app = createApp()

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = initializeSocketIO(httpServer)

// Make io available globally for services
global.io = io

// Start server
httpServer.listen(PORT, async () => {
    console.log(`🚀 API Server Running on port ${PORT}`)
    console.log(`🔌 Socket.IO Server Running on port ${PORT}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)

    // Initialize Kafka consumer (if needed)
    const kafkaService = require('./src/services/kafka.service')
    kafkaService.initKafkaConsumer().catch(console.error)

    if (ENABLE_BILLING_WORKER) {
        runWorker()
            .then(() => console.log('🧾 Billing worker started'))
            .catch((error) => console.error('Billing worker failed to start:', error.message))
    } else {
        console.log('🧾 Billing worker disabled via ENABLE_BILLING_WORKER=false')
    }

    if (ENABLE_BILLING_MONTH_END_CRON) {
        billingCronTask = cron.schedule(BILLING_MONTH_END_CRON, async () => {
            try {
                console.log('📅 Running month-end billing job...')
                await runMonthEndJob()
                console.log('✅ Month-end billing job completed')
            } catch (error) {
                console.error('❌ Month-end billing job failed:', error.message)
            }
        })

        console.log(`📅 Month-end billing cron enabled with schedule: ${BILLING_MONTH_END_CRON}`)
    } else {
        console.log('📅 Month-end billing cron disabled (set ENABLE_BILLING_MONTH_END_CRON=true to enable)')
    }
})

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server gracefully')

    if (billingCronTask) {
        billingCronTask.stop()
    }

    await stopWorker()

    // Disconnect Kafka
    const kafkaService = require('./src/services/kafka.service')
    await kafkaService.disconnectKafka()

    httpServer.close(() => {
        console.log('Server closed')
        process.exit(0)
    })
})