const axios = require('axios');
const mongoose = require('mongoose');
const Api = require('../models/api.model');
const ApiKey = require('../models/apiKey.model');
const LoggingService = require('../services/logging.service');
const { hashString } = require('../utils/hash');

const gatewayMiddleware = async (req, res) => {
    const startTime = Date.now();

    // Extract apiId
    let apiId = req.params?.apiId;
    if (!apiId) {
        // Fallback: extract from URL
        const parts = req.originalUrl.split('?')[0].split('/');
        const gatewayIndex = parts.indexOf('gateway');
        if (gatewayIndex !== -1 && parts.length > gatewayIndex + 1) {
            apiId = parts[gatewayIndex + 1];
        }
    }

    if (!apiId) {
        return res.status(400).json({ success: false, message: 'Missing API ID in the request' });
    }

    if (!mongoose.Types.ObjectId.isValid(apiId)) {
        return res.status(400).json({ success: false, message: 'Invalid API ID format' });
    }

    // Extract path after /gateway/:apiId
    const apiIdPathSegment = `/${apiId}`;
    const afterApiIdIndex = req.originalUrl.indexOf(apiIdPathSegment) + apiIdPathSegment.length;
    let appendedPath = req.originalUrl.substring(afterApiIdIndex);
    
    // Remove query params from path because we pass req.query to axios directly
    const pathWithoutQuery = appendedPath.split('?')[0];

    const providedKey = req.header('x-api-key');

    if (!providedKey) {
        return res.status(401).json({ success: false, message: 'API key is missing' });
    }

    try {
        const hashedKey = hashString(providedKey);

        // Use lean queries for better performance
        const apiKeyDoc = await ApiKey.findOne({ key: hashedKey, apiId }).lean();
        
        if (!apiKeyDoc) {
            return res.status(401).json({ success: false, message: 'Invalid API key' });
        }

        if (apiKeyDoc.status !== 'active') {
            return res.status(403).json({ success: false, message: 'API key is revoked' });
        }

        // Rate Limiting Check
        const { checkRateLimit } = require('../services/rateLimit.service');
        const rateLimit = await checkRateLimit(apiKeyDoc._id, apiKeyDoc.plan || 'free');

        // Set Rate Limit Headers
        res.setHeader('X-RateLimit-Limit', rateLimit.limit);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimit.resetInSeconds);

        if (!rateLimit.allowed) {
            return res.status(429).json({
                success: false,
                message: "Rate limit exceeded"
            });
        }

        const apiDoc = await Api.findById(apiId).lean();

        if (!apiDoc) {
            return res.status(404).json({ success: false, message: 'API not found' });
        }

        if (apiDoc.status !== 'active') {
            return res.status(403).json({ success: false, message: 'API is inactive' });
        }

        // Security check: API key must belong to same user as API
        if (apiKeyDoc.userId.toString() !== apiDoc.userId.toString()) {
            return res.status(403).json({ success: false, message: 'API key does not belong to the API owner' });
        }

        // Construct target URL
        const baseUrl = apiDoc.baseUrl.replace(/\/$/, '');
        const safePath = pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`;
        const targetUrl = `${baseUrl}${safePath === '/' ? '' : safePath}`;
        
        console.log('DEBUG: targetUrl is', targetUrl);
        console.log('DEBUG: req.originalUrl is', req.originalUrl);

        // Forward headers except sensitive ones
        const forwardHeaders = { ...req.headers };
        delete forwardHeaders['host'];
        delete forwardHeaders['x-api-key'];
        delete forwardHeaders['content-length'];

        let response;
        try {
            response = await axios({
                method: req.method,
                url: targetUrl,
                headers: forwardHeaders,
                params: req.query,
                data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? req.body : undefined,
                responseType: 'arraybuffer', // Support binary data
                validateStatus: () => true // Resolve on any HTTP status code
            });
        } catch (error) {
            console.error('DEBUG: Axios request failed:', error.message, error.cause);
            response = {
                status: 502,
                headers: {},
                data: Buffer.from(JSON.stringify({ success: false, message: 'Bad Gateway: Failed to reach external API' }))
            };
        }

        const endTime = Date.now();
        const latency = endTime - startTime;

        // Log usage asynchronously via Service
        LoggingService.logUsage({
            userId: apiKeyDoc.userId,
            apiKeyId: apiKeyDoc._id,
            apiId: apiDoc._id,
            endpoint: safePath,
            method: req.method,
            statusCode: response.status,
            latency,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent')
        });

        // Forward response
        res.status(response.status);
        if (response.headers) {
             const resHeaders = { ...response.headers };
             delete resHeaders['transfer-encoding'];
             delete resHeaders['content-encoding']; // Express handles encoding
             res.set(resHeaders);
        }
        
        return res.send(response.data);

    } catch (error) {
        console.error('Gateway Error:', error);
        return res.status(500).json({ success: false, message: 'Internal Gateway Error' });
    }
};

module.exports = gatewayMiddleware;
