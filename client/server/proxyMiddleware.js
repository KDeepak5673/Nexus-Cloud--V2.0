import axios from 'axios'
import httpProxy from 'http-proxy'

const proxy = httpProxy.createProxy()

// Prevent crashes on proxy errors
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

// Serve index.html when the root path is requested
proxy.on('proxyReq', (proxyReq, req) => {
    if (req.url === '/') {
        proxyReq.path += 'index.html'
    }
})

/**
 * Extracts the subdomain from a hostname.
 * Returns null if no subdomain is present.
 *
 * Examples:
 *   localhost            → null
 *   my-app.localhost     → 'my-app'
 *   nexus-cloud.tech     → null
 *   my-app.nexus-cloud.tech → 'my-app'
 */
function extractSubdomain(hostname) {
    const parts = hostname.split('.')

    if (parts.length === 1) {
        // e.g. 'localhost' — no subdomain
        return null
    }

    if (parts.length === 2) {
        // e.g. 'my-app.localhost' → subdomain; 'nexus-cloud.tech' → no subdomain
        return parts[1] === 'localhost' ? parts[0] : null
    }

    // 3+ parts: e.g. 'my-app.nexus-cloud.tech' → subdomain is parts[0]
    return parts[0]
}

/**
 * Creates an Express middleware that:
 *  1. Detects subdomain-based project requests
 *  2. Resolves the project ID via the API server
 *  3. Proxies the request to the corresponding S3 path
 *
 * @param {string} apiServerUrl   - Base URL for the API server (e.g. http://localhost:9000)
 * @param {string} s3OutputBase   - S3 base path for project outputs
 */
export function createProxyMiddleware(apiServerUrl, s3OutputBase) {
    return async (req, res, next) => {
        try {
            const hostname = req.hostname
            const subdomain = extractSubdomain(hostname)

            // Skip non-subdomain and reserved subdomains (www)
            if (!subdomain || subdomain === 'www') {
                return next()
            }

            console.log(`\n🌐 Subdomain request: ${subdomain} (${hostname})`)

            let projectId
            try {
                const apiUrl = `${apiServerUrl}/api/resolve/${subdomain}`
                console.log(`   Calling: ${apiUrl}`)

                const response = await axios.get(apiUrl, {
                    timeout: 10000,
                    headers: { Accept: 'application/json' }
                })

                if (response.data.status === 'success') {
                    projectId = response.data.data.projectId
                    console.log(`   ✅ Resolved to project ID: ${projectId}`)
                } else {
                    throw new Error(response.data.error || 'Failed to resolve subdomain')
                }
            } catch (apiError) {
                console.error(`   ❌ Failed to resolve subdomain "${subdomain}": ${apiError.message}`)
                if (apiError.response) {
                    console.error(`      Status: ${apiError.response.status}`)
                }
                return res.status(404).send(`
                    <html>
                        <head><title>Project Not Found</title></head>
                        <body>
                            <h1>404 - Project Not Found</h1>
                            <p>The project "${subdomain}" does not exist or has no active deployment.</p>
                        </body>
                    </html>
                `)
            }

            const target = `${s3OutputBase}/${projectId}`
            console.log(`   🎯 Proxying to: ${target}`)

            return proxy.web(req, res, { target, changeOrigin: true })
        } catch (error) {
            console.error('❌ Unexpected proxy middleware error:', error)
            if (!res.headersSent) {
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
    }
}
