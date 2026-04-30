const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: String,
        enum: ['stripe', 'razorpay'],
        required: true
    },
    providerSubscriptionId: {
        type: String,
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['pro', 'growth', 'enterprise'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'past_due'],
        default: 'active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    renewalDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
