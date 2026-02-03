const { Kafka, logLevel } = require('kafkajs')
const fs = require('fs')
const path = require('path')

// Create Kafka client
const kafka = new Kafka({
    clientId: `api-server`, // Identifies this application to Kafka
    brokers: [process.env.KAFKA_BROKER], // Kafka server address (e.g., "139.59.42.26:17290")
    
    logLevel: logLevel.WARN, // Reduce log noise (only show warnings and errors)
    
    // SSL/TLS Configuration for secure connection
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, '../../kafka.pem'), 'utf-8')], // Certificate file
        rejectUnauthorized: false  // Accept self-signed certificates (dev only!)
    },
    
    // Authentication (username/password)
    sasl: {
        username: process.env.KAFKA_USERNAME || 'avnadmin',
        password: process.env.KAFKA_PASSWORD,
        mechanism: 'plain' // Authentication method
    },
    
    // Connection settings
    connectionTimeout: 10000,  // Wait 10 seconds for connection
    requestTimeout: 30000,     // Wait 30 seconds for requests
    
    // Retry configuration (auto-retry on connection failures)
    retry: {
        initialRetryTime: 300,   // Start with 300ms wait
        retries: 10,             // Try 10 times before giving up
        maxRetryTime: 30000,     // Maximum 30 seconds between retries
        multiplier: 2,           // Double the wait time each retry (exponential backoff)
        factor: 0.2              // Add randomness to avoid thundering herd
    }
})

// Create consumer (receives messages from Kafka)
const consumer = kafka.consumer({ 
    groupId: 'api-server-logs-consumer', // Consumer group ID (tracks which messages were read)
    
    // Session configuration (prevents idle disconnections)
    sessionTimeout: 60000,      // 60 seconds - broker waits this long before considering consumer dead
    heartbeatInterval: 20000,   // 20 seconds - consumer sends "I'm alive" signal
    rebalanceTimeout: 60000,    // 60 seconds - time allowed for rebalancing
    metadataMaxAge: 30000       // 30 seconds - refresh metadata to keep connection active
})

// Export both kafka client and consumer
module.exports = {
    kafka,
    consumer
}