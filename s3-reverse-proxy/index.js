const express = require('express')
require('dotenv').config()
const httpProxy = require('http-proxy')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 8000

const BASE_PATH = process.env.BASE_PATH 
const API_SERVER_URL = process.env.API_SERVER_URL 

const proxy = httpProxy.createProxy()

app.use(async (req, res) => {
    try {
        const hostname = req.hostname;
        const subdomain = hostname.split('.')[0];

        console.log(`Request for subdomain: ${subdomain}`);

        // Call API server to resolve subdomain to project info
        let projectId;

        try {
            const response = await axios.get(`${API_SERVER_URL}/api/resolve/${subdomain}`);

            if (response.data.status === 'success') {
                projectId = response.data.data.projectId;
                console.log(`Resolved ${subdomain} to project ID: ${projectId}`);
            } else {
                throw new Error(response.data.error || 'Failed to resolve subdomain');
            }
        } catch (apiError) {
            console.error(`Failed to resolve subdomain ${subdomain}:`, apiError.response?.data?.error || apiError.message);

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
        console.log(`Proxying to: ${resolvesTo}`);

        // TODO: Add Kafka event logging for page visit analytics

        return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });

    } catch (error) {
        console.error('Proxy error:', error);
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

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))