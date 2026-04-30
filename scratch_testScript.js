const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const axios = require('axios');

async function runTests() {
    console.log('🚀 Starting Test Database...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test_secret_for_qa';
    process.env.JWT_EXPIRE = '30d';
    process.env.PORT = 5050; // Use a different port
    process.env.NODE_ENV = 'development';

    console.log('🚀 Starting Server...');
    // We start the server by requiring it. The server.js calls connectDB() using process.env.MONGO_URI!
    require('./server.js');

    // Wait a brief moment for the express app to bind
    await new Promise(res => setTimeout(res, 2000));

    const baseURL = `http://localhost:${process.env.PORT}`;
    
    const report = {
        auth: "FAIL",
        api_management: "FAIL",
        api_keys: "FAIL",
        gateway: "FAIL",
        logging: "FAIL",
        negative_tests: "FAIL",
        issues: []
    };

    let token = null;
    let apiId = null;
    let rawApiKey = null;
    let keyId = null;

    try {
        // STEP 1: AUTH TEST
        console.log('--- STEP 1: AUTH TEST ---');
        try {
            const signupRes = await axios.post(`${baseURL}/api/auth/signup`, {
                name: "Test User",
                email: "qa@test.com",
                password: "Password123!",
                role: "api_owner"
            });
            token = signupRes.data.token;
            if (!token) throw new Error("No token returned");
            if (signupRes.data.user && signupRes.data.user.password) throw new Error("Password exposed");
            report.auth = "PASS";
        } catch(e) {
            report.issues.push(`Auth Error: ${e.response?.data?.message || e.message}`);
        }

        const authHeader = { Authorization: `Bearer ${token}` };

        // STEP 2: API MANAGEMENT TEST
        console.log('--- STEP 2: API MANAGEMENT TEST ---');
        try {
            const createApiRes = await axios.post(`${baseURL}/api/apis`, {
                name: "Pokemon API",
                description: "Test API for Pokemon",
                baseUrl: "https://pokeapi.co/api/v2"
            }, { headers: authHeader });
            
            apiId = createApiRes.data.data._id;
            if (!apiId) throw new Error("apiId not returned");

            const getApisRes = await axios.get(`${baseURL}/api/apis`, { headers: authHeader });
            if (!getApisRes.data.data.find(api => api._id === apiId)) throw new Error("API not found in list");
            
            report.api_management = "PASS";
        } catch(e) {
            report.issues.push(`API Management Error: ${e.response?.data?.message || e.message}`);
        }

        // STEP 3: API KEY TEST
        console.log('--- STEP 3: API KEY TEST ---');
        try {
            const genKeyRes = await axios.post(`${baseURL}/api/keys/${apiId}/generate`, {}, { headers: authHeader });
            rawApiKey = genKeyRes.data.data.plainKey;
            keyId = genKeyRes.data.data.id;
            if (!rawApiKey) throw new Error("Raw API key not returned");

            const getKeysRes = await axios.get(`${baseURL}/api/keys/${apiId}`, { headers: authHeader });
            const keyListed = getKeysRes.data.data[0];
            if (keyListed.key || keyListed.plainKey) throw new Error("Raw API key exposed in fetch");

            report.api_keys = "PASS";
        } catch(e) {
            report.issues.push(`API Keys Error: ${e.response?.data?.message || e.message}`);
        }

        // STEP 4: API GATEWAY TEST (CORE)
        console.log('--- STEP 4: GATEWAY TEST ---');
        try {
            const gatewayRes = await axios.get(`${baseURL}/gateway/${apiId}/pokemon/ditto`, {
                headers: { 'x-api-key': rawApiKey }
            });
            if (gatewayRes.status !== 200) throw new Error(`Expected status 200, got ${gatewayRes.status}`);
            if (gatewayRes.data.name !== 'ditto') throw new Error("Response body does not match actual Pokemon API");
            report.gateway = "PASS";
        } catch(e) {
            report.issues.push(`Gateway Error: ${e.response?.data?.message || e.message}`);
        }

        // STEP 5: DATABASE LOG TEST & ANALYTICS TEST
        console.log('--- STEP 5: LOGGING & ANALYTICS TEST ---');
        try {
            // Need to wait a tiny bit to allow async log to save
            await new Promise(res => setTimeout(res, 500));
            const UsageLog = mongoose.connection.models['UsageLog'];
            if (!UsageLog) throw new Error("UsageLog model not registered");
            const logs = await UsageLog.find({ apiId });
            if (logs.length === 0) throw new Error("No usage logs recorded");
            const log = logs[0];
            if (!log.userId || !log.apiKeyId || !log.endpoint || log.statusCode !== 200 || !log.latency) throw new Error("Log missing required fields (including userId)");
            
            // Call Analytics Endpoint
            const statsRes = await axios.get(`${baseURL}/api/logs/stats/${apiId}`, { headers: authHeader });
            const stats = statsRes.data.data;
            if (stats.totalRequests < 1 || typeof stats.successCount === 'undefined' || typeof stats.errorCount === 'undefined' || typeof stats.avgLatency === 'undefined') {
                throw new Error("Stats endpoint missing expected JSON fields");
            }
            
            report.logging = "PASS";
        } catch(e) {
            report.issues.push(`Logging Error: ${e.message}`);
        }

        // STEP 6 & 7: NEGATIVE & EDGE TEST CASES
        console.log('--- STEP 6: NEGATIVE TESTS ---');
        try {
            let passCount = 0;
            
            // Missing API Key (expect 401)
            try { await axios.get(`${baseURL}/gateway/${apiId}/pokemon/ditto`); } catch(e) { if (e.response?.status === 401) passCount++; }
            
            // Invalid API Key (expect 401)
            try { await axios.get(`${baseURL}/gateway/${apiId}/pokemon/ditto`, { headers: { 'x-api-key': 'WRONG' }}); } catch(e) { if (e.response?.status === 401) passCount++; }
            
            // Revoked API Key (expect 403)
            await axios.patch(`${baseURL}/api/keys/${apiId}/revoke/${keyId}`, {}, { headers: authHeader });
            try { await axios.get(`${baseURL}/gateway/${apiId}/pokemon/ditto`, { headers: { 'x-api-key': rawApiKey }}); } catch(e) { if (e.response?.status === 403) passCount++; }
            
            // Invalid apiId (expect 404 or 400)
            try { await axios.get(`${baseURL}/gateway/invalid-id/pokemon/ditto`, { headers: { 'x-api-key': rawApiKey }}); } catch(e) { if (e.response?.status === 404 || e.response?.status === 400) passCount++; }

            if (passCount !== 4) throw new Error("Not all negative tests passed the expected status codes");
            
            // Query params edge case
            // Create a new key since old one was revoked
            const genKeyRes2 = await axios.post(`${baseURL}/api/keys/${apiId}/generate`, {}, { headers: authHeader });
            const newKey = genKeyRes2.data.data.plainKey;
            
            const edgeRes = await axios.get(`${baseURL}/gateway/${apiId}/pokemon?limit=5`, { headers: { 'x-api-key': newKey } });
            if (!edgeRes.data.results || edgeRes.data.results.length !== 5) throw new Error("Query parameters were not forwarded correctly");

            report.negative_tests = "PASS";
            
        } catch(e) {
            report.issues.push(`Negative Test Error: ${e.response?.data?.message || e.message}`);
        }

    } catch (e) {
        console.error("Critical Test Failure", e);
    } finally {
        console.log('\n\n==== QA REPORT OUTPUT ====\n\n');
        console.log(JSON.stringify(report, null, 2));
        process.exit(0);
    }
}

runTests();
