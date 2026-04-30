const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';
const GATEWAY_URL = 'http://localhost:5000/api/gateway';

async function testRateLimit() {
    console.log('--- STARTING RATE LIMIT TEST ---');

    try {
        // 1. Get an API and its key
        const apisRes = await axios.get(`${API_BASE_URL}/apis`, {
            headers: { 'Authorization': `Bearer ${process.env.TEST_JWT}` }
        });
        const apiId = apisRes.data.data[0]._id;
        
        const keysRes = await axios.get(`${API_BASE_URL}/keys/${apiId}`, {
            headers: { 'Authorization': `Bearer ${process.env.TEST_JWT}` }
        });
        // We need the plain key, but we only have hashed keys in DB.
        // For testing, I'll generate a new one.
        
        console.log('Generating test key...');
        const genRes = await axios.post(`${API_BASE_URL}/keys/${apiId}/generate`, { plan: 'free' }, {
            headers: { 'Authorization': `Bearer ${process.env.TEST_JWT}` }
        });
        const plainKey = genRes.data.data.key;
        console.log('Test Key:', plainKey);

        // 2. Hit the gateway multiple times
        console.log('Hitting gateway...');
        for(let i = 0; i < 5; i++) {
            const start = Date.now();
            const res = await axios.get(`${GATEWAY_URL}/${apiId}/any-path`, {
                headers: { 'x-api-key': plainKey }
            });
            console.log(`Req ${i+1}: Status ${res.status}, Reset: ${res.headers['x-ratelimit-reset']}, Remaining: ${res.headers['x-ratelimit-remaining']}`);
        }

        // 3. Check "me" endpoint
        console.log('Checking /rate-limit/me ...');
        const meRes = await axios.get(`${API_BASE_URL}/rate-limit/me`, {
            headers: { 'Authorization': `Bearer ${process.env.TEST_JWT}` }
        });
        console.log('Me Data:', JSON.stringify(meRes.data.data, null, 2));

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

// testRateLimit();
