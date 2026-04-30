const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
    console.log('🚀 Starting MeterFlow End-to-End API Test...\n');
    let token = '';
    let apiId = '';
    let keyId = '';

    const testEmail = `testuser_${Date.now()}@meterflow.com`;
    const testPassword = 'password123';

    try {
        // ==========================================
        // 1. AUTHENTICATION
        // ==========================================
        console.log('--- 1. AUTHENTICATION ---');
        
        console.log('Testing: POST /auth/signup');
        const signupRes = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email: testEmail, password: testPassword, role: 'api_owner' })
        });
        const signupData = await signupRes.json();
        console.log(signupData.success ? '✅ Signup Successful' : '❌ Signup Failed', signupData.success ? `(User: ${testEmail})` : signupData.message);

        console.log('\nTesting: POST /auth/login');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log(loginData.success ? '✅ Login Successful, JWT Received' : '❌ Login Failed');

        if (!token) throw new Error('Cannot proceed without token');

        // ==========================================
        // 2. API MANAGEMENT
        // ==========================================
        console.log('\n--- 2. API MANAGEMENT ---');

        console.log('Testing: POST /apis (Create API)');
        const createApiRes = await fetch(`${API_BASE}/apis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: 'My Test API', description: 'Testing Endpoints', baseUrl: 'https://api.example.com' })
        });
        const createApiData = await createApiRes.json();
        apiId = createApiData.data._id;
        console.log(createApiData.success ? `✅ API Created (ID: ${apiId})` : '❌ Create API Failed');

        console.log('\nTesting: GET /apis (Get All My APIs)');
        const getApisRes = await fetch(`${API_BASE}/apis`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getApisData = await getApisRes.json();
        console.log(getApisData.success ? `✅ Retrieved APIs (Count: ${getApisData.count})` : '❌ Get APIs Failed');

        console.log(`\nTesting: PUT /apis/${apiId} (Update API)`);
        const updateApiRes = await fetch(`${API_BASE}/apis/${apiId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ description: 'Updated Description' })
        });
        const updateApiData = await updateApiRes.json();
        console.log(updateApiData.success && updateApiData.data.description === 'Updated Description' ? '✅ API Updated' : '❌ Update API Failed');

        // ==========================================
        // 3. API KEY MANAGEMENT
        // ==========================================
        console.log('\n--- 3. API KEY MANAGEMENT ---');

        console.log(`Testing: POST /keys/${apiId}/generate (Generate Key)`);
        const genKeyRes = await fetch(`${API_BASE}/keys/${apiId}/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const genKeyData = await genKeyRes.json();
        keyId = genKeyData.data?.id;
        console.log(genKeyData.success ? `✅ API Key Generated (Plain Key: ${genKeyData.data.plainKey.substring(0, 8)}... Key ID: ${keyId})` : '❌ Generate Key Failed');

        console.log(`\nTesting: GET /keys/${apiId} (Get API Keys)`);
        const getKeysRes = await fetch(`${API_BASE}/keys/${apiId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getKeysData = await getKeysRes.json();
        console.log(getKeysData.success ? `✅ Retrieved API Keys (Count: ${getKeysData.count})` : '❌ Get Keys Failed');

        console.log(`\nTesting: POST /keys/${apiId}/rotate (Rotate Key)`);
        const rotateKeyRes = await fetch(`${API_BASE}/keys/${apiId}/rotate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ keyId: keyId })
        });
        const rotateKeyData = await rotateKeyRes.json();
        // Update keyId to the new one
        if(rotateKeyData.success) keyId = rotateKeyData.data.id;
        console.log(rotateKeyData.success ? `✅ API Key Rotated (New Key ID: ${rotateKeyData.data.id})` : '❌ Rotate Key Failed');

        console.log(`\nTesting: PATCH /keys/${apiId}/revoke/${keyId} (Revoke Key)`);
        const revokeKeyRes = await fetch(`${API_BASE}/keys/${apiId}/revoke/${keyId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const revokeKeyData = await revokeKeyRes.json();
        console.log(revokeKeyData.success ? '✅ API Key Revoked' : '❌ Revoke Key Failed');

        // ==========================================
        // 4. CLEANUP
        // ==========================================
        console.log('\n--- 4. CLEANUP ---');

        console.log(`Testing: DELETE /apis/${apiId} (Delete API)`);
        const deleteApiRes = await fetch(`${API_BASE}/apis/${apiId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const deleteApiData = await deleteApiRes.json();
        console.log(deleteApiData.success ? '✅ API Deleted successfully' : '❌ Delete API Failed');

        console.log('\n🎉 ALL TESTS COMPLETED 🎉');

    } catch (err) {
        console.error('\n💥 Test Script Failed:', err.message);
    }
};

runTests();
