const Api = require('../models/api.model');
const ApiKey = require('../models/apiKey.model');

/**
 * Middleware to check if the logged-in user owns the API resource
 */
const checkApiOwnership = async (req, res, next) => {
    try {
        const apiId = req.params.apiId || req.params.id;
        const api = await Api.findById(apiId);

        if (!api) {
            return res.status(404).json({ success: false, message: 'API not found' });
        }

        // Check ownership (admins can bypass if needed, but per prompt only owners manage)
        if (api.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to manage this API' });
        }

        req.api = api; // Attach API to request for controller use
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Middleware to check if the logged-in user owns the API Key
 */
const checkKeyOwnership = async (req, res, next) => {
    try {
        const keyId = req.params.keyId;
        const apiKey = await ApiKey.findById(keyId);

        if (!apiKey) {
            return res.status(404).json({ success: false, message: 'API Key not found' });
        }

        if (apiKey.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to manage this API Key' });
        }

        req.apiKey = apiKey;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { checkApiOwnership, checkKeyOwnership };
