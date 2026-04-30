const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

dotenv.config();

/* CONFIG IMPORTS */
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

/* ROUTES */
const auth = require('./routes/auth.routes');
const keys = require('./routes/apiKey.routes');
const apis = require('./routes/api.routes');
const gateway = require('./routes/gateway.routes');
const logs = require('./routes/log.routes');
const billing = require('./routes/billing.routes');
const rateLimit = require('./routes/rateLimit.routes');

const app = express();

/* CONNECT SERVICES */
connectDB();
connectRedis();

/* WEBHOOKS (MUST BE BEFORE express.json()) */
const { stripeWebhook, razorpayWebhook } = require('./controllers/webhook.controller');
app.post('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

/* MIDDLEWARE */
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/* ROUTES */
const payments = require('./routes/payment.routes');
app.use('/api/auth', auth);
app.use('/api/keys', keys);
app.use('/api/apis', apis);
app.use('/api/logs', logs);
app.use('/api/billing', billing);
app.use('/api/rate-limit', rateLimit);
app.use('/api/gateway', gateway);
app.use('/api/payments', payments);
app.post('/api/payments/webhook/razorpay', razorpayWebhook); // Razorpay can use json

/* ERROR HANDLER */
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

/* SERVER */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
});

/* UNHANDLED PROMISE */
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);

    server.close(() => process.exit(1));
});