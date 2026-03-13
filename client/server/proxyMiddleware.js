import httpProxy from 'http-proxy'
import axios from 'axios'

const S3_OUTPUT_BASE =
    process.env.S3_OUTPUT_BASE ||
    'https://s3.ap-south-1.amazonaws.com/nexus-cloud-v2.0/__outputs'
const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:9000'

const proxy = httpProxy.createProxy()

// Add index.html when proxying the root path of a deployed project
proxy.on('proxyReq', (proxyReq, req) => {
    if (req.url === '/') {
        proxyReq.path += 'index.html'
    }
})

// Prevent server crashes on proxy errors
proxy.on('error', (err, req, res) => {
    console.error('❌ Proxy error:', err.message)
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

/**
 * Extract subdomain from hostname.
 * Returns null if the request is for the main app (no subdomain or www).
 */
function getSubdomain(hostname) {
    const host = (hostname || '').split(':')[0]
    const parts = host.split('.')
    if (parts.length <= 1) return null
    const subdomain = parts[0]
    if (subdomain === 'www') return null
    return subdomain
}

/**
 * Express middleware that detects deployed-project subdomain requests and
 * proxies them to the appropriate S3 static assets.
 * Falls through to next() for all other requests (main app, API calls, etc.).
 */
async function proxyMiddleware(req, res, next) {
    const hostname = req.hostname || (req.headers && req.headers.host) || ''
    const subdomain = getSubdomain(hostname)

    if (!subdomain) {
        return next()
    }

    console.log(`\n🌐 Subdomain request: ${subdomain} → ${req.url}`)

    try {
        const apiUrl = `${API_SERVER_URL}/api/resolve/${subdomain}`
        console.log(`   Resolving via: ${apiUrl}`)

        const response = await axios.get(apiUrl, {
            timeout: 10000,
            headers: { Accept: 'application/json' }
        })

        if (response.data.status !== 'success') {
            throw new Error(response.data.error || 'Failed to resolve subdomain')
        }

        const projectId = response.data.data.projectId
        const target = `${S3_OUTPUT_BASE}/${projectId}`
        console.log(`   ✅ Proxying to: ${target}`)

        return proxy.web(req, res, { target, changeOrigin: true })
    } catch (err) {
        const status = err.response ? err.response.status : null

        if (status === 404) {
            console.warn(`   ⚠️  Subdomain "${subdomain}" not found`)
            return res.status(404).send(`
                <html>
                    <head><title>Project Not Found</title></head>
                    <body>
                        <h1>404 - Project Not Found</h1>
                        <p>The subdomain "<strong>${subdomain}</strong>" does not exist or has no active deployment.</p>
                    </body>
                </html>
            `)
        }

        console.error(`   ❌ Error resolving subdomain "${subdomain}":`, err.message)
        return res.status(500).send(`
            <html>
                <head><title>Service Error</title></head>
                <body>
                    <h1>500 - Service Error</h1>
                    <p>Something went wrong while serving this site.</p>
                </body>
            </html>
        `)
    }
}

export default proxyMiddleware
