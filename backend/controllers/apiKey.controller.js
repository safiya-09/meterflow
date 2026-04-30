const ApiKey = require('../models/apiKey.model');
const generateApiKey = require('../utils/generateApiKey');
const { hashString } = require('../utils/hash');

/**
 * @desc    Generate a new API key for a specific API
 * @route   POST /api/keys/:apiId/generate
 * @access  Private (api_owner, admin)
 */
// exports.generateKey = async (req, res) => {
//     try {
//         const plainKey = generateApiKey();
//         const hashedKey = hashString(plainKey);

//         const apiKey = await ApiKey.create({
//             userId: req.user.id,
//             apiId: req.params.apiId,
//             key: hashedKey,
//             status: 'active',
//             plan: req.body.plan || 'free'
//         });

//         res.status(201).json({
//             success: true,
//             data: {
//                 id: apiKey._id,
//                 key: plainKey,
//                 status: apiKey.status,
//                 plan: apiKey.plan,
//                 createdAt: apiKey.createdAt
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };
exports.generateKey = async (req, res) => {
    try {
        const plainKey = generateApiKey();

        // ✅ FIX: added await (important)
        const hashedKey = await hashString(plainKey);

        const apiKey = await ApiKey.create({
            userId: req.user.id,
            apiId: req.params.apiId,
            key: hashedKey,
            status: 'active',
            plan: req.body.plan || 'free'
        });

        res.status(201).json({
            success: true,
            data: {
                id: apiKey._id,
                key: plainKey,
                status: apiKey.status,
                plan: apiKey.plan,
                createdAt: apiKey.createdAt
            }
        });
    } catch (error) {
        console.error("Generate Key Error:", error); // 👈 helps debug
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @desc    Rotate (Regenerate) an API key for a specific API
 * @route   POST /api/keys/:apiId/rotate
 * @access  Private (api_owner, admin)
 */
exports.rotateKey = async (req, res) => {
    try {
        const { keyId } = req.body;

        const oldKey = await ApiKey.findOne({ _id: keyId, apiId: req.params.apiId });

        if (!oldKey) {
            return res.status(404).json({ success: false, message: 'API key not found for this API' });
        }

        // Revoke old key
        oldKey.status = 'revoked';
        await oldKey.save();

        // Generate new key
        const plainKey = generateApiKey();
        const hashedKey = hashString(plainKey);

        const newKey = await ApiKey.create({
            userId: req.user.id,
            apiId: req.params.apiId,
            key: hashedKey,
            status: 'active',
            plan: oldKey.plan
        });

        res.status(201).json({
            success: true,
            message: 'API Key rotated successfully. Old key revoked.',
            data: {
                id: newKey._id,
                key: plainKey,
                status: newKey.status,
                plan: newKey.plan,
                createdAt: newKey.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Revoke an API key
 * @route   PATCH /api/keys/:apiId/revoke/:keyId
 * @access  Private (api_owner, admin)
 */
exports.revokeKey = async (req, res) => {
    try {
        const apiKey = await ApiKey.findOne({ _id: req.params.keyId, apiId: req.params.apiId });

        if (!apiKey) {
            return res.status(404).json({ success: false, message: 'API key not found for this API' });
        }

        apiKey.status = 'revoked';
        await apiKey.save();

        res.status(200).json({
            success: true,
            message: 'API Key revoked successfully',
            data: apiKey
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all API keys for the logged in user across all APIs
 * @route   GET /api/keys/all
 * @access  Private (api_owner, admin)
 */
exports.getAllKeys = async (req, res) => {
    try {
        const query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user.id;
        }

        const keys = await ApiKey.find(query).select('-key').populate('apiId', 'name');

        res.status(200).json({
            success: true,
            count: keys.length,
            data: keys
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all API keys for a specific API
 * @route   GET /api/keys/:apiId
 * @access  Private (api_owner, admin)
 */
exports.getKeys = async (req, res) => {
    try {
        const keys = await ApiKey.find({ apiId: req.params.apiId }).select('-key');
        const { redisClient } = require('../config/redis');
        const { PLAN_LIMITS } = require('../services/rateLimit.service');

        const keysWithUsage = await Promise.all(keys.map(async (k) => {
            const usageKey = `ratelimit:${k._id}`;
            const currentUsageRaw = await redisClient.get(usageKey);
            const currentUsage = currentUsageRaw ? parseInt(currentUsageRaw) : 0;
            const limit = PLAN_LIMITS[k.plan] || PLAN_LIMITS.free;

            return {
                ...k.toObject(),
                usage: {
                    used: currentUsage,
                    limit,
                    remaining: Math.max(0, limit - currentUsage)
                }
            };
        }));

        res.status(200).json({
            success: true,
            count: keys.length,
            data: keysWithUsage
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
