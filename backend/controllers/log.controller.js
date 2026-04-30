const mongoose = require('mongoose');
const UsageLog = require('../models/usageLog.model');

/**
 * @desc    Get logs for all APIs owned by the user, or filter by specific criteria
 * @route   GET /api/logs
 * @access  Private (api_owner, admin)
 */
exports.getLogs = async (req, res) => {
    try {
        const { status, method, from, to } = req.query;

        // Base query - target user's context only
        const query = { userId: req.user.id };

        if (status) query.statusCode = parseInt(status, 10);
        if (method) query.method = method.toUpperCase();
        
        if (from || to) {
            query.timestamp = {};
            if (from) query.timestamp.$gte = new Date(from);
            if (to) query.timestamp.$lte = new Date(to);
        }

        // Apply lean to optimize heavy fetches
        const logs = await UsageLog.find(query)
            .sort({ timestamp: -1 })
            .limit(100) // Keep response sizes rational iteratively
            .lean();

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get logs for a specific API explicitly
 * @route   GET /api/logs/:apiId
 * @access  Private (api_owner, admin)
 */
exports.getApiLogs = async (req, res) => {
    try {
        const { status, method, from, to } = req.query;

        // Base query - secure API bounds logic internally to user reference
        const query = { 
            apiId: req.params.apiId,
            userId: req.user.id 
        };

        if (status) query.statusCode = parseInt(status, 10);
        if (method) query.method = method.toUpperCase();
        
        if (from || to) {
            query.timestamp = {};
            if (from) query.timestamp.$gte = new Date(from);
            if (to) query.timestamp.$lte = new Date(to);
        }

        const logs = await UsageLog.find(query)
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get aggregated analytics statistics for an existing API endpoint
 * @route   GET /api/logs/stats/:apiId
 * @access  Private (api_owner, admin)
 */
exports.getApiStats = async (req, res) => {
    try {
        const { apiId } = req.params;
        const userId = req.user.id;

        const matchStage = {
            $match: { 
                apiId: new mongoose.Types.ObjectId(apiId), 
                userId: new mongoose.Types.ObjectId(userId) 
            }
        };

        // Leverage MongoDB Aggregation pipelines natively ensuring C++ core computation max performance speed 
        const statsPipeline = [
            matchStage,
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    successCount: {
                        $sum: {
                            $cond: [{ $and: [{ $gte: ["$statusCode", 200] }, { $lt: ["$statusCode", 300] }] }, 1, 0]
                        }
                    },
                    errorCount: {
                        $sum: {
                            $cond: [{ $gte: ["$statusCode", 400] }, 1, 0]
                        }
                    },
                    avgLatency: { $avg: "$latency" }
                }
            }
        ];

        const results = await UsageLog.aggregate(statsPipeline);

        // Render basic blank schema if the endpoint has virtually no ping latency traffic
        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalRequests: 0,
                    successCount: 0,
                    errorCount: 0,
                    avgLatency: 0
                }
            });
        }

        const stats = results[0];
        
        res.status(200).json({
            success: true,
            data: {
                totalRequests: stats.totalRequests,
                successCount: stats.successCount,
                errorCount: stats.errorCount,
                avgLatency: Math.round(stats.avgLatency || 0)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
