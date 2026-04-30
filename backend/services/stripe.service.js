const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (user, plan, priceId) => {
    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/billing?canceled=true`,
        client_reference_id: user._id.toString(),
        customer_email: user.email,
        metadata: {
            userId: user._id.toString(),
            plan: plan
        }
    });
};

const cancelSubscription = async (subscriptionId) => {
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
};

const retrieveSubscription = async (subscriptionId) => {
    return await stripe.subscriptions.retrieve(subscriptionId);
};

module.exports = {
    createCheckoutSession,
    cancelSubscription,
    retrieveSubscription,
    stripe
};
