const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
    paymentId: {
        type: String, // Stripe Intent ID or Razorpay Payment ID
        required: true,
        unique: true
    },
    orderId: {
        type: String, // Specifically for Razorpay Orders
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
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    invoiceUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
