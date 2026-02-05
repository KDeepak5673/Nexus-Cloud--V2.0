const { Server } = require('socket.io')


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

        // When client disconnects
        socket.on('disconnect', (reason) => {
            console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`)
        })

        // Handle socket errors
        socket.on('error', (error) => {
            console.error(`⚠️ Socket error for ${socket.id}:`, error)
        })
    })

    return io
}

module.exports = { initializeSocketIO }