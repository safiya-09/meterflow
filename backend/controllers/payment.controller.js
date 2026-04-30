const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const Payment = require('../models/payment.model');
const stripeService = require('../services/stripe.service');

const PLANS = {
    free: { price: 0, limits: 100 },
    pro: {
        price: 499,
        limits: 1000,
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID
    },
    growth: {
        price: 1499,
        limits: 10000,
        stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID
    }
};

// @desc    Get all plans
// @route   GET /api/payments/plans
// @access  Public
exports.getPlans = (req, res) => {
    res.status(200).json({
        success: true,
        data: [
            {
                id: 'free',
                name: 'Free',
                price: 0,
                features: ['100 requests/hour', 'Basic dashboard']
            },
            {
                id: 'pro',
                name: 'Pro',
                price: 499,
                features: ['1000 requests/hour', 'Priority support']
            },
            {
                id: 'growth',
                name: 'Growth',
                price: 1499,
                features: ['10000 requests/hour', 'Analytics + advanced limits']
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: null,
                features: ['Contact Sales']
            }
        ]
    });
};

// @desc    Create Stripe checkout session
// @route   POST /api/payments/checkout
// @access  Private
exports.createCheckout = async (req, res) => {
    try {
        const { plan, provider } = req.body;

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: "Plan is required"
            });
        }

        const user = await User.findById(req.user.id);

        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        if (plan === 'free') {
            return res.status(400).json({
                success: false,
                message: 'Free plan does not require checkout'
            });
        }

        const priceId = PLANS[plan].stripePriceId;

        if (!priceId) {
            return res.status(500).json({
                success: false,
                message: 'Stripe price ID missing for this plan'
            });
        }

        const session = await stripeService.createCheckoutSession(
            user,
            plan,
            priceId
        );

        return res.status(200).json({
            success: true,
            url: session.url,
            sessionId: session.id
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current subscription
// @route   GET /api/payments/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            userId: req.user.id
        });

        res.status(200).json({
            success: true,
            data: subscription
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getHistory = async (req, res) => {
    try {
        const payments = await Payment.find({
            userId: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: payments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Cancel subscription
// @route   POST /api/payments/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            userId: req.user.id
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        if (
            subscription.provider === 'stripe' &&
            subscription.providerSubscriptionId
        ) {
            await stripeService.cancelSubscription(
                subscription.providerSubscriptionId
            );
        }

        subscription.status = 'cancelled';
        await subscription.save();

        const user = await User.findById(req.user.id);

        if (user) {
            user.subscriptionStatus = 'cancelled';
            user.plan = 'free';
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};