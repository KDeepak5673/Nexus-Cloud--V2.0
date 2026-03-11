const express = require('express')
require('dotenv').config()
const httpProxy = require('http-proxy')
const axios = require('axios')

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 S3 Reverse Proxy Running on port ${PORT}`)
    console.log(`   Ready to accept requests...\n`)
})