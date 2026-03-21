const express = require('express')
require('dotenv').config()
const httpProxy = require('http-proxy')
const axios = require('axios')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { Kafka, logLevel } = require('kafkajs')

const app = express()
const PORT = process.env.PORT || 8000

const BASE_PATH = process.env.BASE_PATH
const API_SERVER_URL = process.env.API_SERVER_URL

// Validate required environment variables
if (!API_SERVER_URL || API_SERVER_URL === 'undefined') {
    console.error('❌ ERROR: API_SERVER_URL is not configured!')
    console.error('Please set API_SERVER_URL in your .env file')
    console.error('Example: API_SERVER_URL=http://localhost:9000')
    process.exit(1)
}

if (!BASE_PATH || BASE_PATH === 'undefined') {
    console.error('❌ ERROR: BASE_PATH is not configured!')
    console.error('Please set BASE_PATH in your .env file')
    console.error('Example: BASE_PATH=https://your-bucket.s3.region.amazonaws.com/__outputs')
    process.exit(1)
}

console.log('🔧 Configuration:')
console.log(`   PORT: ${PORT}`)
console.log(`   BASE_PATH: ${BASE_PATH}`)
console.log(`   API_SERVER_URL: ${API_SERVER_URL}`)

const proxy = httpProxy.createProxy()

let usageProducer = null
let kafkaStatus = 'idle'
let kafkaConnectPromise = null

function logKafka(message, meta) {
    if (meta !== undefined) {
        console.log(`[Kafka] ${message}`, meta)
        return
    }
    console.log(`[Kafka] ${message}`)
}

function buildKafkaSslConfig() {
    if (process.env.KAFKA_SSL === 'false') {
        return false
    }

    const explicitCaPath = process.env.KAFKA_CA_PATH
    const defaultCaPath = path.join(__dirname, '../api-server/kafka.pem')
    const caPath = explicitCaPath || defaultCaPath

    if (fs.existsSync(caPath)) {
        return {
            ca: [fs.readFileSync(caPath, 'utf-8')],
            rejectUnauthorized: false
        }
    }

    logKafka('SSL CA file not found, continuing with TLS without custom CA.', { caPath })
    return { rejectUnauthorized: false }
}

