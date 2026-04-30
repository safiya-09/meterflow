const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    totalRequests: {
        type: Number,
        default: 0
    },
    billableRequests: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    plan: {
        type: String,
        enum: ['FREE', 'PRO', 'ENTERPRISE'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate invoices for the same user, month, and year
billingSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Billing', billingSchema);
