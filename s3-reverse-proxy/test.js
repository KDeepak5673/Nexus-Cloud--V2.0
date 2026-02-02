// Simple test script for the S3 reverse proxy
const axios = require('axios');

async function testApiEndpoint() {
    try {
        console.log('Testing API endpoint...');
        const response = await axios.get('http://localhost:9000/api/resolve/test-subdomain');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('API Error:', error.response?.data || error.message);
    }
}

async function testProxyWithSubdomain() {
    try {
        console.log('Testing S3 proxy logic...');

        // Simulate the proxy logic
        const hostname = 'test-subdomain.localhost';
        const subdomain = hostname.split('.')[0];

        console.log(`Extracted subdomain: ${subdomain}`);

        const response = await axios.get(`http://localhost:9000/api/resolve/${subdomain}`);

        if (response.data.status === 'success') {
            const projectId = response.data.data.projectId;
            console.log(`✅ Successfully resolved to project ID: ${projectId}`);
        } else {
            console.log(`❌ Failed to resolve: ${response.data.error}`);
        }

    } catch (error) {
        console.log('❌ Proxy test failed:', error.response?.data?.error || error.message);
    }
}

// Run tests
async function runTests() {
    await testApiEndpoint();
    console.log('---');
    await testProxyWithSubdomain();
}

runTests();