function getKafkaProducer() {
    if (usageProducer) return usageProducer

    const broker = process.env.KAFKA_BROKER
    if (!broker) {
        if (kafkaStatus !== 'disabled') {
            kafkaStatus = 'disabled'
            logKafka('KAFKA_BROKER not set, usage events are disabled.')
        }
        return null
    }

    logKafka('Initializing producer connection...', {
        broker,
        clientId: process.env.PROXY_KAFKA_CLIENT_ID || 's3-reverse-proxy',
        topic: process.env.BILLING_USAGE_TOPIC || 'billing-usage-events'
    })

    // const kafka = new Kafka({
    //     clientId: process.env.PROXY_KAFKA_CLIENT_ID || 's3-reverse-proxy',
    //     brokers: [broker],
    //     ssl: process.env.KAFKA_SSL === 'false' ? false : { rejectUnauthorized: false },
    //     sasl: process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
    //         ? {
    //             username: process.env.KAFKA_USERNAME,
    //             password: process.env.KAFKA_PASSWORD,
    //             mechanism: 'plain'
    //         }
    //         : undefined
    // })
    const kafka = new Kafka({
        clientId: process.env.PROXY_KAFKA_CLIENT_ID || 's3-reverse-proxy',
        brokers: [process.env.KAFKA_BROKER], // Kafka server address (e.g., "139.59.42.26:17290")

        logLevel: logLevel.WARN, // Reduce log noise (only show warnings and errors)

        // SSL/TLS Configuration for secure connection
        ssl: buildKafkaSslConfig(),

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

    usageProducer = kafka.producer({ allowAutoTopicCreation: true })
    kafkaStatus = 'connecting'
    kafkaConnectPromise = usageProducer.connect()
        .then(() => {
            kafkaStatus = 'ready'
            logKafka('Producer connected successfully.')
        })
        .catch((err) => {
            kafkaStatus = 'error'
            console.error('Failed to connect Kafka producer in proxy:', err.message)
            usageProducer = null
            kafkaConnectPromise = null
            throw err
        })
    return usageProducer
}

async function initializeKafkaOnStartup() {
    const producer = getKafkaProducer()
    if (!producer) {
        return
    }

    try {
        await kafkaConnectPromise
        if (kafkaStatus === 'ready') {
            logKafka('Startup check: producer is ready before serving traffic.')
        } else {
            logKafka('Startup check: producer is not ready yet, running in degraded metering mode.', {
                kafkaStatus
            })
        }
    } catch (error) {
        logKafka('Startup check: producer connection failed, continuing without metering until reconnect.', {
            error: error.message
        })
    }
}

async function publishEgressUsageEvent({ accountId, projectId, requestPath, contentLength, traceId }) {
    if (!accountId || !projectId || !contentLength || contentLength <= 0) {
        logKafka('Skipping usage event publish due to missing billing context or content length.', {
            hasAccountId: Boolean(accountId),
            hasProjectId: Boolean(projectId),
            contentLength
        })
        return
    }

    const producer = getKafkaProducer()
    if (!producer) {
        logKafka('Producer unavailable, egress event not published.')
        return
    }

    const egressMb = contentLength / (1024 * 1024)

    try {
        await producer.send({
            topic: process.env.BILLING_USAGE_TOPIC || 'billing-usage-events',
            messages: [{
                key: projectId,
                value: JSON.stringify({
                    eventId: crypto.randomUUID(),
                    sourceService: 's3-reverse-proxy',
                    eventType: 'proxy.egress',
                    accountId,
                    workspaceId: accountId,
                    projectId,
                    metricType: 'EGRESS_MB',
                    quantity: Number(egressMb.toFixed(6)),
                    timestamp: new Date().toISOString(),
                    traceId,
                    metadata: {
                        path: requestPath,
                        bytes: contentLength
                    }
                })
            }]
        })
        logKafka('Egress usage event published.', {
            projectId,
            accountId,
            egressMb: Number(egressMb.toFixed(6)),
            path: requestPath
        })
    } catch (error) {
        console.error('Failed to publish proxy egress usage event:', error.message)
    }
}

// Add proxy error handler to prevent crashes
proxy.on('error', (err, req, res) => {
    console.error('❌ Proxy Error:', err.message)
    if (!res.headersSent) {
        res.status(502).send(`
            <html>
                <head><title>Bad Gateway</title></head>
                <body>
                    <h1>502 - Bad Gateway</h1>
                    <p>Unable to fetch content from S3.</p>
                </body>
            </html>
        `)
    }
})

app.use(async (req, res) => {
    try {
        const hostname = req.hostname;
        const subdomain = hostname.split('.')[0];

        console.log(`\n🌐 Request for subdomain: ${subdomain}`);

        // Call API server to resolve subdomain to project info
        let projectId;

        try {
            const apiUrl = `${API_SERVER_URL}/api/resolve/${subdomain}`;
            console.log(`   Calling: ${apiUrl}`);

            const response = await axios.get(apiUrl, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                projectId = response.data.data.projectId;
                console.log(`   ✅ Resolved to project ID: ${projectId}`);
                const resolvedBillingAccountId =
                    response.data.data.billingAccountId ||
                    response.data.data.accountId ||
                    null

                req.billingAccountId = resolvedBillingAccountId
                if (!resolvedBillingAccountId) {
                    logKafka('Resolver did not return billing account id for project.', {
                        projectId,
                        subdomain
                    })
                }
            } else {
                throw new Error(response.data.error || 'Failed to resolve subdomain');
            }
        } catch (apiError) {
            console.error(`   ❌ Failed to resolve subdomain ${subdomain}:`);
            console.error(`      Error: ${apiError.message}`);
            if (apiError.response) {
                console.error(`      Status: ${apiError.response.status}`);
                console.error(`      Data:`, apiError.response.data);
            }

            // Return 404 page for unknown subdomains
            return res.status(404).send(`
                <html>
                    <head><title>Site Not Found</title></head>
                    <body>
                        <h1>404 - Site Not Found</h1>
                        <p>The subdomain "${subdomain}" does not exist or has no active deployment.</p>
                    </body>
                </html>
            `);
        }

        // Construct S3 path using project ID
        const resolvesTo = `${BASE_PATH}/${projectId}`;
        console.log(`   🎯 Proxying to: ${resolvesTo}`);

        // TODO: Add Kafka event logging for page visit analytics

        req.projectId = projectId

        return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });

    } catch (error) {
        console.error('❌ Proxy error:', error);
        return res.status(500).send(`
            <html>
                <head><title>Service Error</title></head>
                <body>
                    <h1>500 - Service Error</h1>
                    <p>Something went wrong while serving this site.</p>
                </body>
            </html>
        `);
    }
})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 's3-reverse-proxy',
        timestamp: new Date().toISOString()
    })
})

async function startServer() {
    await initializeKafkaOnStartup()

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 S3 Reverse Proxy Running on port ${PORT}`)
        console.log(`   Ready to accept requests...\n`)
    })
}

startServer().catch((error) => {
    console.error('❌ Failed to start reverse proxy:', error.message)
    process.exit(1)
})

proxy.on('proxyRes', (proxyRes, req) => {
    let bytes = 0

    proxyRes.on('data', (chunk) => {
        bytes += chunk.length
    })

    proxyRes.on('end', () => {
        console.log("📊 Actual bytes served:", bytes)

        publishEgressUsageEvent({
            accountId: req.billingAccountId,
            projectId: req.projectId,
            requestPath: req.url,
            contentLength: bytes,
            traceId: req.headers['x-request-id'] || null
        })
    })
})