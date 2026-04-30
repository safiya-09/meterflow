const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    apiKeyId: {
        type: mongoose.Schema.ObjectId,
        ref: 'ApiKey',
        required: true
    },
    apiId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Api',
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    statusCode: {
        type: Number,
        required: true
    },
    latency: {
        type: Number,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Optimization Indexes
usageLogSchema.index({ apiId: 1, timestamp: -1 });
usageLogSchema.index({ apiKeyId: 1, timestamp: -1 });
usageLogSchema.index({ userId: 1, timestamp: -1 });
usageLogSchema.index({ statusCode: 1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
