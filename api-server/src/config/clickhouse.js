const { createClient } = require('@clickhouse/client')

// Create ClickHouse client
const clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST,  // ClickHouse server URL
    database: 'default',                 // Database name (can be changed)
    username: process.env.KAFKA_USERNAME || 'avnadmin', // Same credentials as Kafka
    password: process.env.CLICKHOUSE_PASSWORD
})

// Export for use in services
module.exports = clickhouseClient