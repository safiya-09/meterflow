const express = require('express');
const router = express.Router();

const {
    getPlans,
    createCheckout,
    getMe,
    getHistory,
    cancelSubscription
} = require('../controllers/payment.controller');

const { protect } = require('../middleware/auth.middleware');

router.get('/plans', getPlans);
router.post('/checkout', protect, createCheckout);
router.get('/me', protect, getMe);
router.get('/history', protect, getHistory);
router.post('/cancel', protect, cancelSubscription);

module.exports = router;