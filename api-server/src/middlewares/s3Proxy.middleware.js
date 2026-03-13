const httpProxy = require('http-proxy')
const analyticsService = require('../services/analytics.service')

const proxy = httpProxy.createProxy()

proxy.on('error', (err, req, res) => {
    console.error('❌ S3 Proxy Error:', err.message)
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

proxy.on('proxyReq', (proxyReq, req) => {
    if (req.url === '/') {
        proxyReq.path += 'index.html'
    }
})

async function s3ProxyMiddleware(req, res, next) {
    const BASE_PATH = process.env.BASE_PATH

    if (!BASE_PATH) {
        return next()
    }

    const hostname = req.hostname

    // Skip plain IP addresses and bare localhost
    if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return next()
    }

    const parts = hostname.split('.')

    // Only handle requests that have a subdomain (e.g. myapp.localhost or myapp.nexuscloud.app)
    if (parts.length < 2) {
        return next()
    }

    const subdomain = parts[0]

    // Skip reserved subdomains
    if (subdomain === 'api' || subdomain === 'www') {
        return next()
    }

    try {
        const result = await analyticsService.resolveSubdomain(subdomain)
        const { projectId } = result

        const target = `${BASE_PATH}/${projectId}`
        console.log(`🎯 S3 Proxy: ${subdomain} → ${target}`)

        return proxy.web(req, res, { target, changeOrigin: true })
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).send(`
                <html>
                    <head><title>Site Not Found</title></head>
                    <body>
                        <h1>404 - Site Not Found</h1>
                        <p>The subdomain "${subdomain}" does not exist or has no active deployment.</p>
                    </body>
                </html>
            `)
        }
        console.error('S3 Proxy error:', error)
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

module.exports = s3ProxyMiddleware
