/**
 * CLICKHOUSE CONFIGURATION
 * 
 * ClickHouse is a fast database for logs and analytics.
 * 
 * Why ClickHouse for logs?
 * - Optimized for INSERT-heavy workloads (millions of logs)
 * - Fast queries on large datasets
 * - Columnar storage (efficient for time-series data)
 * 
 * Your logs flow: Kafka → API → ClickHouse → Store forever
 */

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