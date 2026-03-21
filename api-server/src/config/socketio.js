const { Server } = require('socket.io')
const prisma = require('./database')
const { getBillingSummaryForUser } = require('../services/billing.service')


function initializeSocketIO(httpServer) {
    // Create Socket.IO server attached to HTTP server
    const io = new Server(httpServer, {
        cors: {
            origin: "*",  // Allow all origins (change in production!)
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']  // Support both WebSocket and long-polling
    })

    // Handle new client connections
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`)

        // When client subscribes to a deployment's logs
        socket.on('subscribe', (channel) => {
            // Join room (e.g., "deployment:123")
            socket.join(channel)
            console.log(`📡 Client ${socket.id} subscribed to channel: ${channel}`)

            // Send confirmation message
            socket.emit('message', JSON.stringify({
                log: `Subscribed to ${channel}`,
                timestamp: new Date().toISOString()
            }))
        })

        socket.on('subscribe-billing', async ({ firebaseUid }) => {
            try {
                console.log(`📥 subscribe-billing received from ${socket.id}:`, firebaseUid)

                if (!firebaseUid) {
                    console.warn(`⚠️ subscribe-billing missing firebaseUid for socket ${socket.id}`)
                    return
                }

                const user = await prisma.user.findUnique({ where: { firebaseUid } })
                if (!user) {
                    console.warn(`⚠️ subscribe-billing user not found for firebaseUid ${firebaseUid}`)
                    return
                }

                const room = `billing:${user.id}`
                socket.join(room)
                console.log(`📡 Socket ${socket.id} joined room ${room}`)

                const summary = await getBillingSummaryForUser(user.id)
                socket.emit('billing-update', summary)

                const intervalId = setInterval(async () => {
                    try {
                        const latest = await getBillingSummaryForUser(user.id)
                        socket.emit('billing-update', latest)
                    } catch (error) {
                        console.error('Billing socket update failed:', error.message)
                    }
                }, 30000)

                socket.data.billingIntervalId = intervalId
            } catch (error) {
                console.error('subscribe-billing failed:', error.message)
            }
        })

        // When client disconnects
        socket.on('disconnect', (reason) => {
            if (socket.data.billingIntervalId) {
                clearInterval(socket.data.billingIntervalId)
            }

            const normalDisconnectReasons = new Set([
                'client namespace disconnect',
                'server namespace disconnect',
                'transport close'
            ])

            if (normalDisconnectReasons.has(reason)) {
                console.log(`ℹ️ Client disconnected: ${socket.id}, reason: ${reason}`)
            } else {
                console.warn(`⚠️ Client disconnected unexpectedly: ${socket.id}, reason: ${reason}`)
            }
        })

        // Handle socket errors
        socket.on('error', (error) => {
            console.error(`⚠️ Socket error for ${socket.id}:`, error)
        })
    })

    return io
}

module.exports = { initializeSocketIO }