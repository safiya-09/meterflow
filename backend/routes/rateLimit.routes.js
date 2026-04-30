const express = require('express');
const router = express.Router();
const { getRateLimitStatus } = require('../controllers/rateLimit.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/me', protect, getRateLimitStatus);

module.exports = router;
