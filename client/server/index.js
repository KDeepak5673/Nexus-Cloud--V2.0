import express from 'express'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import dotenv from 'dotenv'
import { createProxyMiddleware } from './proxyMiddleware.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:9000'
const S3_OUTPUT_BASE =
    process.env.S3_OUTPUT_BASE ||
    'https://s3.ap-south-1.amazonaws.com/nexus-cloud-v2.0/__outputs'

console.log('🔧 Client server configuration:')
console.log(`   PORT:           ${PORT}`)
console.log(`   API_SERVER_URL: ${API_SERVER_URL}`)
console.log(`   S3_OUTPUT_BASE: ${S3_OUTPUT_BASE}`)

// ------------------------------------------------------------------
// 1. Subdomain proxy — handles deployed project requests
//    e.g. my-project.localhost:3000 or my-project.nexus-cloud.tech
// ------------------------------------------------------------------
app.use(createProxyMiddleware(API_SERVER_URL, S3_OUTPUT_BASE))

// ------------------------------------------------------------------
// 2. Static files — serve the built React app
// ------------------------------------------------------------------
const distDir = join(__dirname, '../dist')
app.use(express.static(distDir))

// ------------------------------------------------------------------
// 3. Health check
// ------------------------------------------------------------------
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'nexus-cloud-client',
        timestamp: new Date().toISOString()
    })
})

// ------------------------------------------------------------------
// 4. SPA fallback — let React Router handle all other routes
// ------------------------------------------------------------------
app.get('*', (_req, res) => {
    res.sendFile(join(distDir, 'index.html'))
})

const server = createServer(app)

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Nexus Cloud client server running on port ${PORT}`)
    console.log(`   Frontend:  http://localhost:${PORT}`)
    console.log(`   Projects:  http://<subdomain>.localhost:${PORT}\n`)
})
