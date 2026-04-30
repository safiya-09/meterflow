const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const Payment = require('../models/payment.model');
const crypto = require('crypto');

// @desc    Handle Stripe Webhooks
// @route   POST /api/payments/webhook/stripe
// @access  Public
exports.stripeWebhook = async (req, res) => {
    let event;
    const signature = req.headers['stripe-signature'];

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleStripeNewSubscription(session);
            break;
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            await handleStripePaymentSuccess(invoice);
            break;
        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            await handleStripeSubscriptionCancelled(subscription);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

// @desc    Handle Razorpay Webhooks
// @route   POST /api/payments/webhook/razorpay
// @access  Public
exports.razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
        const payment = payload.payment.entity;
        await handleRazorpayPaymentCaptured(payment);
    }

    res.json({ status: "ok" });
};

/* HELPERS */

async function handleStripeNewSubscription(session) {
    const userId = session.client_reference_id;
    const plan = session.metadata.plan;
    
    const user = await User.findById(userId);
    if (!user) return;

    user.plan = plan;
    user.subscriptionStatus = 'active';
    await user.save();

    await Subscription.findOneAndUpdate(
        { userId },
        {
            provider: 'stripe',
            providerSubscriptionId: session.subscription,
            plan: plan,
            amount: session.amount_total / 100,
            status: 'active',
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        { upsert: true }
    );
}

async function handleStripePaymentSuccess(invoice) {
    // Log additional payments here if needed
}

async function handleStripeSubscriptionCancelled(stripeSub) {
    const sub = await Subscription.findOne({ providerSubscriptionId: stripeSub.id });
    if (sub) {
        sub.status = 'expired';
        await sub.save();

        const user = await User.findById(sub.userId);
        if (user) {
            user.subscriptionStatus = 'expired';
            user.plan = 'free';
            await user.save();
        }
    }
}

async function handleRazorpayPaymentCaptured(payment) {
    // Find payment record by order ID and update status
    const paymentRecord = await Payment.findOne({ orderId: payment.order_id });
    if (paymentRecord) {
        paymentRecord.status = 'completed';
        paymentRecord.paymentId = payment.id;
        await paymentRecord.save();
    }
}
