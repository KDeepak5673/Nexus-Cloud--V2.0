import express from 'express'
import { createServer as createViteServer } from 'vite'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import proxyMiddleware from './proxyMiddleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(process.env.PORT || '3000', 10)
const isDev = process.env.NODE_ENV !== 'production'

async function startServer() {
    const app = express()

    // --- 1. S3 proxy middleware (subdomain deployments) ---
    app.use(proxyMiddleware)

    if (isDev) {
        // --- 2a. Development: use Vite in middleware mode for HMR ---
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa'
        })
        app.use(vite.middlewares)
        console.log('🔧 Running in development mode (Vite middleware)')
    } else {
        // --- 2b. Production: serve the pre-built React app from dist/ ---
        const distPath = path.join(__dirname, '../dist')

        if (!fs.existsSync(distPath)) {
            console.error('❌ dist/ folder not found. Run `npm run build` first.')
            process.exit(1)
        }

        app.use(express.static(distPath))

        // SPA fallback — serve index.html for all unmatched routes
        app.get('*', (_req, res) => {
            res.sendFile(path.join(distPath, 'index.html'))
        })

        console.log('🚀 Running in production mode (serving dist/)')
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✅ Client server listening on port ${PORT}`)
        console.log(`   S3_OUTPUT_BASE : ${process.env.S3_OUTPUT_BASE || 'https://s3.ap-south-1.amazonaws.com/nexus-cloud-v2.0/__outputs'}`)
        console.log(`   API_SERVER_URL : ${process.env.API_SERVER_URL || 'http://localhost:9000'}`)
        if (isDev) {
            console.log(`   Frontend       : http://localhost:${PORT}`)
            console.log(`   Subdomains     : http://<project>.localhost:${PORT}\n`)
        }
    })
}

startServer().catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
})
